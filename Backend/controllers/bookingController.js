const bookingService = require('../services/bookingService');

function getByUser(req, res) {
	try {
		const userId = req.user.id;
		const items = bookingService.getByUser(userId);
		return res.json({
			success: true,
			data: { items },
			message: '',
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			data: null,
			message: error.message || 'Failed to fetch bookings',
		});
	}
}

function create(req, res) {
	try {
		const { classId } = req.body || {};
		const userId = req.user.id;

		if (!classId) {
			return res.status(400).json({
				success: false,
				data: null,
				message: 'classId is required',
			});
		}

		const booking = bookingService.createBooking(userId, classId);
		return res.status(201).json({
			success: true,
			data: booking,
			message: 'Booking created',
		});
	} catch (error) {
		const status = error.statusCode || 500;
		return res.status(status).json({
			success: false,
			data: null,
			message: error.message || 'Failed to create booking',
		});
	}
}

function updateStatus(req, res) {
	try {
		const { status } = req.body || {};
		const userId = req.user.id;
		const { id } = req.params;

		if (!status) {
			return res.status(400).json({
				success: false,
				data: null,
				message: 'status is required',
			});
		}

		const booking = bookingService.updateBookingStatus(id, userId, status);
		return res.json({
			success: true,
			data: booking,
			message: 'Booking updated',
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

module.exports = { getByUser, create, updateStatus };
