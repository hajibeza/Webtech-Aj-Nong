const express = require('express');
const bookingController = require('../controllers/bookingController');
const { verifyJWT } = require('../middleware/auth');

const router = express.Router();

router.get('/', verifyJWT, bookingController.getByUser);
router.post('/', verifyJWT, bookingController.create);
router.put('/:id', verifyJWT, bookingController.updateStatus);

module.exports = router;
