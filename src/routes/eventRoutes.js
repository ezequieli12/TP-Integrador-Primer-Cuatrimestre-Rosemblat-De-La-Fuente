const express = require('express');
const router = express.Router();
const eventController = require('../controllers/event.controller');
const auth = require('../middlewares/auth.middleware');

router.get('/', eventController.list);
router.get('/:id', eventController.getById);

router.post('/', auth, eventController.create);
router.put('/', auth, eventController.update);
router.delete('/:id', auth, eventController.remove);

router.post('/:id/enrollment', auth, eventController.enroll);
router.delete('/:id/enrollment', auth, eventController.unenroll);

router.get('/:id/participants', eventController.participants);

module.exports = router;
