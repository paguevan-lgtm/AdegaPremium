import express from 'express';
import db from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get rentals
router.get('/', authenticateToken, (req, res) => {
  const rentals = db.prepare(`
    SELECT r.*, c.name as customer_name 
    FROM rentals r
    JOIN customers c ON r.customer_id = c.id
    ORDER BY r.start_date DESC
  `).all();
  res.json(rentals);
});

// Create rental
router.post('/', authenticateToken, (req, res) => {
  const { customer_id, item_name, quantity, unit_price, start_date, end_date } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO rentals (customer_id, item_name, quantity, unit_price, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(customer_id, item_name, quantity, unit_price, start_date, end_date);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update rental status
router.put('/:id/status', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { status } = req.body;
  try {
    const stmt = db.prepare('UPDATE rentals SET status = ? WHERE id = ?');
    stmt.run(status, id);
    res.json({ id, status });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
