import express from 'express';
import db from '../db';
import { authenticateToken, authorizeAdmin } from '../middleware/auth';

const router = express.Router();

// Get all products
router.get('/', authenticateToken, (req, res) => {
  const products = db.prepare('SELECT * FROM products').all();
  res.json(products);
});

// Create product
router.post('/', authenticateToken, authorizeAdmin, (req, res) => {
  const { name, category, sku, cost_price, sell_price, stock, min_stock, supplier, image_url } = req.body;
  try {
    const stmt = db.prepare(`
      INSERT INTO products (name, category, sku, cost_price, sell_price, stock, min_stock, supplier, image_url)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);
    const info = stmt.run(name, category, sku, cost_price, sell_price, stock, min_stock, supplier, image_url);
    res.json({ id: info.lastInsertRowid, ...req.body });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Update product
router.put('/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  const { name, category, sku, cost_price, sell_price, stock, min_stock, supplier, image_url } = req.body;
  try {
    const stmt = db.prepare(`
      UPDATE products SET name = ?, category = ?, sku = ?, cost_price = ?, sell_price = ?, stock = ?, min_stock = ?, supplier = ?, image_url = ?
      WHERE id = ?
    `);
    stmt.run(name, category, sku, cost_price, sell_price, stock, min_stock, supplier, image_url, id);
    res.json({ id, ...req.body });
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

// Delete product
router.delete('/:id', authenticateToken, authorizeAdmin, (req, res) => {
  const { id } = req.params;
  db.prepare('DELETE FROM products WHERE id = ?').run(id);
  res.json({ message: 'Produto excluído' });
});

export default router;
