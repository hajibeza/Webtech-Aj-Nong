const adminService = require('../services/adminService');
const bookingService = require('../services/bookingService');

function getMetrics(req, res) {
	try {
		const metrics = adminService.getMetrics();
		const chart = adminService.getBookingChart();
		return res.json({
			success: true,
			data: { metrics, chart },
			message: '',
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			data: null,
			message: error.message || 'Failed to load metrics',
		});
	}
}

function getAllBookings(req, res) {
	try {
		const items = bookingService.getAll();
		return res.json({
			success: true,
			data: { items },
			message: '',
		});
	} catch (error) {
		return res.status(500).json({
			success: false,
			data: null,
			message: error.message || 'Failed to load bookings',
		});
	}
}

function forceCancelBooking(req, res) {
	try {
		const booking = bookingService.adminForceCancel(req.params.id);
		return res.json({
			success: true,
			data: booking,
			message: 'Booking canceled and seat released',
		});
	} catch (error) {
		const status = error.statusCode || 500;
		return res.status(status).json({
			success: false,
			data: null,
			message: error.message || 'Failed to cancel booking',
		});
	}
}

module.exports = { getMetrics, getAllBookings, forceCancelBooking };
