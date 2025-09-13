const jwt = require('jsonwebtoken');

function getTokenFromHeader(req) {
    const auth = req.headers['authorization'] || '';
    return auth.startsWith('Bearer ') ? auth.slice(7) : null;
}

exports.requireAuth = (req, res, next) => {
    const token = getTokenFromHeader(req);
    if (!token) return res.status(401).json({ error: 'Missing token' });
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
        // req.user: { email, name, iat, exp }
        return next();
    } catch (err) {
        return res.status(401).json({ error: 'Invalid or expired token' });
    }
};

// Optional auth: sets req.user if token is valid; otherwise continues unauthenticated
exports.tryAuth = (req, res, next) => {
    const token = getTokenFromHeader(req);
    if (!token) return next();
    try {
        req.user = jwt.verify(token, process.env.JWT_SECRET);
    } catch (_) {
        /* ignore invalid token for optional flows */
    }
    return next();
};
