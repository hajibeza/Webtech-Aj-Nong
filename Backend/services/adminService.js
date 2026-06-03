const db = require('../db/database');

/**
 * Dashboard KPI metrics from SQLite.
 */
function getMetrics() {
	try {
		const classCount = db.prepare('SELECT COUNT(*) AS count FROM classes').get().count;
		const revenue = db
			.prepare(
				`SELECT COALESCE(SUM(amount), 0) AS total FROM bookings WHERE status = 'paid'`
			)
			.get().total;
		const seats = db
			.prepare(
				`SELECT COALESCE(SUM(seats_taken), 0) AS booked,
				        COALESCE(SUM(capacity), 0) AS total FROM classes`
			)
			.get();

		return {
			classCount,
			revenue,
			bookedSeats: seats.booked,
			totalSeats: seats.total,
		};
	} catch (error) {
		throw error;
	}
}

/**
 * Booking counts by hour for today's chart.
 */
function getBookingChart() {
	try {
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
	} catch (error) {
		throw error;
	}
}

module.exports = { getMetrics, getBookingChart };
