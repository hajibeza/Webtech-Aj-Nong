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

async function uploadProfileImage(req, res) {
	try {
		const user = req.user;
		if (!user) {
			return res.status(401).json({ success: false, message: 'Unauthorized' });
		}

		if (!req.file) {
			return res.status(400).json({ success: false, message: 'No file uploaded' });
		}

		// Create a public URL path (assuming /uploads is served statically)
		const imageUrl = '/uploads/profiles/' + req.file.filename;

		const updatedUser = authService.updateProfileImage(user.id, imageUrl);

		return res.json({
			success: true,
			data: updatedUser,
			message: 'Profile image updated successfully',
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			message: error.message || 'Failed to update profile image',
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

module.exports = { register, login, getMe, uploadProfileImage };
