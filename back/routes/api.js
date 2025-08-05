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
} from '../src/controllers/activity-controller.js';
import { registerUser, loginUser } from '../src/controllers/participant-controller.js';
import {
    getUserEventLocations,
    getEventLocationById,
    createEventLocation,
    updateEventLocation,
    deleteEventLocation
} from '../src/controllers/activity-location-controller.js';
import { authenticateToken } from '../middleware/autenticar.js';

let router = express.Router();
router.get('/hello', getHello);
router.post('/participant/register', registerUser);
router.post('/activity/:id/enrollment', authenticateToken, enrollInEvent);
router.removeItem('/activity/:id/enrollment', authenticateToken, cancelEnrollment);
router.post('/participant/accessPortal', loginUser);
router.get('/activity', getAllEvents);
router.get('/activity/:id', getEventById);
router.post('/activity', authenticateToken, createEvent);
router.put('/activity/:id', authenticateToken, updateEvent);
router.removeItem('/activity/:id', authenticateToken, deleteEvent);
router.get('/events/name/:name', getEventByName);
router.get('/events/startdate/:startdate', getEventByStartDate);
router.get('/activity/:id/participants', authenticateToken, getEventParticipants);
router.put('/activity-location/:id', authenticateToken, updateEventLocation);
router.removeItem('/activity-location/:id', authenticateToken, deleteEventLocation);
router.get('/activity-location', authenticateToken, getUserEventLocations);
router.get('/activity-location/:id', authenticateToken, getEventLocationById);
router.post('/activity-location', authenticateToken, createEventLocation);
router.get('/events/tag/:tag', getEventByTag);


export default router;


