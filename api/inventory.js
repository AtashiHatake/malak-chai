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
      host: dbUrl.hostname,
      port: dbUrl.port,
      user: dbUrl.username,
      password: decodeURIComponent(dbUrl.password),
      database: dbUrl.pathname.replace('/', ''),
      ssl: {
        minVersion: 'TLSv1.2',
        rejectUnauthorized: true
      }
    });

    
    if (req.method === 'GET') {
      const query = user.role === 'ADMIN'
        ? 'SELECT * FROM products ORDER BY id DESC'
        : 'SELECT id, name, sell_price, stock FROM products WHERE branch_id = ? ORDER BY name ASC';

      const params = user.role === 'ADMIN' ? [] : [user.branch_id];
      const [rows] = await connection.execute(query, params);
      return res.status(200).json(rows);
    }

    
    if (req.method === 'POST') {
      const body = req.body;

    
      if (body.action === 'ADD_PRODUCT') {
        if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Only admins can add products' });

        const { name, buy_price, sell_price, stock, branch_id } = body;
        await connection.execute(
          'INSERT INTO products (branch_id, name, buy_price, sell_price, stock) VALUES (?, ?, ?, ?, ?)',
          [branch_id, name, buy_price, sell_price, stock]
        );
        return res.status(201).json({ message: 'Product added successfully' });
      }

      
      if (body.action === 'EDIT_PRODUCT') {
        if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Only admins can edit products' });

        const { id, name, buy_price, sell_price, stock, branch_id } = body;
        await connection.execute(
          'UPDATE products SET name = ?, buy_price = ?, sell_price = ?, stock = ?, branch_id = ? WHERE id = ?',
          [name, buy_price, sell_price, stock, branch_id, id]
        );
        return res.status(200).json({ message: 'Product updated successfully' });
      }

     
      if (body.action === 'DELETE_PRODUCT') {
        if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Only admins can delete products' });

        const { id } = body;
        await connection.execute('DELETE FROM products WHERE id = ?', [id]);
        return res.status(200).json({ message: 'Product deleted successfully' });
      }

      
      if (body.cart) {
        for (const item of body.cart) {
          const [prodInfo] = await connection.execute(
            'SELECT buy_price FROM products WHERE id = ?',
            [item.id]
          );

          if (prodInfo.length > 0) {
            const buy_price = prodInfo[0].buy_price;
            const total_buy = buy_price * item.qty;
            const total_sell = item.sell_price * item.qty;
            const profit = total_sell - total_buy;

            await connection.execute(
              'INSERT INTO sales (branch_id, product_id, quantity, total_buy_cost, total_sell_price, profit) VALUES (?, ?, ?, ?, ?, ?)',
              [user.branch_id, item.id, item.qty, total_buy, total_sell, profit]
            );

            await connection.execute(
              'UPDATE products SET stock = stock - ? WHERE id = ?',
              [item.qty, item.id]
            );
          }
        }
        return res.status(200).json({ message: 'Sale recorded successfully' });
      }
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    console.error('API Error:', error);
    return res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
}