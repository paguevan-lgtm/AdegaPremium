import express from 'express';
import db from '../db';
import { authenticateToken } from '../middleware/auth';

const router = express.Router();

// Get all sales
router.get('/', authenticateToken, (req, res) => {
  const sales = db.prepare(`
    SELECT s.*, c.name as customer_name, u.name as user_name 
    FROM sales s
    LEFT JOIN customers c ON s.customer_id = c.id
    LEFT JOIN users u ON s.user_id = u.id
    ORDER BY s.created_at DESC
  `).all();
  res.json(sales);
});

// Create sale
router.post('/', authenticateToken, (req, res) => {
  const { customer_id, items, payment_method } = req.body;
  const user_id = (req as any).user.id;

  const createSale = db.transaction(() => {
    let total = 0;
    
    // Calculate total and verify stock
    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id) as any;
      if (!product) throw new Error(`Produto ${item.product_id} não encontrado`);
      if (product.stock < item.quantity) throw new Error(`Estoque insuficiente para ${product.name}`);
      
      total += product.sell_price * item.quantity;
    }

    // Insert Sale
    const saleStmt = db.prepare(`
      INSERT INTO sales (customer_id, user_id, total, payment_method)
      VALUES (?, ?, ?, ?)
    `);
    const saleInfo = saleStmt.run(customer_id, user_id, total, payment_method);
    const saleId = saleInfo.lastInsertRowid;

    // Insert Items and Update Stock
    const itemStmt = db.prepare(`
      INSERT INTO sale_items (sale_id, product_id, quantity, unit_price)
      VALUES (?, ?, ?, ?)
    `);
    const stockStmt = db.prepare(`
      UPDATE products SET stock = stock - ? WHERE id = ?
    `);

    for (const item of items) {
      const product = db.prepare('SELECT * FROM products WHERE id = ?').get(item.product_id) as any;
      itemStmt.run(saleId, item.product_id, item.quantity, product.sell_price);
      stockStmt.run(item.quantity, item.product_id);
    }

    // Handle "Fiado" (Debt)
    if (payment_method === 'fiado') {
      if (!customer_id) throw new Error('Cliente obrigatório para venda fiado');
      const debtStmt = db.prepare(`
        UPDATE customers SET debt = debt + ? WHERE id = ?
      `);
      debtStmt.run(total, customer_id);
    }

    // Log Activity
    db.prepare('INSERT INTO activity_logs (user_id, action, details) VALUES (?, ?, ?)').run(
      user_id,
      'sale',
      `Venda #${saleId} - Total: R$ ${total.toFixed(2)} - Método: ${payment_method}`
    );

    return { id: saleId, total };
  });

  try {
    const result = createSale();
    res.json(result);
  } catch (error: any) {
    res.status(400).json({ message: error.message });
  }
});

export default router;
