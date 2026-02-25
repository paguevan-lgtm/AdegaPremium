import express from 'express';
import bcrypt from 'bcryptjs';
import db from '../db';
import { authenticateToken, authorizeAdmin } from '../middleware/auth';

const router = express.Router();

// Get all users
router.get('/', authenticateToken, authorizeAdmin, (req, res) => {
  const users = db.prepare('SELECT id, name, email, role FROM users').all();
  res.json(users);
});

// Create user
router.post('/', authenticateToken, authorizeAdmin, (req, res) => {
  const { name, email, password, role } = req.body;
  
  // Check if email exists
  const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
  if (existing) {
    return res.status(400).json({ message: 'Email já cadastrado' });
  }

  const hashedPassword = bcrypt.hashSync(password, 10);
  
  try {
    const stmt = db.prepare('INSERT INTO users (name, email, password, role) VALUES (?, ?, ?, ?)');
    const info = stmt.run(name, email, hashedPassword, role);
    
    // Log activity
    const adminId = (req as any).user.id;
    db.prepare('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)').run(
      adminId,
      'create_user',
      `Criou usuário: ${name} (${role})`
    );

    res.json({ id: info.lastInsertRowid, name, email, role });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update user
router.put('/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  const { name, email, role, password } = req.body;

  try {
    if (password) {
      const hashedPassword = bcrypt.hashSync(password, 10);
      db.prepare('UPDATE users SET name = ?, email = ?, role = ?, password = ? WHERE id = ?').run(name, email, role, hashedPassword, id);
    } else {
      db.prepare('UPDATE users SET name = ?, email = ?, role = ? WHERE id = ?').run(name, email, role, id);
    }

    // Log activity
    const adminId = (req as any).user.id;
    db.prepare('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)').run(
      adminId,
      'update_user',
      `Atualizou usuário ID: ${id}`
    );

    res.json({ id, name, email, role });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete user
router.delete('/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  
  if (Number(id) === (req as any).user.id) {
    return res.status(400).json({ message: 'Não é possível excluir o próprio usuário' });
  }

  try {
    db.prepare('DELETE FROM users WHERE id = ?').run(id);
    
    // Log activity
    const adminId = (req as any).user.id;
    db.prepare('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)').run(
      adminId,
      'delete_user',
      `Excluiu usuário ID: ${id}`
    );

    res.json({ message: 'Usuário excluído' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Get user logs
router.get('/:id/logs', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  const logs = db.prepare(`
    SELECT * FROM activity_logs 
    WHERE user_id = ? 
    ORDER BY created_at DESC 
    LIMIT 50
  `).all(id);
  res.json(logs);
});

// Get user sales stats
router.get('/:id/stats', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  const stats = db.prepare(`
    SELECT 
      COUNT(*) as total_sales,
      SUM(total) as total_revenue,
      AVG(total) as average_ticket
    FROM sales 
    WHERE user_id = ?
  `).get(id);
  res.json(stats);
});

export default router;
