const authService = require('../services/authService');

async function register(req, res) {
	try {
		const { email, password, name, role } = req.body || {};
		if (!email || !password || !name) {
			return res.status(400).json({
				success: false,
				data: null,
				message: 'Email, password, and name are required',
			});
		}

		const user = await authService.register({ email, password, name, role });
		return res.status(201).json({
			success: true,
			data: user,
			message: 'Registration successful',
		});
	} catch (error) {
		const status = error.statusCode || 500;
		return res.status(status).json({
			success: false,
			data: null,
			message: error.message || 'Registration failed',
		});
	}
}

async function login(req, res) {
	try {
		const { email, password } = req.body || {};
		if (!email || !password) {
			return res.status(400).json({
				success: false,
				data: null,
				message: 'Email and password are required',
			});
		}

		const result = await authService.login({ email, password });
		return res.json({
			success: true,
			data: result,
			message: 'Login successful',
		});
	} catch (error) {
		const status = error.statusCode || 500;
		return res.status(status).json({
			success: false,
			data: null,
			message: error.message || 'Login failed',
		});
	}
}

async function getMe(req, res) {
	try {
		const user = authService.getUserById(req.user.id);
		return res.json({
			success: true,
			data: user,
			message: '',
		});
	} catch (error) {
		const status = error.statusCode || 500;
		return res.status(status).json({
			success: false,
			data: null,
			message: error.message || 'Failed to load profile',
		});
	}
}

module.exports = { register, login, getMe };
