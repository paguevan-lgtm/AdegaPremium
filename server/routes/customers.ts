import express from 'express';
import db from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all customers
router.get('/', authenticateToken, (req, res) => {
  const customers = db.prepare('SELECT * FROM customers').all();
  res.json(customers);
});

// Create customer
router.post('/', authenticateToken, (req, res) => {
  const { name, phone, cpf, address, credit_limit } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO customers (name, phone, cpf, address, credit_limit)
      VALUES (?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, phone, cpf, address, credit_limit);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update customer
router.put('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { name, phone, cpf, address, credit_limit } = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE customers SET name = ?, phone = ?, cpf = ?, address = ?, credit_limit = ?
      WHERE id = ?
    `);
    stmt.run(name, phone, cpf, address, credit_limit, id);
    res.json({ id, ...req.body });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Register payment
router.post('/:id/payment', authenticateToken, (req, res) => {
  const { id } = req.params;
  const { amount } = req.body;
  try {
    const stmt = db.prepare('UPDATE customers SET debt = debt - ? WHERE id = ?');
    stmt.run(amount, id);
    res.json({ message: 'Pagamento registrado' });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete customer
router.delete('/:id', authenticateToken, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM customers WHERE id = ?').run(id);
  res.json({ message: 'Cliente excluído' });
});

export default router;
