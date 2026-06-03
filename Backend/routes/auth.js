const express = require('express');
const multer = require('multer');
const path = require('path');
const authController = require('../controllers/authController');
const { verifyJWT } = require('../middleware/auth');

const router = express.Router();

// Set up multer for profile image uploads
const storage = multer.diskStorage({
	destination: function (req, file, cb) {
		cb(null, path.join(__dirname, '../../uploads/profiles'));
	},
	filename: function (req, file, cb) {
		const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
		const ext = path.extname(file.originalname);
		cb(null, 'profile-' + uniqueSuffix + ext);
	},
});

const upload = multer({
	storage: storage,
	limits: { fileSize: 5 * 1024 * 1024 }, // 5MB limit
	fileFilter: (req, file, cb) => {
		if (file.mimetype.startsWith('image/')) {
			cb(null, true);
		} else {
			cb(new Error('Only images are allowed'));
		}
	},
});

router.post('/register', authController.register);
router.post('/login', authController.login);
router.get('/me', verifyJWT, authController.getMe);
router.post('/profile-image', verifyJWT, upload.single('profileImage'), authController.uploadProfileImage);

module.exports = router;
