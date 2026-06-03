const adminService = require('../services/adminService');

function getStats(req, res) {
	try {
		const stats = adminService.getStats();
		return res.json({ success: true, data: stats, message: '' });
	} catch (error) {
		return res.status(500).json({
			success: false,
			data: null,
			message: error.message || 'Failed to load stats',
		});
	}
}

function getMetrics(req, res) {
	try {
		const data = adminService.getDashboardMetrics();
		return res.json({ success: true, data, message: '' });
	} catch (error) {
		return res.status(500).json({
			success: false,
			data: null,
			message: error.message || 'Failed to load metrics',
		});
	}
}

function getUsers(req, res) {
	try {
		const users = adminService.getAllUsers();
		return res.json({ success: true, data: users, message: '' });
	} catch (error) {
		return res.status(500).json({
			success: false,
			data: null,
			message: error.message || 'Failed to load users',
		});
	}
}

function removeUser(req, res) {
	try {
		const result = adminService.deleteUser(req.params.id);
		return res.json({
			success: true,
			data: result,
			message: 'User deleted',
		});
	} catch (error) {
		const status = error.statusCode || 500;
		return res.status(status).json({
			success: false,
			data: null,
			message: error.message || 'Failed to delete user',
		});
	}
}

function listClasses(req, res) {
	try {
		const classes = adminService.getAllClasses();
		return res.json({ success: true, data: classes, message: '' });
	} catch (error) {
		return res.status(500).json({
			success: false,
			data: null,
			message: error.message || 'Failed to load classes',
		});
	}
}

function addClass(req, res) {
	try {
		const body = req.body || {};
		if (!body.title || !body.category || !body.instructor || !body.date) {
			return res.status(400).json({
				success: false,
				data: null,
				message: 'title, category, instructor, and date are required',
			});
		}
		const created = adminService.createClass({
			id: body.id,
			title: body.title,
			category: body.category,
			instructor: body.instructor,
			date: body.date,
			timeStart: body.timeStart || '09:00',
			timeEnd: body.timeEnd || '17:00',
			price: Number(body.price) || 0,
			capacity: Number(body.capacity) || 30,
			seatsTaken: Number(body.seatsTaken) || 0,
			status: body.status || 'open',
			imageUrl: body.imageUrl || null,
			description: body.description || '',
			topics: body.topics || [],
		});
		return res.status(201).json({
			success: true,
			data: created,
			message: 'Class created',
		});
	} catch (error) {
		const status = error.statusCode || 500;
		return res.status(status).json({
			success: false,
			data: null,
			message: error.message || 'Failed to create class',
		});
	}
}

function editClass(req, res) {
	try {
		const updated = adminService.updateClass(req.params.id, req.body || {});
		return res.json({
			success: true,
			data: updated,
			message: 'Class updated',
		});
	} catch (error) {
		const status = error.statusCode || 500;
		return res.status(status).json({
			success: false,
			data: null,
			message: error.message || 'Failed to update class',
		});
	}
}

function removeClass(req, res) {
	try {
		const removed = adminService.deleteClass(req.params.id);
		return res.json({
			success: true,
			data: removed,
			message: 'Class deleted',
		});
	} catch (error) {
		const status = error.statusCode || 500;
		return res.status(status).json({
			success: false,
			data: null,
			message: error.message || 'Failed to delete class',
		});
	}
}

function listBookings(req, res) {
	try {
		const bookings = adminService.getAllBookings();
		return res.json({ success: true, data: bookings, message: '' });
	} catch (error) {
		return res.status(500).json({
			success: false,
			data: null,
			message: error.message || 'Failed to load bookings',
		});
	}
}

function setBookingStatus(req, res) {
	try {
		const { status } = req.body || {};
		if (!status) {
			return res.status(400).json({
				success: false,
				data: null,
				message: 'status is required',
			});
		}
		const booking = adminService.updateBookingStatus(req.params.id, status);
		return res.json({
			success: true,
			data: booking,
			message: 'Booking status updated',
		});
	} catch (error) {
		const status = error.statusCode || 500;
		return res.status(status).json({
			success: false,
			data: null,
			message: error.message || 'Failed to update booking',
		});
	}
}

module.exports = {
	getStats,
	getMetrics,
	getUsers,
	removeUser,
	listClasses,
	addClass,
	editClass,
	removeClass,
	listBookings,
	setBookingStatus,
};
