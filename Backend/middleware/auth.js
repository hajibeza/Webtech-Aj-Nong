const jwt = require('jsonwebtoken');

/**
 * Verify JWT from Authorization: Bearer <token> header.
 */
function verifyJWT(req, res, next) {
	try {
		const authHeader = req.headers.authorization;
		if (!authHeader || !authHeader.startsWith('Bearer ')) {
			return res.status(401).json({
				success: false,
				data: null,
				message: 'Authentication required',
			});
		}

		const token = authHeader.slice(7);
		const decoded = jwt.verify(token, process.env.JWT_SECRET);
		req.user = decoded;
		next();
	} catch (error) {
		return res.status(401).json({
			success: false,
			data: null,
			message: 'Invalid or expired token',
		});
	}
}

/**
 * Require admin role after verifyJWT.
 */
function requireAdmin(req, res, next) {
	try {
		if (!req.user || req.user.role !== 'admin') {
			return res.status(403).json({
				success: false,
				data: null,
				message: 'Admin access required',
			});
		}
		next();
	} catch (error) {
		return res.status(500).json({
			success: false,
			data: null,
			message: 'Authorization failed',
		});
	}
}

module.exports = { verifyJWT, requireAdmin };
