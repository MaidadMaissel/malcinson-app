require('dotenv').config();
const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();

app.use(cors({ origin: '*' }));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use('/uploads', express.static(path.resolve('./uploads')));

const authRoutes = require('./routes/auth');
const employeeRoutes = require('./routes/employees');
const projectRoutes = require('./routes/projects');
const workHoursRoutes = require('./routes/workHours');
const expensesRoutes = require('./routes/expenses');
const paymentsRoutes = require('./routes/payments');

app.use('/api/auth', authRoutes);
app.use('/api/employees', employeeRoutes);
app.use('/api/projects', projectRoutes);
app.use('/api/work-hours', workHoursRoutes);
app.use('/api/expenses', expensesRoutes);
app.use('/api/payments', paymentsRoutes);

// Serve static React files
app.use(express.static(path.join(__dirname, '../frontend/dist')));

app.get('/api/health', (req, res) => res.json({ status: 'ok', app: 'Malcinson' }));

// Catch-all route to serve React index.html
app.use((req, res) => {
    res.sendFile(path.join(__dirname, '../frontend/dist/index.html'));
});

const PORT = process.env.PORT || 3001;

// Ensure DB is initialized before starting
const { getDb } = require('./database');
getDb().then(() => {
    app.listen(PORT, () => {
        console.log(`✅ Malcinson backend running on http://localhost:${PORT}`);
    });
}).catch(err => {
    console.error('Failed to init DB:', err);
    process.exit(1);
});
