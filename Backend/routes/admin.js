const express = require('express');
const adminController = require('../controllers/adminController');
const { verifyJWT, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(verifyJWT, requireAdmin);

router.get('/metrics', adminController.getMetrics);
router.get('/bookings', adminController.getAllBookings);
router.put('/bookings/:id/force-cancel', adminController.forceCancelBooking);

module.exports = router;
