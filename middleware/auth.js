// middleware/auth.js
const jwt = require('jsonwebtoken');

/**
 * tryAuth: attach req.user if a Bearer token is present & valid.
 * Does NOT block the request if missing/invalid.
 */
function tryAuth(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
        req.user = null;
        return next();
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        // Expect payload to include email
        req.user = { email: payload.email, ...payload };
    } catch (_err) {
        req.user = null; // token invalid, but don't block
    }
    next();
}

/**
 * requireAuth: requires a valid Bearer token; else 401.
 */
function requireAuth(req, res, next) {
    const auth = req.headers.authorization || '';
    const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;

    if (!token) {
        return res.status(401).json({ error: 'Missing Authorization Bearer token' });
    }

    try {
        const payload = jwt.verify(token, process.env.JWT_SECRET);
        if (!payload?.email) {
            return res.status(401).json({ error: 'Invalid token payload (email missing)' });
        }
        req.user = { email: payload.email, ...payload };
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
}

module.exports = { requireAuth, tryAuth };
