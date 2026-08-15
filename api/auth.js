import mysql from 'mysql2/promise';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';

const JWT_SECRET = process.env.JWT_SECRET;

export default async function handler(req, res) {
  if (req.method !== 'POST') return res.status(405).send('Method not allowed');

  const { username, password } = req.body;
  const dbUrl = new URL(process.env.DATABASE_URL);
  
  let connection;
  try {
    connection = await mysql.createConnection({
      host: dbUrl.hostname, 
      port: dbUrl.port, 
      user: dbUrl.username, 
      password: decodeURIComponent(dbUrl.password), 
      database: dbUrl.pathname.replace('/', ''), 
      ssl: { minVersion: 'TLSv1.2', rejectUnauthorized: true }
    });

    const [users] = await connection.execute('SELECT * FROM users WHERE username = ?', [username]);
    
    if (users.length === 0) return res.status(401).json({ error: 'Invalid credentials' });

    const user = users[0];
    let isMatch = false;

    
    if (user.password.startsWith('$2')) {
        isMatch = await bcrypt.compare(password, user.password);
    } else {
        isMatch = (password === user.password);
    }

    if (!isMatch) {
        return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { id: user.id, role: user.role, branch_id: user.branch_id }, 
      JWT_SECRET, 
      { expiresIn: '14h' }
    );

    res.status(200).json({ token, role: user.role, branch_id: user.branch_id });
  } catch (error) {
    console.error("Login Error:", error);
    res.status(500).json({ error: error.message });
  } finally {
    if (connection) await connection.end();
  }
}