const db = require('../db/database');
const classService = require('./classService');

function mapUserRow(row) {
	if (!row) return null;
	return {
		id: row.id,
		username: row.username || row.email,
		email: row.email,
		name: row.name,
		role: row.role,
		created_at: row.created_at,
	};
}

function getStats() {
	const totalUsers = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
	const totalClasses = db.prepare('SELECT COUNT(*) AS count FROM classes').get().count;
	const totalBookings = db.prepare('SELECT COUNT(*) AS count FROM bookings').get().count;
	const revenue = db
		.prepare(
			`SELECT COALESCE(SUM(amount), 0) AS total FROM bookings WHERE status = 'paid'`
		)
		.get().total;

	return {
		totalUsers,
		totalClasses,
		totalBookings,
		revenue,
	};
}

/** Dashboard KPI + chart (admin-dashboard.html template) */
function getDashboardMetrics() {
	const stats = getStats();
	const seats = db
		.prepare(
			`SELECT COALESCE(SUM(seats_taken), 0) AS booked,
			        COALESCE(SUM(capacity), 0) AS total FROM classes`
		)
		.get();

	return {
		metrics: {
			classCount: stats.totalClasses,
			revenue: stats.revenue,
			bookedSeats: seats.booked,
			totalSeats: seats.total,
			totalUsers: stats.totalUsers,
			totalBookings: stats.totalBookings,
		},
		chart: getBookingChart(),
	};
}

function getBookingChart() {
	const rows = db
		.prepare(
			`SELECT substr(created_at, 12, 2) AS hour, COUNT(*) AS count
			 FROM bookings
			 WHERE created_at IS NOT NULL AND length(created_at) >= 13
			 GROUP BY hour
			 ORDER BY hour`
		)
		.all();

	const labels = ['08', '10', '12', '14', '16', '18', '20'];
	const data = labels.map((label) => {
		const row = rows.find((r) => r.hour === label);
		return row ? row.count : 0;
	});

	return { labels: labels.map((h) => `${h}:00`), data };
}

function getAllUsers() {
	const rows = db
		.prepare(
			`SELECT id, username, email, name, role, created_at FROM users ORDER BY id ASC`
		)
		.all();
	return rows.map(mapUserRow);
}

function deleteUser(id) {
	const userId = Number(id);
	const user = db
		.prepare('SELECT id, role FROM users WHERE id = ?')
		.get(userId);
	if (!user) {
		const err = new Error('User not found');
		err.statusCode = 404;
		throw err;
	}
	if (user.role === 'admin') {
		const err = new Error('Cannot delete admin account');
		err.statusCode = 403;
		throw err;
	}
	db.prepare('DELETE FROM bookings WHERE user_id = ?').run(userId);
	db.prepare('DELETE FROM users WHERE id = ?').run(userId);
	return { id: userId };
}

function getAllClasses() {
	return classService.getAll();
}

function createClass(payload) {
	return classService.create(payload);
}

function updateClass(id, payload) {
	return classService.update(id, payload);
}

function deleteClass(id) {
	const bookingCount = db
		.prepare('SELECT COUNT(*) AS count FROM bookings WHERE class_id = ?')
		.get(id).count;
	if (bookingCount > 0) {
		const err = new Error('Cannot delete class with existing bookings');
		err.statusCode = 409;
		throw err;
	}
	return classService.remove(id);
}

function getAllBookings() {
	const rows = db
		.prepare(
			`SELECT b.id, b.user_id, b.class_id, b.amount, b.status, b.created_at,
			        u.username, u.email, u.name AS user_name,
			        c.title AS class_title, c.date AS class_date
			 FROM bookings b
			 JOIN users u ON u.id = b.user_id
			 JOIN classes c ON c.id = b.class_id
			 ORDER BY b.created_at DESC`
		)
		.all();

	return rows.map((row) => ({
		id: row.id,
		userId: row.user_id,
		classId: row.class_id,
		amount: row.amount,
		status: row.status,
		createdAt: row.created_at,
		user: {
			username: row.username || row.email,
			name: row.user_name,
		},
		classInfo: {
			title: row.class_title,
			date: row.class_date,
		},
	}));
}

function updateBookingStatus(id, status) {
	const allowed = ['pending', 'paid', 'canceled'];
	if (!allowed.includes(status)) {
		const err = new Error('Invalid status');
		err.statusCode = 400;
		throw err;
	}

	const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
	if (!booking) {
		const err = new Error('Booking not found');
		err.statusCode = 404;
		throw err;
	}

	const updateTx = db.transaction(() => {
		if (status === 'canceled' && booking.status !== 'canceled') {
			db.prepare(
				`UPDATE classes SET seats_taken = CASE WHEN seats_taken > 0 THEN seats_taken - 1 ELSE 0 END
				 WHERE id = ?`
			).run(booking.class_id);
		}

		if (status !== 'canceled' && booking.status === 'canceled') {
			const cls = classService.getById(booking.class_id);
			if (!cls || cls.seatsAvailable <= 0) {
				const err = new Error('Class is full');
				err.statusCode = 409;
				throw err;
			}
			db.prepare('UPDATE classes SET seats_taken = seats_taken + 1 WHERE id = ?').run(
				booking.class_id
			);
		}

		db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, id);
	});

	updateTx();

	const updated = db.prepare('SELECT * FROM bookings WHERE id = ?').get(id);
	const user = db
		.prepare('SELECT username, email, name FROM users WHERE id = ?')
		.get(updated.user_id);
	const cls = db.prepare('SELECT title, date FROM classes WHERE id = ?').get(updated.class_id);

	return {
		id: updated.id,
		userId: updated.user_id,
		classId: updated.class_id,
		amount: updated.amount,
		status: updated.status,
		createdAt: updated.created_at,
		user: { username: user?.username || user?.email, name: user?.name },
		classInfo: { title: cls?.title, date: cls?.date },
	};
}

module.exports = {
	getStats,
	getDashboardMetrics,
	getBookingChart,
	getAllUsers,
	deleteUser,
	getAllClasses,
	createClass,
	updateClass,
	deleteClass,
	getAllBookings,
	updateBookingStatus,
};
