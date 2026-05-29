const express = require('express');
const path = require('path');

const app = express();
const PORT = process.env.PORT || 3000;
const data = require('./mockData');

app.use(express.json());

// Allow local dev from file:// or different ports.
app.use((req, res, next) => {
	res.setHeader('Access-Control-Allow-Origin', '*');
	res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,DELETE,OPTIONS');
	res.setHeader('Access-Control-Allow-Headers', 'Content-Type');
	if (req.method === 'OPTIONS') {
		return res.sendStatus(204);
	}
	next();
});

const findClass = (classId) => data.classes.find((item) => item.id === classId);
const findUser = (userId) => data.users.find((item) => item.id === userId);

const mapClass = (item) => {
	const seatsAvailable = Math.max(0, item.capacity - item.seatsTaken);
	return {
		...item,
		seatsAvailable,
		isFull: seatsAvailable === 0,
	};
};

const mapBooking = (item) => {
	const classItem = findClass(item.classId);
	return {
		...item,
		user: findUser(item.userId) || null,
		classInfo: classItem
			? { id: item.classId, title: classItem.title }
			: null,
	};
};

app.get('/api/state', (req, res) => {
	data.system.updatedAt = new Date().toISOString();
	res.json({
		status: 'ok',
		system: data.system,
		serverTime: new Date().toISOString(),
		counts: {
			classes: data.classes.length,
			bookings: data.bookings.length,
		},
	});
});

app.get('/api/classes', (req, res) => {
	res.json({ items: data.classes.map(mapClass) });
});

app.get('/api/classes/:id', (req, res) => {
	const item = findClass(req.params.id);
	if (!item) {
		return res.status(404).json({ error: 'Class not found' });
	}
	res.json(mapClass(item));
});

app.get('/api/bookings', (req, res) => {
	const { userId } = req.query;
	const items = userId
		? data.bookings.filter((booking) => booking.userId === userId)
		: data.bookings;
	res.json({ items: items.map(mapBooking) });
});

app.post('/api/bookings', (req, res) => {
	const { classId, userId } = req.body || {};
	const cls = findClass(classId);
	const user = findUser(userId);

	if (!cls || !user) {
		return res.status(400).json({ error: 'Invalid classId or userId' });
	}

	const seatsAvailable = cls.capacity - cls.seatsTaken;
	if (seatsAvailable <= 0) {
		return res.status(409).json({ error: 'Class is full' });
	}

	cls.seatsTaken += 1;

	const booking = {
		id: `BK-${String(data.bookings.length + 1).padStart(3, '0')}`,
		userId,
		classId,
		amount: cls.price,
		status: 'pending',
		createdAt: new Date().toISOString(),
	};

	data.bookings.push(booking);
	res.status(201).json(mapBooking(booking));
});

app.put('/api/bookings/:id', (req, res) => {
	const { id } = req.params;
	const { status } = req.body;

	const booking = data.bookings.find((b) => b.id === id);
	if (!booking) {
		return res.status(404).json({ error: 'Booking not found' });
	}

	// Release class seat if status changes to canceled
	if (status === 'canceled' && booking.status !== 'canceled') {
		const cls = findClass(booking.classId);
		if (cls && cls.seatsTaken > 0) {
			cls.seatsTaken -= 1;
		}
	}

	// Re-reserve seat if status changes from canceled to paid/pending
	if (status !== 'canceled' && booking.status === 'canceled') {
		const cls = findClass(booking.classId);
		if (cls) {
			cls.seatsTaken += 1;
		}
	}

	if (status) {
		booking.status = status;
	}

	res.json(mapBooking(booking));
});


app.get('/api/admin/metrics', (req, res) => {
	const totalRevenue = data.bookings
		.filter((booking) => booking.status === 'paid')
		.reduce((sum, booking) => sum + booking.amount, 0);

	const totalSeats = data.classes.reduce((sum, item) => sum + item.capacity, 0);
	const bookedSeats = data.classes.reduce((sum, item) => sum + item.seatsTaken, 0);

	res.json({
		totals: {
			classes: data.classes.length,
			revenue: totalRevenue,
			bookedSeats,
			totalSeats,
		},
	});
});

app.use(express.static(path.join(__dirname, '..')));

app.listen(PORT, () => {
	console.log(`Server running on http://localhost:${PORT}`);
});
