const db = require('../db/database');

function mapRow(row) {
	if (!row) return null;
	const seatsAvailable = Math.max(0, row.capacity - row.seats_taken);
	let topics = [];
	try {
		topics = row.topics ? JSON.parse(row.topics) : [];
	} catch {
		topics = [];
	}
	return {
		id: row.id,
		title: row.title,
		category: row.category,
		instructor: row.instructor,
		date: row.date,
		timeStart: row.time_start,
		timeEnd: row.time_end,
		price: row.price,
		capacity: row.capacity,
		seatsTaken: row.seats_taken,
		seatsAvailable,
		isFull: seatsAvailable === 0,
		status: row.status,
		imageUrl: row.image_url,
		description: row.description,
		topics,
		createdAt: row.created_at,
	};
}

/**
 * Get all classes.
 */
function getAll() {
	try {
		const rows = db.prepare('SELECT * FROM classes ORDER BY date ASC').all();
		return rows.map(mapRow);
	} catch (error) {
		throw error;
	}
}

/**
 * Get a single class by id.
 * @param {string} id
 */
function getById(id) {
	try {
		const row = db.prepare('SELECT * FROM classes WHERE id = ?').get(id);
		return mapRow(row);
	} catch (error) {
		throw error;
	}
}

/**
 * Create a new class.
 * @param {object} payload
 */
function create(payload) {
	try {
		const id = payload.id || `cls-${Date.now()}`;
		db.prepare(
			`INSERT INTO classes (
				id, title, category, instructor, date, time_start, time_end,
				price, capacity, seats_taken, status, image_url, description, topics
			) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`
		).run(
			id,
			payload.title,
			payload.category,
			payload.instructor,
			payload.date,
			payload.timeStart,
			payload.timeEnd,
			payload.price,
			payload.capacity,
			payload.seatsTaken || 0,
			payload.status || 'open',
			payload.imageUrl || null,
			payload.description || null,
			JSON.stringify(payload.topics || [])
		);
		return getById(id);
	} catch (error) {
		throw error;
	}
}

/**
 * Update an existing class.
 * @param {string} id
 * @param {object} payload
 */
function update(id, payload) {
	try {
		const existing = getById(id);
		if (!existing) {
			const err = new Error('Class not found');
			err.statusCode = 404;
			throw err;
		}

		db.prepare(
			`UPDATE classes SET
				title = ?, category = ?, instructor = ?, date = ?,
				time_start = ?, time_end = ?, price = ?, capacity = ?,
				seats_taken = ?, status = ?, image_url = ?, description = ?, topics = ?
			WHERE id = ?`
		).run(
			payload.title ?? existing.title,
			payload.category ?? existing.category,
			payload.instructor ?? existing.instructor,
			payload.date ?? existing.date,
			payload.timeStart ?? existing.timeStart,
			payload.timeEnd ?? existing.timeEnd,
			payload.price ?? existing.price,
			payload.capacity ?? existing.capacity,
			payload.seatsTaken ?? existing.seatsTaken,
			payload.status ?? existing.status,
			payload.imageUrl ?? existing.imageUrl,
			payload.description ?? existing.description,
			JSON.stringify(payload.topics ?? existing.topics),
			id
		);

		return getById(id);
	} catch (error) {
		throw error;
	}
}

/**
 * Delete a class by id.
 * @param {string} id
 */
function remove(id) {
	try {
		const existing = getById(id);
		if (!existing) {
			const err = new Error('Class not found');
			err.statusCode = 404;
			throw err;
		}
		db.prepare('DELETE FROM classes WHERE id = ?').run(id);
		return existing;
	} catch (error) {
		throw error;
	}
}

module.exports = { getAll, getById, create, update, remove };
