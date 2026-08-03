import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';

const JWT_SECRET = process.env.JWT_SECRET;

const authenticate = (req) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) throw new Error('Unauthorized');
  return jwt.verify(token, JWT_SECRET);
};

export default async function handler(req, res) {
  let user;
  try {
    user = authenticate(req);
  } catch (e) {
    return res.status(401).json({ error: 'Please log in again' });
  }

  let connection;
  try {
    const dbUrl = new URL(process.env.DATABASE_URL);
    connection = await mysql.createConnection({
      host: dbUrl.hostname, port: dbUrl.port, user: dbUrl.username, password: decodeURIComponent(dbUrl.password), database: dbUrl.pathname.replace('/', ''), ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    if (req.method === 'GET') {
      // Get all customers for branch
      const [customers] = await connection.execute(
        'SELECT * FROM khata WHERE branch_id = ? ORDER BY updated_at DESC', 
        [user.branch_id]
      );

      // Fetch itemized logs for each customer
      for (let c of customers) {
        const [items] = await connection.execute(
          'SELECT * FROM khata_items WHERE khata_id = ? ORDER BY created_at DESC LIMIT 10', 
          [c.id]
        );
        c.items = items;
      }

      return res.status(200).json(customers);
    }

    if (req.method === 'POST') {
      const { action, id, name, items, payment_amount } = req.body;

      // 1. Create New Customer
      if (action === 'ADD_CUSTOMER') {
        await connection.execute('INSERT INTO khata (branch_id, name, balance) VALUES (?, ?, 0)', [user.branch_id, name]);
        return res.status(201).json({ message: 'Customer added' });
      }

      // 2. Add Products on Credit (Deducts Stock & Logs Tab)
      if (action === 'ADD_CREDIT_ITEMS') {
        let totalBill = 0;

        for (const item of items) {
          const itemTotal = item.sell_price * item.qty;
          totalBill += itemTotal;

          // Fetch wholesale price to record profit calculation
          const [prod] = await connection.execute('SELECT buy_price FROM products WHERE id = ?', [item.id]);
          const buy_price = prod[0]?.buy_price || 0;
          const total_buy = buy_price * item.qty;
          const profit = itemTotal - total_buy;

          // Deduct Product Stock
          await connection.execute('UPDATE products SET stock = stock - ? WHERE id = ?', [item.qty, item.id]);

          // Log into sales table for Admin analytics
          await connection.execute(
            'INSERT INTO sales (branch_id, product_id, quantity, total_buy_cost, total_sell_price, profit) VALUES (?, ?, ?, ?, ?, ?)',
            [user.branch_id, item.id, item.qty, total_buy, itemTotal, profit]
          );

          // Log itemized record under customer's khata
          await connection.execute(
            'INSERT INTO khata_items (khata_id, product_name, quantity, price, total) VALUES (?, ?, ?, ?, ?)',
            [id, item.name, item.qty, item.sell_price, itemTotal]
          );
        }

        // Increase customer balance owed
        await connection.execute('UPDATE khata SET balance = balance + ? WHERE id = ?', [totalBill, id]);
        return res.status(200).json({ message: 'Credit items added and stock updated' });
      }

      // 3. Settle Cash Payment
      if (action === 'SETTLE_PAYMENT') {
        await connection.execute('UPDATE khata SET balance = balance - ? WHERE id = ?', [payment_amount, id]);
        return res.status(200).json({ message: 'Payment settled' });
      }

      // 4. Delete Customer
      if (action === 'DELETE_CUSTOMER') {
        await connection.execute('DELETE FROM khata WHERE id = ?', [id]);
        await connection.execute('DELETE FROM khata_items WHERE khata_id = ?', [id]);
        return res.status(200).json({ message: 'Customer deleted' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });
  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
}