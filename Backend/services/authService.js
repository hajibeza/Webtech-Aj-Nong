const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const db = require('../db/database');

/**
 * Register a new user with a bcrypt-hashed password.
 * @param {{ email: string, password: string, name: string, role?: string }} payload
 */
async function register({ email, password, name, role = 'user' }) {
	try {
		const existing = db.prepare('SELECT id FROM users WHERE email = ?').get(email);
		if (existing) {
			const err = new Error('Email already registered');
			err.statusCode = 409;
			throw err;
		}

		const passwordHash = await bcrypt.hash(password, 10);
		const result = db
			.prepare(
				`INSERT INTO users (email, password_hash, name, role)
				 VALUES (?, ?, ?, ?)`
			)
			.run(email, passwordHash, name, role);

		const user = db
			.prepare('SELECT id, email, name, role, profile_image, created_at FROM users WHERE id = ?')
			.get(result.lastInsertRowid);

		return user;
	} catch (error) {
		throw error;
	}
}

/**
 * Authenticate user and return JWT token.
 * @param {{ email: string, password: string }} payload
 */
async function login({ email, password }) {
	try {
		const user = db
			.prepare('SELECT id, email, password_hash, name, role, profile_image FROM users WHERE email = ?')
			.get(email);

		if (!user) {
			const err = new Error('ไม่พบผู้ใช้');
			err.statusCode = 401;
			throw err;
		}

		const valid = await bcrypt.compare(password, user.password_hash);
		if (!valid) {
			const err = new Error('รหัสผ่านไม่ถูกต้อง');
			err.statusCode = 401;
			throw err;
		}

		if (!process.env.JWT_SECRET) {
			const err = new Error('JWT_SECRET missing in .env');
			err.statusCode = 500;
			throw err;
		}

		const token = jwt.sign(
			{ id: user.id, email: user.email, name: user.name, role: user.role, profile_image: user.profile_image },
			process.env.JWT_SECRET,
			{ expiresIn: '24h' }
		);

		return {
			token,
			user: {
				id: user.id,
				email: user.email,
				name: user.name,
				role: user.role,
				profile_image: user.profile_image,
			},
		};
	} catch (error) {
		throw error;
	}
}

/**
 * Get public profile by user id (from JWT).
 * @param {number} userId
 */
function getUserById(userId) {
	try {
		const user = db
			.prepare('SELECT id, email, name, role, profile_image, created_at FROM users WHERE id = ?')
			.get(userId);
		if (!user) {
			const err = new Error('User not found');
			err.statusCode = 404;
			throw err;
		}
		return user;
	} catch (error) {
		throw error;
	}
}

/**
 * Update user's profile image
 * @param {number} userId
 * @param {string} imageUrl
 */
function updateProfileImage(userId, imageUrl) {
	try {
		db.prepare('UPDATE users SET profile_image = ? WHERE id = ?').run(imageUrl, userId);
		return getUserById(userId);
	} catch (error) {
		throw error;
	}
}

module.exports = { register, login, getUserById, updateProfileImage };
