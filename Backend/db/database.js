require('dotenv').config({ path: require('path').join(__dirname, '../../.env') });

const Database = require('better-sqlite3');
const bcrypt = require('bcryptjs');
const path = require('path');

const dbPath = process.env.DB_PATH
	? path.resolve(process.cwd(), process.env.DB_PATH)
	: path.join(__dirname, 'database.db');

const db = new Database(dbPath);

db.pragma('foreign_keys = ON');

function initSchema() {
	db.exec(`
		CREATE TABLE IF NOT EXISTS users (
			id INTEGER PRIMARY KEY AUTOINCREMENT,
			email TEXT NOT NULL UNIQUE,
			password_hash TEXT NOT NULL,
			name TEXT NOT NULL,
			role TEXT NOT NULL DEFAULT 'user',
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS classes (
			id TEXT PRIMARY KEY,
			title TEXT NOT NULL,
			category TEXT NOT NULL,
			instructor TEXT NOT NULL,
			date TEXT NOT NULL,
			time_start TEXT NOT NULL,
			time_end TEXT NOT NULL,
			price INTEGER NOT NULL,
			capacity INTEGER NOT NULL,
			seats_taken INTEGER NOT NULL DEFAULT 0,
			status TEXT NOT NULL DEFAULT 'open',
			image_url TEXT,
			description TEXT,
			topics TEXT,
			created_at TEXT NOT NULL DEFAULT (datetime('now'))
		);

		CREATE TABLE IF NOT EXISTS bookings (
			id TEXT PRIMARY KEY,
			user_id INTEGER NOT NULL,
			class_id TEXT NOT NULL,
			amount INTEGER NOT NULL,
			status TEXT NOT NULL DEFAULT 'pending',
			created_at TEXT NOT NULL DEFAULT (datetime('now')),
			FOREIGN KEY (user_id) REFERENCES users(id),
			FOREIGN KEY (class_id) REFERENCES classes(id)
		);
	`);
}

function seedData() {
	const userCount = db.prepare('SELECT COUNT(*) AS count FROM users').get().count;
	if (userCount > 0) {
		return;
	}

	const insertUser = db.prepare(`
		INSERT INTO users (email, password_hash, name, role)
		VALUES (@email, @password_hash, @name, @role)
	`);

	const studentHash = bcrypt.hashSync('password123', 10);
	const adminHash = bcrypt.hashSync('admin123', 10);

	insertUser.run({
		email: 'student@example.com',
		password_hash: studentHash,
		name: 'Somchai R.',
		role: 'user',
	});

	insertUser.run({
		email: 'admin@example.com',
		password_hash: adminHash,
		name: 'Admin User',
		role: 'admin',
	});

	const insertClass = db.prepare(`
		INSERT INTO classes (
			id, title, category, instructor, date, time_start, time_end,
			price, capacity, seats_taken, status, image_url, description, topics
		) VALUES (
			@id, @title, @category, @instructor, @date, @time_start, @time_end,
			@price, @capacity, @seats_taken, @status, @image_url, @description, @topics
		)
	`);

	const classes = [
		{
			id: 'cls-1',
			title: 'React and Node.js Workshop',
			category: 'Programming',
			instructor: 'Somkiat',
			date: '2026-06-15',
			time_start: '09:00',
			time_end: '16:00',
			price: 2500,
			capacity: 30,
			seats_taken: 24,
			status: 'open',
			image_url: 'https://images.unsplash.com/photo-1516321318423-f06f85e504b3?auto=format&fit=crop&w=600&q=80',
			description: 'Build a fullstack web app using React and Node.js.',
			topics: JSON.stringify([
				'React components and hooks',
				'REST API with Express',
				'Database basics',
				'Authentication overview',
			]),
		},
		{
			id: 'cls-2',
			title: 'Python for Data Analysis',
			category: 'Data Science',
			instructor: 'Wittaya',
			date: '2026-06-20',
			time_start: '13:00',
			time_end: '17:00',
			price: 1800,
			capacity: 50,
			seats_taken: 15,
			status: 'open',
			image_url: 'https://images.unsplash.com/photo-1542744173-8e7e53415bb0?auto=format&fit=crop&w=600&q=80',
			description: 'Intro to data analysis with Python.',
			topics: JSON.stringify(['NumPy basics', 'Pandas for data wrangling', 'Simple charts']),
		},
		{
			id: 'cls-3',
			title: 'UX/UI Design Masterclass (Figma)',
			category: 'Design',
			instructor: 'Praew',
			date: '2026-06-22',
			time_start: '10:00',
			time_end: '15:00',
			price: 3200,
			capacity: 40,
			seats_taken: 40,
			status: 'closed',
			image_url: 'https://images.unsplash.com/photo-1561070791-2526d30994b5?auto=format&fit=crop&w=600&q=80',
			description: 'Design systems and UI prototypes using Figma.',
			topics: JSON.stringify(['Design systems', 'Wireframes', 'Prototyping']),
		},
		{
			id: 'cls-4',
			title: 'Digital Marketing & SEO Bootcamp',
			category: 'Marketing',
			instructor: 'Somkiat',
			date: '2026-06-25',
			time_start: '09:30',
			time_end: '12:30',
			price: 2200,
			capacity: 35,
			seats_taken: 8,
			status: 'open',
			image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
			description: 'Learn SEO, content marketing, and analytics to grow your brand online.',
			topics: JSON.stringify([
				'SEO fundamentals',
				'Social media strategy',
				'Google Analytics basics',
				'Content planning',
			]),
		},
	];

	for (const cls of classes) {
		insertClass.run(cls);
	}

	const insertBooking = db.prepare(`
		INSERT INTO bookings (id, user_id, class_id, amount, status, created_at)
		VALUES (@id, @user_id, @class_id, @amount, @status, @created_at)
	`);

	insertBooking.run({
		id: 'BK-001',
		user_id: 1,
		class_id: 'cls-1',
		amount: 2500,
		status: 'paid',
		created_at: '2026-05-27T10:15:00+07:00',
	});

	insertBooking.run({
		id: 'BK-002',
		user_id: 1,
		class_id: 'cls-3',
		amount: 3200,
		status: 'pending',
		created_at: '2026-05-27T11:30:00+07:00',
	});

	insertBooking.run({
		id: 'BK-003',
		user_id: 2,
		class_id: 'cls-2',
		amount: 1800,
		status: 'canceled',
		created_at: '2026-05-26T09:00:00+07:00',
	});
}

function seedMissingClasses() {
	const insertClass = db.prepare(`
		INSERT INTO classes (
			id, title, category, instructor, date, time_start, time_end,
			price, capacity, seats_taken, status, image_url, description, topics
		) VALUES (
			@id, @title, @category, @instructor, @date, @time_start, @time_end,
			@price, @capacity, @seats_taken, @status, @image_url, @description, @topics
		)
	`);

	const extraClasses = [
		{
			id: 'cls-4',
			title: 'Digital Marketing & SEO Bootcamp',
			category: 'Marketing',
			instructor: 'Somkiat',
			date: '2026-06-25',
			time_start: '09:30',
			time_end: '12:30',
			price: 2200,
			capacity: 35,
			seats_taken: 8,
			status: 'open',
			image_url: 'https://images.unsplash.com/photo-1460925895917-afdab827c52f?auto=format&fit=crop&w=600&q=80',
			description: 'Learn SEO, content marketing, and analytics to grow your brand online.',
			topics: JSON.stringify([
				'SEO fundamentals',
				'Social media strategy',
				'Google Analytics basics',
				'Content planning',
			]),
		},
	];

	const exists = db.prepare('SELECT id FROM classes WHERE id = ?');
	for (const cls of extraClasses) {
		if (!exists.get(cls.id)) {
			insertClass.run(cls);
		}
	}
}

initSchema();
seedData();
seedMissingClasses();

module.exports = db;
