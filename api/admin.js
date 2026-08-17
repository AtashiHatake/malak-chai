import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

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
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    if (req.method === 'GET') {
      if (req.query.type === 'branches') {
        if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Admins only' });
        const [branches] = await connection.execute('SELECT id, username, branch_id FROM users WHERE role = "BRANCH"');
        return res.status(200).json(branches);
      }

      const { filter } = req.query;
      let timeCondition = '';
      if (filter === 'today') timeCondition = 'AND DATE(created_at) = CURDATE()';
      if (filter === 'weekly') timeCondition = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 WEEK)';
      if (filter === 'monthly') timeCondition = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 MONTH)';
      if (filter === 'yearly') timeCondition = 'AND created_at >= DATE_SUB(CURDATE(), INTERVAL 1 YEAR)';

      let query, params;
      if (user.role === 'ADMIN') {
        query = `SELECT COALESCE(SUM(total_sell_price), 0) AS total_revenue, COALESCE(SUM(total_buy_cost), 0) AS total_cost, COALESCE(SUM(profit), 0) AS total_profit, COUNT(id) AS total_transactions FROM sales WHERE 1=1 ${timeCondition}`;
        params = [];
      } else {
        query = `SELECT COALESCE(SUM(total_sell_price), 0) AS total_revenue, 0 AS total_cost, 0 AS total_profit, COUNT(id) AS total_transactions FROM sales WHERE branch_id = ? ${timeCondition}`;
        params = [user.branch_id];
      }

      const [metrics] = await connection.execute(query, params);
      return res.status(200).json({ metrics: metrics[0] });
    }

    if (req.method === 'POST') {
      if (user.role !== 'ADMIN') return res.status(403).json({ error: 'Admins only' });

      const { action, username, password, branch_id, target_branch, admin_password, user_id, new_password } = req.body;

      if (action === 'RESET_DATA') {
        const [adminCheck] = await connection.execute(
          'SELECT * FROM users WHERE id = ?',
          [user.id]
        );

        if (adminCheck.length === 0) {
          return res.status(401).json({ error: 'Admin not found' });
        }

        const isMatch = await bcrypt.compare(admin_password, adminCheck[0].password) || (admin_password === adminCheck[0].password);

        if (!isMatch) {
          return res.status(401).json({ error: 'Incorrect Admin Password' });
        }

        if (target_branch === 'ALL') {
          await connection.execute('TRUNCATE TABLE sales');
        } else {
          await connection.execute('DELETE FROM sales WHERE branch_id = ?', [Number(target_branch)]);
        }

        return res.status(200).json({ message: 'Sales data successfully cleared' });
      }

      if (action === 'CREATE_BRANCH') {
          const hashedPass = await bcrypt.hash(password, 10);
          await connection.execute(
            'INSERT INTO users (username, password, role, branch_id) VALUES (?, ?, "BRANCH", ?)',
            [username, hashedPass, branch_id]
          );
          return res.status(201).json({ message: 'Branch created successfully' });
      }

      if (action === 'DELETE_BRANCH') {
          await connection.execute('DELETE FROM users WHERE id = ? AND role = "BRANCH"', [user_id]);
          return res.status(200).json({ message: 'Branch deleted' });
      }

      if (action === 'CHANGE_PASSWORD') {
          const hashedPass = await bcrypt.hash(new_password, 10);
          await connection.execute('UPDATE users SET password = ? WHERE id = ? AND role = "BRANCH"', [hashedPass, user_id]);
          return res.status(200).json({ message: 'Password updated' });
      }
      
      return res.status(400).json({ error: 'Invalid action provided' });
    }

    return res.status(405).json({ error: 'Method not allowed' });

  } catch (error) {
    return res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
}