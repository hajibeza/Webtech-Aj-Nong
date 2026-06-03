const express = require('express');
const adminController = require('../controllers/adminController');
const { verifyJWT, verifyAdmin } = require('../middleware/auth');

const router = express.Router();

router.use(verifyJWT, verifyAdmin);

router.get('/stats', adminController.getStats);
router.get('/metrics', adminController.getMetrics);
router.get('/users', adminController.getUsers);
router.delete('/users/:id', adminController.removeUser);
router.get('/classes', adminController.listClasses);
router.post('/classes', adminController.addClass);
router.put('/classes/:id', adminController.editClass);
router.delete('/classes/:id', adminController.removeClass);
router.get('/bookings', adminController.listBookings);
router.put('/bookings/:id/status', adminController.setBookingStatus);
router.put('/bookings/:id/force-cancel', (req, res, next) => {
	req.body = { status: 'canceled' };
	adminController.setBookingStatus(req, res, next);
});

module.exports = router;
