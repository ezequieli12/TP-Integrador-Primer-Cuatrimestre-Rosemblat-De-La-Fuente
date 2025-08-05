import express from 'express';
import {
getHello,
getAllEvents,
getEventById,
createEvent,
updateEvent,
deleteEvent,
enrollInEvent,
cancelEnrollment,
getEventParticipants,
getEventByName,
getEventByStartDate,
getEventByTag
} from '../src/controllers/event-controller.js';
import { registerUser, loginUser } from '../src/controllers/user-controller.js';
import {
    getUserEventLocations,
    getEventLocationById,
    createEventLocation,
    updateEventLocation,
    deleteEventLocation
} from '../src/controllers/event-location-controller.js';
import { authenticateToken } from '../middleware/autenticar.js';

const router = express.Router();
router.get('/hello', getHello);
router.post('/user/register', registerUser);
router.post('/event/:id/enrollment', authenticateToken, enrollInEvent);
router.delete('/event/:id/enrollment', authenticateToken, cancelEnrollment);
router.post('/user/login', loginUser);
router.get('/event', getAllEvents);
router.get('/event/:id', getEventById);
router.post('/event', authenticateToken, createEvent);
router.put('/event/:id', authenticateToken, updateEvent);
router.delete('/event/:id', authenticateToken, deleteEvent);
router.get('/events/name/:name', getEventByName);
router.get('/events/startdate/:startdate', getEventByStartDate);
router.get('/event/:id/participants', authenticateToken, getEventParticipants);
router.put('/event-location/:id', authenticateToken, updateEventLocation);
router.delete('/event-location/:id', authenticateToken, deleteEventLocation);
router.get('/event-location', authenticateToken, getUserEventLocations);
router.get('/event-location/:id', authenticateToken, getEventLocationById);
router.post('/event-location', authenticateToken, createEventLocation);
router.get('/events/tag/:tag', getEventByTag);


export default router;


