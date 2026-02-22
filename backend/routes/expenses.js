const express = require('express');
const router = express.Router();
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { getDb, saveDb } = require('../database');
const { requireAuth, requireManager } = require('../middleware/auth');

const uploadsDir = path.resolve(process.env.UPLOADS_DIR || './uploads');
if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir, { recursive: true });

const storage = multer.diskStorage({
    destination: uploadsDir,
    filename: (req, file, cb) => {
        cb(null, Date.now() + '_' + file.originalname.replace(/[^a-zA-Z0-9.]/g, '_'));
    }
});
const upload = multer({ storage, limits: { fileSize: 10 * 1024 * 1024 } });

function rowsToObjects(rows) {
    if (!rows || !rows.length) return [];
    const cols = rows[0].columns;
    return rows[0].values.map(row => {
        const obj = {}; cols.forEach((c, i) => obj[c] = row[i]); return obj;
    });
}

// GET /api/expenses
router.get('/', requireAuth, async (req, res) => {
    const { phone, status, project_id } = req.query;
    const db = await getDb();
    let sql = `
    SELECT ex.*, e.name as employee_name, p.project_name
    FROM expenses ex
    JOIN employee e ON ex.phone = e.phone
    LEFT JOIN project p ON ex.project_id = p.project_id
    WHERE 1=1`;
    const params = [];
    if (phone) { sql += ` AND ex.phone=?`; params.push(phone); }
    if (status === 'unpaid') sql += ` AND ex.payment_status IS NULL`;
    if (status === 'paid') sql += ` AND ex.payment_status IS NOT NULL`;
    if (project_id) { sql += ` AND ex.project_id=?`; params.push(project_id); }
    sql += ` ORDER BY ex.created_at DESC`;
    const rows = db.exec(sql, params);
    res.json(rowsToObjects(rows));
});

// POST /api/expenses - log an expense
router.post('/', requireAuth, upload.single('invoice'), async (req, res) => {
    const { item_description, amount, project_id } = req.body;
    const phone = req.body.phone || req.user.phone;
    if (!item_description || !amount) return res.status(400).json({ error: 'תיאור וסכום נדרשים' });
    const db = await getDb();
    const invoice_image = req.file ? `/uploads/${req.file.filename}` : null;
    db.run(`INSERT INTO expenses (phone, project_id, item_description, amount, invoice_image)
    VALUES (?,?,?,?,?)`,
        [phone, project_id || null, item_description, parseFloat(amount), invoice_image]);
    saveDb();
    res.json({ success: true });
});

// PUT /api/expenses/:id - update expense (link to project, mark paid)
router.put('/:id', requireAuth, requireManager, async (req, res) => {
    const { project_id, payment_status } = req.body;
    const db = await getDb();
    if (project_id !== undefined) {
        db.run(`UPDATE expenses SET project_id=? WHERE id=?`, [project_id || null, req.params.id]);
    }
    if (payment_status !== undefined) {
        db.run(`UPDATE expenses SET payment_status=? WHERE id=?`,
            [payment_status || null, req.params.id]);
    }
    saveDb();
    res.json({ success: true });
});

// PUT /api/expenses/:id/pay
router.put('/:id/pay', requireAuth, requireManager, async (req, res) => {
    const db = await getDb();
    db.run(`UPDATE expenses SET payment_status='paid' WHERE id=?`, [req.params.id]);
    saveDb();
    res.json({ success: true });
});

// DELETE /api/expenses/:id
router.delete('/:id', requireAuth, async (req, res) => {
    const db = await getDb();
    db.run(`DELETE FROM expenses WHERE id=?`, [req.params.id]);
    saveDb();
    res.json({ success: true });
});

module.exports = router;
