const jwt = require('jsonwebtoken');

function requireAuth(req, res, next) {
    const authHeader = req.headers['authorization'];
    if (!authHeader) return res.status(401).json({ error: 'לא מורשה' });
    const token = authHeader.split(' ')[1];
    if (!token) return res.status(401).json({ error: 'לא מורשה' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET || 'secret');
        next();
    } catch (e) {
        res.status(401).json({ error: 'טוקן לא תקין' });
    }
}

function requireManager(req, res, next) {
    if (!req.user || !req.user.is_manager) {
        return res.status(403).json({ error: 'גישה מוגבלת למנהלים בלבד' });
    }
    next();
}

module.exports = { requireAuth, requireManager };
