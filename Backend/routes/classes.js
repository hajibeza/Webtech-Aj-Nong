const express = require('express');
const classController = require('../controllers/classController');
const { verifyJWT, requireAdmin } = require('../middleware/auth');

const router = express.Router();

router.get('/', classController.getAll);
router.get('/:id', classController.getById);
router.post('/', verifyJWT, requireAdmin, classController.create);
router.put('/:id', verifyJWT, requireAdmin, classController.update);
router.delete('/:id', verifyJWT, requireAdmin, classController.remove);

module.exports = router;
