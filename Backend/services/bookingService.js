const db = require('../db/database');
const classService = require('./classService');

function mapBookingRow(row) {
	if (!row) return null;
	const classInfo = classService.getById(row.class_id);
	const user = db
		.prepare('SELECT id, name, role FROM users WHERE id = ?')
		.get(row.user_id);

	return {
		id: row.id,
		userId: row.user_id,
		classId: row.class_id,
		amount: row.amount,
		status: row.status,
		createdAt: row.created_at,
		user: user ? { id: user.id, name: user.name, role: user.role } : null,
		classInfo: classInfo ? { id: classInfo.id, title: classInfo.title } : null,
	};
}

/**
 * Create a booking for a class.
 * @param {number} userId
 * @param {string} classId
 */
function createBooking(userId, classId) {
	try {
		const cls = classService.getById(classId);
		if (!cls) {
			const err = new Error('Invalid classId');
			err.statusCode = 400;
			throw err;
		}

		if (cls.seatsAvailable <= 0) {
			const err = new Error('Class is full');
			err.statusCode = 409;
			throw err;
		}

		const count = db.prepare('SELECT COUNT(*) AS count FROM bookings').get().count;
		const bookingId = `BK-${String(count + 1).padStart(3, '0')}`;

		const createTx = db.transaction(() => {
			db.prepare('UPDATE classes SET seats_taken = seats_taken + 1 WHERE id = ?').run(classId);
			db.prepare(
				`INSERT INTO bookings (id, user_id, class_id, amount, status)
				 VALUES (?, ?, ?, ?, 'pending')`
			).run(bookingId, userId, classId, cls.price);
		});

		createTx();

		return mapBookingRow(
			db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId)
		);
	} catch (error) {
		throw error;
	}
}

/**
 * Get all bookings for a user.
 * @param {number} userId
 */
function getByUser(userId) {
	try {
		const rows = db
			.prepare('SELECT * FROM bookings WHERE user_id = ? ORDER BY created_at DESC')
			.all(userId);
		return rows.map(mapBookingRow);
	} catch (error) {
		throw error;
	}
}

/**
 * Cancel a booking and release the seat.
 * @param {string} bookingId
 * @param {number} userId
 */
function cancelBooking(bookingId, userId) {
	try {
		return updateBookingStatus(bookingId, userId, 'canceled');
	} catch (error) {
		throw error;
	}
}

/**
 * Update booking status (cancel, pay, etc.).
 * @param {string} bookingId
 * @param {number} userId
 * @param {string} status
 */
function updateBookingStatus(bookingId, userId, status) {
	try {
		const booking = db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId);
		if (!booking) {
			const err = new Error('Booking not found');
			err.statusCode = 404;
			throw err;
		}

		if (booking.user_id !== userId) {
			const err = new Error('Forbidden');
			err.statusCode = 403;
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

			db.prepare('UPDATE bookings SET status = ? WHERE id = ?').run(status, bookingId);
		});

		updateTx();

		return mapBookingRow(
			db.prepare('SELECT * FROM bookings WHERE id = ?').get(bookingId)
		);
	} catch (error) {
		throw error;
	}
}

module.exports = { createBooking, getByUser, cancelBooking, updateBookingStatus };
