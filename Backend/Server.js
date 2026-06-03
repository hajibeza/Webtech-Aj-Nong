require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

if (!process.env.JWT_SECRET) {
	throw new Error('JWT_SECRET missing in .env');
}

const express = require('express');
const path = require('path');

const db = require('./db/database');
const userRows = db.prepare('SELECT id, email, name, role FROM users').all();
// console.log(`[auth] users in database: ${userRows.length}`, userRows);

const authRoutes = require('./routes/auth');
const classRoutes = require('./routes/classes');
const bookingRoutes = require('./routes/bookings');
const adminRoutes = require('./routes/admin');

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(204);
	}
	next();
});

app.use('/api/auth', authRoutes);
app.use('/api/classes', classRoutes);
app.use('/api/bookings', bookingRoutes);
app.use('/api/admin', adminRoutes);

app.use(express.static(path.join(__dirname, '..')));
app.use('/uploads', express.static(path.join(__dirname, '../uploads')));

app.use((req, res) => {
	res.status(404).json({
		success: false,
		data: null,
		message: 'Route not found',
	});
});

app.use((err, req, res, _next) => {
	console.error(err);
	res.status(500).json({
		success: false,
		data: null,
		message: 'Internal server error',
	});
});

const server = app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});

server.on('error', (err) => {
	if (err.code === 'EADDRINUSE') {
		console.error(
			`Port ${PORT} is already in use. Stop the other server or change PORT in .env`
		);
	} else {
		console.error('Failed to start server:', err.message);
	}
	process.exit(1);
});
