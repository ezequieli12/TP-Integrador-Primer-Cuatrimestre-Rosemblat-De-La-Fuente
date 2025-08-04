const express = require('express');
const router = express.Router();
const eventLocationController = require('../controllers/eventLocationController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/', authenticateToken, eventLocationController.getAll);
router.get('/:id', authenticateToken, eventLocationController.getById);
router.post('/', authenticateToken, eventLocationController.create);
router.put('/:id', authenticateToken, eventLocationController.update);
router.delete('/:id', authenticateToken, eventLocationController.remove);

module.exports = router;
