import express from 'express';
import db from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

router.get('/stats', authenticateToken, (req, res) => {
  const today = new Date().toISOString().split('T')[0];
  const startOfMonth = new Date(new Date().getFullYear(), new Date().getMonth(), 1).toISOString().split('T')[0];

  const dailySales = db.prepare(`
    SELECT SUM(total) as total FROM sales WHERE date(created_at) = ?
  `).get(today) as any;

  const monthlySales = db.prepare(`
    SELECT SUM(total) as total FROM sales WHERE date(created_at) >= ?
  `).get(startOfMonth) as any;

  const lowStock = db.prepare(`
    SELECT COUNT(*) as count FROM products WHERE stock <= min_stock
  `).get() as any;

  const activeRentals = db.prepare(`
    SELECT COUNT(*) as count FROM rentals WHERE status = 'active'
  `).get() as any;

  const totalCustomers = db.prepare(`
    SELECT COUNT(*) as count FROM customers
  `).get() as any;

  const topProducts = db.prepare(`
    SELECT p.name, SUM(si.quantity) as quantity
    FROM sale_items si
    JOIN products p ON si.product_id = p.id
    GROUP BY p.id
    ORDER BY quantity DESC
    LIMIT 5
  `).all();

  const recentSales = db.prepare(`
    SELECT id, total, created_at 
    FROM sales 
    ORDER BY created_at DESC 
    LIMIT 5
  `).all();

  res.json({
    dailySales: dailySales?.total || 0,
    monthlySales: monthlySales?.total || 0,
    lowStock: lowStock?.count || 0,
    activeRentals: activeRentals?.count || 0,
    totalCustomers: totalCustomers?.count || 0,
    topProducts,
    recentSales
  });
});

export default router;
