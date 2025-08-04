const express = require('express');
const router = express.Router();
const eventController = require('../controllers/eventController');
const authenticateToken = require('../middleware/authMiddleware');

router.get('/', eventController.getAllEvents);
router.get('/:id', eventController.getEventById);

router.post('/', authenticateToken, eventController.createEvent);
router.put('/', authenticateToken, eventController.updateEvent);
router.delete('/:id', authenticateToken, eventController.deleteEvent);

router.post('/:id/enrollment', authenticateToken, eventController.enrollToEvent);
router.delete('/:id/enrollment', authenticateToken, eventController.unenrollFromEvent);

module.exports = router;
