require('dotenv').config({ path: require('path').join(__dirname, '../.env') });

const express = require('express');
const path = require('path');

require('../src/db/database');

const authRoutes = require('../src/routes/auth');
const classRoutes = require('../src/routes/classes');
const bookingRoutes = require('../src/routes/bookings');

const app = express();
const PORT = process.env.PORT || 3000;

// ★ [Phase 2 — ข้อ 1] JWT Authentication Layer
const jwt = require('jsonwebtoken');
const JWT_SECRET = 'skillshare-secret-key-2026'; // Mock secret สำหรับโปรเจคเรียน

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

app.use(express.static(path.join(__dirname, '..')));

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

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
