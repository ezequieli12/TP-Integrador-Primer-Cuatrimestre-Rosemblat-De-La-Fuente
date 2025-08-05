import pkg from 'pg';
import { StatusCodes } from 'http-status-codes';
import { validaciones } from '../helpers/validaciones/validaciones.js';
import config from '../../configs/db-configs.js';

const { Pool } = pkg;
const pool = new Pool(config);
const validacionesInstance = new validaciones();
export const getHello = (req, res) => {
    res.json({ message: 'hola de la api' });
};

export const getAllEvents = async (req, res) => {
    const { page = 1, limit = 15, name, startdate, tag } = req.query;
    const offset = (page - 1) * limit;
    const client = pool;
    
    try {        
        let sqlQuery = `
            SELECT 
                e.id, e.name, e.description, e.start_date, e.duration_in_minutes,
                e.price, e.enabled_for_enrollment, e.max_assistance,
                el.id AS event_location_id, el.name AS location_name, 
                el.full_address, el.latitude, el.longitude, el.max_capacity,
                l.id AS location_id, l.name AS locality_name,
                p.id AS province_id, p.name AS province_name, p.full_name AS province_full_name,
                u.id AS creator_id, u.first_name, u.last_name, u.username
            FROM events e
            LEFT JOIN event_locations el ON e.id_event_location = el.id
            LEFT JOIN locations l ON el.id_location = l.id
            LEFT JOIN provinces p ON l.id_province = p.id
            LEFT JOIN users u ON e.id_creator_user = u.id
            WHERE 1=1
        `;
        
        const values = [];
        let paramCount = 0;
        if (name) {
            paramCount++;
            sqlQuery += ` AND e.name ILIKE $${paramCount}`;
            values.push(`%${name}%`);
        }

        if (startdate) {
            paramCount++;
            sqlQuery += ` AND DATE(e.start_date) = $${paramCount}`;
            values.push(startdate);
        }

        if (tag) {
            paramCount++;
            sqlQuery += ` AND EXISTS (
                SELECT 1 FROM Event_Tags et 
                JOIN Tags t ON et.id_tag = t.id 
                WHERE et.id_event = e.id AND t.name ILIKE $${paramCount}
            )`;
            values.push(`%${tag}%`);
        }
     const countQuery = sqlQuery.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
        const countResult = await client.query(countQuery, values);
        
if (!countResult.rows || countResult.rows.length === 0) {
            return res.status(StatusCodes.OK).json({
                collection: [],
                pagination: {
                    limit: parseInt(limit),
                    offset: offset,
                    nextPage: null,
                    total: "0"
                }
            });
        }
        
        const total = parseInt(countResult.rows[0]?.count || 0);

        paramCount++;
        sqlQuery += ` ORDER BY e.id ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);

        const result = await client.query(sqlQuery, values);

        if (result.rows.length === 0) {
            return res.status(StatusCodes.OK).json({
                collection: [],
                pagination: {
                    limit: parseInt(limit),
                    offset: offset,
                    nextPage: null,
                    total: total.toString()
                }
            });
        }

        const eventsWithTags = await Promise.all(
            result.rows.map(async (event) => {
                const tagsQuery = `
                    SELECT t.id, t.name 
                    FROM Event_Tags et 
                    JOIN Tags t ON et.id_tag = t.id 
                    WHERE et.id_event = $1
                `;
        const tagsResult = await client.query(tagsQuery, [event.id]);
                
                return {
                    id: event.id,
                    name: event.name,
                description: event.description,
                    start_date: event.start_date,
                    duration_in_minutes: event.duration_in_minutes,
                price: event.price,
                    enabled_for_enrollment: event.enabled_for_enrollment,
                    max_assistance: event.max_assistance,
                    id_creator_user: event.creator_id,
                    event_location: {
                        id: event.event_location_id,
                        id_location: event.location_id,
                        name: event.location_name,
                        full_address: event.full_address,
                        max_capacity: event.max_capacity,
                        latitude: event.latitude,
                        longitude: event.longitude,
                        id_creator_user: event.creator_id,
                        location: {
                            id: event.location_id,
                            name: event.locality_name,
                            id_province: event.province_id,
                            latitude: event.latitude,
                            longitude: event.longitude,
                            province: {
                                id: event.province_id,
                                name: event.province_name,
                                full_name: event.province_full_name,
                                latitude: null,
                                longitude: null,
                                display_order: null
                            }
                        },
                        creator_user: {
                            id: event.creator_id,
                            first_name: event.first_name,
                            last_name: event.last_name,
                            username: event.username,
                            password: '******'
                        }
                    },
                    tags: tagsResult.rows,
                    creator_user: {
                        id: event.creator_id,
                        first_name: event.first_name,
                        last_name: event.last_name,
                        username: event.username,
                        password: '******'
                    }
                };
            })
        );

        const nextPage = offset + limit < total ? page + 1 : null;

        res.status(StatusCodes.OK).json({
            collection: eventsWithTags,
            pagination: {
                limit: parseInt(limit),
                offset: offset,
                nextPage: nextPage,
                total: total.toString()
            }
        });

    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error interno'
        });
    }
};
export const getEventById = async (req, res) => {
    const { id } = req.params;
    const client = pool;

    try {        
        const sqlQuery = `
            SELECT 
                e.id, e.name, e.description, e.id_event_location, e.start_date, 
                e.duration_in_minutes, e.price, e.enabled_for_enrollment, e.max_assistance, e.id_creator_user,
                el.id AS event_location_id, el.name AS location_name, el.full_address, 
                el.max_capacity, el.latitude, el.longitude, el.id_creator_user AS location_creator_user,
                l.id AS location_id, l.name AS locality_name, l.id_province,
                p.id AS province_id, p.name AS province_name, p.full_name AS province_full_name,
                u.id AS creator_id, u.first_name, u.last_name, u.username
            FROM Events e
            LEFT JOIN event_locations el ON e.id_event_location = el.id
            LEFT JOIN locations l ON el.id_location = l.id
            LEFT JOIN provinces p ON l.id_province = p.id
            LEFT JOIN users u ON e.id_creator_user = u.id
            WHERE e.id = $1
        `;
        
        const result = await client.query(sqlQuery, [id]);

        try{
            await validacionesInstance.chequearSiExiste(result, "Evento");
        }catch(error){
        return res.status(StatusCodes.NOT_FOUND).json({
            success: false,
            message: error.message
        });
        }

        const event = result.rows[0];
        const tagsQuery = `
            SELECT t.id, t.name 
            FROM Event_Tags et 
            JOIN Tags t ON et.id_tag = t.id 
            WHERE et.id_event = $1
        `;
        const tagsResult = await client.query(tagsQuery, [id]);

        const locationCreatorQuery = 'SELECT id, first_name, last_name, username FROM Users WHERE id = $1';
        const locationCreatorResult = await client.query(locationCreatorQuery, [event.location_creator_user]);

        const eventDetail = {
            id: event.id,
            name: event.name,
            description: event.description,
            id_event_location: event.id_event_location,
            start_date: event.start_date,
            duration_in_minutes: event.duration_in_minutes,
            price: event.price,
            enabled_for_enrollment: event.enabled_for_enrollment,
            max_assistance: event.max_assistance,
            id_creator_user: event.id_creator_user,
            event_location: {
            id: event.event_location_id,
                id_location: event.location_id,
                name: event.location_name,
                full_address: event.full_address,
                max_capacity: event.max_capacity,
                latitude: event.latitude,
                longitude: event.longitude,
                id_creator_user: event.location_creator_user,
                location: {
                    id: event.location_id,
                    name: event.locality_name,
                    id_province: event.id_province,
                    latitude: event.latitude,
                    longitude: event.longitude,
                    province: {
                        id: event.province_id,
                        name: event.province_name,
                        full_name: event.province_full_name,
                        latitude: null,
                        longitude: null,
                        display_order: null
                    }
                },
                creator_user: {
                    id: locationCreatorResult.rows[0]?.id,
                    first_name: locationCreatorResult.rows[0]?.first_name,
                    last_name: locationCreatorResult.rows[0]?.last_name,
                    username: locationCreatorResult.rows[0]?.username,
                    password: '******'
                }
            },
            tags: tagsResult.rows,
            creator_user: {
                id: event.creator_id,
                first_name: event.first_name,
                last_name: event.last_name,
                username: event.username,
                password: '******'
            }
        };

        res.status(StatusCodes.OK).json(eventDetail);

    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error interno'
        });
    }
};

export const createEvent = async (req, res) => {
    const { 
        name, description, id_event_location, start_date, 
        duration_in_minutes, price, enabled_for_enrollment, 
        max_assistance, tags 
    } = req.body;
    const userId = req.user.id;
    const client = pool;

    try {
        try {
            await validacionesInstance.isValidString(name, "nombre");
            await validacionesInstance.isValidString(description, "descripción");
            await validacionesInstance.isPositivo(price, "precio");
            await validacionesInstance.isPositivo(duration_in_minutes, "duración");
        } catch (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: error.message
            });
        }
        const locationQuery = 'SELECT max_capacity FROM Event_Locations WHERE id = $1';
        const locationResult = await client.query(locationQuery, [id_event_location]);
    try{
            await validacionesInstance.chequearSiExiste(locationResult, "ubicación");
        }catch(error){
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: error.message
            });
        }
        if (max_assistance > locationResult.rows[0].max_capacity) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'La capacidad máxima excede la capacidad de la ubicación'
            });
        }

        const insertQuery = `
            INSERT INTO Events (name, description, id_event_location, start_date, 
                              duration_in_minutes, price, enabled_for_enrollment, 
                              max_assistance, id_creator_user)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `;
        
        const eventResult = await client.query(insertQuery, [
            name, description, id_event_location, start_date,
            duration_in_minutes, price, enabled_for_enrollment,
            max_assistance, userId
        ]);
        const eventId = eventResult.rows[0].id;

        if (tags && tags.length > 0) {
            for (const tagName of tags) {
                let tagQuery = 'SELECT id FROM Tags WHERE name = $1';
                let tagResult = await client.query(tagQuery, [tagName]);
                
                let tagId;
                if (tagResult.rowCount === 0) {
                    const createTagQuery = 'INSERT INTO Tags (name) VALUES ($1) RETURNING id';
                    const newTagResult = await client.query(createTagQuery, [tagName]);
                    tagId = newTagResult.rows[0].id;
                } else {
                    tagId = tagResult.rows[0].id;
                }

                const eventTagQuery = 'INSERT INTO Event_Tags (id_event, id_tag) VALUES ($1, $2)';
                await client.query(eventTagQuery, [eventId, tagId]);
            }
        }
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'exito',
            eventId: eventId
        });

    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error interno'
        });
    }
};
export const updateEvent = async (req, res) => {
    const { id } = req.params;
    const updateData = req.body;
    const userId = req.user.id;
    const client = pool;
    try {
        const checkQuery = 'SELECT id_creator_user FROM Events WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);
        
        try{
            await validacionesInstance.chequearSiExiste(checkResult, "Evento");
        }catch(error){
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: error.message
            });
        }
        if (checkResult.rows[0].id_creator_user !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: 'No tienes permisos para editar este evento'
            });
        }
        const updateFields = [];
        const values = [];
        let paramCount = 1;

        if (updateData.name) {
            try {
                await validacionesInstance.isValidString(updateData.name, "nombre");
        } catch (error) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: error.message
                });
            }
            updateFields.push(`name = $${paramCount}`);
            values.push(updateData.name);
            paramCount++;
        }

        if (updateData.description) {
            try {
                await validacionesInstance.isValidString(updateData.description, "descripción");
            } catch (error) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: error.message
                });
            }
     updateFields.push(`description = $${paramCount}`);
            values.push(updateData.description);
            paramCount++;
        }
        if (updateData.price !== undefined) {
            try {
                await validacionesInstance.isPositivo(updateData.price, "precio");
            } catch (error) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: error.message
                });
            }
            updateFields.push(`price = $${paramCount}`);
            values.push(updateData.price);
            paramCount++;
        }

        if (updateData.duration_in_minutes !== undefined) {
            try {
                await validacionesInstance.isPositivo(updateData.duration_in_minutes, "duración");
            } catch (error) {
                return res.status(StatusCodes.BAD_REQUEST).json({
                    success: false,
                    message: error.message
                });
            }
            updateFields.push(`duration_in_minutes = $${paramCount}`);
            values.push(updateData.duration_in_minutes);
            paramCount++;
        }

        if (updateData.start_date) {
            updateFields.push(`start_date = $${paramCount}`);
            values.push(updateData.start_date);
            paramCount++;
        }

        if (updateData.enabled_for_enrollment !== undefined) {
            updateFields.push(`enabled_for_enrollment = $${paramCount}`);
            values.push(updateData.enabled_for_enrollment);
            paramCount++;
        }

        if (updateData.max_assistance !== undefined) {
            updateFields.push(`max_assistance = $${paramCount}`);
            values.push(updateData.max_assistance);
            paramCount++;
        }

        if (updateData.id_event_location) {
            updateFields.push(`id_event_location = $${paramCount}`);
            values.push(updateData.id_event_location);
            paramCount++;
        }

        if (updateFields.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'no se ingreso para actualizar'
            });
        }

        values.push(id);
        const updateQuery = `UPDATE Events SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
        
        await client.query(updateQuery, values);

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'exito'
        });
} catch (error) {
        console.error('error:', error);
    res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
     success: false,
            message: 'error interno'
        });
    }
};

export const deleteEvent = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const client = pool;

    try {
    const checkQuery = 'SELECT id_creator_user FROM Events WHERE id = $1';
        const checkResult = await client.query(checkQuery, [id]);
        
        try{
            await validacionesInstance.chequearSiExiste(checkResult, "Evento");
        }catch(error){
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: error.message
            });
        }
        if (checkResult.rows[0].id_creator_user !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: 'No tienes permisos para eliminar este evento'
            });
        }

        const enrollmentQuery = 'SELECT COUNT(*) FROM Event_Enrollments WHERE id_event = $1';
        const enrollmentResult = await client.query(enrollmentQuery, [id]);
        if (parseInt(enrollmentResult.rows[0].count) > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'no se puede eliminar porqu tiene inscripcion'
            });
        }

        await client.query('DELETE FROM Event_Tags WHERE id_event = $1', [id]);
        await client.query('DELETE FROM Events WHERE id = $1', [id]);

        res.status(StatusCodes.OK).json({
            success: true,
        message: 'exito'
        });

    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error interno'
        });
    }
};
export const enrollInEvent = async (req, res) => {
    const { id } = req.params;
    const userId = req.user.id;
    const client = pool;

    try {
        const eventQuery = `
            SELECT start_date, enabled_for_enrollment, max_assistance 
            FROM Events WHERE id = $1
        `;
        const eventResult = await client.query(eventQuery, [id]);
        
        try{
            await validacionesInstance.chequearSiExiste(eventResult, "Evento");
        }catch(error){
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: error.message
            });
        }

 const event = eventResult.rows[0];
        if (event.enabled_for_enrollment !== '1') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'inhabilitado'
            });
        }

        const today = new Date();
        const eventDate = new Date(event.start_date);
        if (eventDate <= today) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'no se puede inscribir'
            });
        }

        const existingEnrollmentQuery = 'SELECT id FROM Event_Enrollments WHERE id_event = $1 AND id_user = $2';
        const existingEnrollmentResult = await client.query(existingEnrollmentQuery, [id, userId]);
        
        if (existingEnrollmentResult.rowCount > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'ya estas inscrito'
            });
        }
        const currentEnrollmentsQuery = 'SELECT COUNT(*) FROM Event_Enrollments WHERE id_event = $1';
        const currentEnrollmentsResult = await client.query(currentEnrollmentsQuery, [id]);
    const currentEnrollments = parseInt(currentEnrollmentsResult.rows[0].count);

        if (currentEnrollments >= event.max_assistance) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'max capacity reached'
            });
        }

    const enrollmentQuery = `
            INSERT INTO Event_Enrollments (id_event, id_user, registration_date_time)
            VALUES ($1, $2, NOW())
        `;
        await client.query(enrollmentQuery, [id, userId]);

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'exito'
        });

    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error interno'
        });
    }
};
export const cancelEnrollment = async (req, res) => {
const { id } = req.params;
 const userId = req.user.id;
const client = pool;

    try {

        const eventQuery = 'SELECT start_date FROM Events WHERE id = $1';
        const eventResult = await client.query(eventQuery, [id]);
        try{
            await validacionesInstance.chequearSiExiste(eventResult, "Evento");
        }catch(error){
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: error.message
            });
        }

        const event = eventResult.rows[0];

        const today = new Date();
        const eventDate = new Date(event.start_date);
        if (eventDate <= today) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'no es posible cancelar'
            });
        }
        const enrollmentQuery = 'SELECT id FROM Event_Enrollments WHERE id_event = $1 AND id_user = $2';
        const enrollmentResult = await client.query(enrollmentQuery, [id, userId]);
        
        if (enrollmentResult.rowCount === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'no estas inscrito'
            });
        }

        await client.query('DELETE FROM Event_Enrollments WHERE id_event = $1 AND id_user = $2', [id, userId]);

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'exito'
        });

    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error interno'
        });
    }
};

export const getEventParticipants = async (req, res) => {
    const { id } = req.params;
    const client = pool;

    try {
        const eventQuery = 'SELECT id FROM Events WHERE id = $1';
        const eventResult = await client.query(eventQuery, [id]);
        
        try
        {
            await validacionesInstance.chequearSiExiste(eventResult, "Evento");
        }catch(error){
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: error.message
            });
        }

        const participantsQuery = `
            SELECT u.id, u.first_name, u.last_name, u.username, ee.registration_date_time
            FROM Event_Enrollments ee
            JOIN Users u ON ee.id_user = u.id
            WHERE ee.id_event = $1
            ORDER BY ee.registration_date_time ASC
        `;
        const participantsResult = await client.query(participantsQuery, [id]);

        const participants = participantsResult.rows.map(participant => ({
            id: participant.id,
            first_name: participant.first_name,
            last_name: participant.last_name,
            username: participant.username,
            password: '******',
            registration_date_time: participant.registration_date_time
        }));

        res.status(StatusCodes.OK).json({
            success: true,
            participants: participants
        });

    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error interno'
        });
    }
};

export const getEventByName = async (req, res) => {
    const { name } = req.params;
    const client = pool;

    try {

        const sqlQuery = `
            SELECT 
                e.id, e.name, e.description, e.start_date, e.duration_in_minutes,
                e.price, e.enabled_for_enrollment, e.max_assistance,
                el.id AS event_location_id, el.name AS location_name, 
                el.full_address, el.latitude, el.longitude, el.max_capacity,
                l.id AS location_id, l.name AS locality_name,
                p.id AS province_id, p.name AS province_name, p.full_name AS province_full_name,
                u.id AS creator_id, u.first_name, u.last_name, u.username
            FROM events e
            LEFT JOIN event_locations el ON e.id_event_location = el.id
            LEFT JOIN locations l ON el.id_location = l.id
            LEFT JOIN provinces p ON l.id_province = p.id
            LEFT JOIN users u ON e.id_creator_user = u.id
            WHERE e.name ILIKE $1
            ORDER BY e.id ASC
        `;
        
        const result = await client.query(sqlQuery, [`%${name}%`]);

        if (result.rows.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                events: []
            });
        }
        const eventsWithTags = await Promise.all(
            result.rows.map(async (event) => {
                const tagsQuery = `
                    SELECT t.id, t.name 
                    FROM Event_Tags et 
                    JOIN Tags t ON et.id_tag = t.id 
                    WHERE et.id_event = $1
                `;
                const tagsResult = await client.query(tagsQuery, [event.id]);
                
                return {
                id: event.id,
                    name: event.name,
                    description: event.description,
                    start_date: event.start_date,
                    duration_in_minutes: event.duration_in_minutes,
                    price: event.price,
                    enabled_for_enrollment: event.enabled_for_enrollment,
                max_assistance: event.max_assistance,
                id_creator_user: event.creator_id,
                event_location: {
                        id: event.event_location_id,
                        id_location: event.location_id,
                        name: event.location_name,
                        full_address: event.full_address,
                        max_capacity: event.max_capacity,
                        latitude: event.latitude,
                        longitude: event.longitude,
                        id_creator_user: event.creator_id,
                        location: {
                            id: event.location_id,
                            name: event.locality_name,
                            id_province: event.province_id,
                            latitude: event.latitude,
                            longitude: event.longitude,
                            province: {
                                id: event.province_id,
                                name: event.province_name,
                                full_name: event.province_full_name,
                                latitude: null,
                                longitude: null,
                                display_order: null
                            }
                        },
                        creator_user: {
                            id: event.creator_id,
                            first_name: event.first_name,
                            last_name: event.last_name,
                            username: event.username,
                            password: '******'
                        }
                    },
                    tags: tagsResult.rows,
                creator_user: {
                        id: event.creator_id,
                        first_name: event.first_name,
                        last_name: event.last_name,
                        username: event.username,
                        password: '******'
                    }
                };
            })
        );

        res.status(StatusCodes.OK).json({
            success: true,
            events: eventsWithTags
        });
    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error interno'
        });
    }
};

export const getEventByStartDate = async (req, res) => {
    const { startdate } = req.params;
    const client = pool;

    try {
        const sqlQuery = `
            SELECT 
                e.id, e.name, e.description, e.start_date, e.duration_in_minutes,
                e.price, e.enabled_for_enrollment, e.max_assistance,
                el.id AS event_location_id, el.name AS location_name, 
                el.full_address, el.latitude, el.longitude, el.max_capacity,
                l.id AS location_id, l.name AS locality_name,
                p.id AS province_id, p.name AS province_name, p.full_name AS province_full_name,
                u.id AS creator_id, u.first_name, u.last_name, u.username
            FROM events e
            LEFT JOIN event_locations el ON e.id_event_location = el.id
            LEFT JOIN locations l ON el.id_location = l.id
            LEFT JOIN provinces p ON l.id_province = p.id
            LEFT JOIN users u ON e.id_creator_user = u.id
            WHERE DATE(e.start_date) = $1
            ORDER BY e.id ASC
        `; 
        const result = await client.query(sqlQuery, [startdate]);
        if (result.rows.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                events: []
            });
        }

     const eventsWithTags = await Promise.all(
            result.rows.map(async (event) => {
                const tagsQuery = `
                    SELECT t.id, t.name 
                    FROM Event_Tags et 
                    JOIN Tags t ON et.id_tag = t.id 
                    WHERE et.id_event = $1
                `;
                const tagsResult = await client.query(tagsQuery, [event.id]);
                return {
                    id: event.id,
                    name: event.name,
                    description: event.description,
                    start_date: event.start_date,
                    duration_in_minutes: event.duration_in_minutes,
                    price: event.price,
                    enabled_for_enrollment: event.enabled_for_enrollment,
                    max_assistance: event.max_assistance,
                    id_creator_user: event.creator_id,
                    event_location: {
                        id: event.event_location_id,
                        id_location: event.location_id,
                        name: event.location_name,
                        full_address: event.full_address,
                        max_capacity: event.max_capacity,
                        latitude: event.latitude,
                        longitude: event.longitude,
                        id_creator_user: event.creator_id,
                        location: {
                            id: event.location_id,
                            name: event.locality_name,
                            id_province: event.province_id,
                            latitude: event.latitude,
                            longitude: event.longitude,
                            province: {
                                id: event.province_id,
                                name: event.province_name,
                                full_name: event.province_full_name,
                                latitude: null,
                                longitude: null,
                                display_order: null
                            }
                        },
                        creator_user: {
                            id: event.creator_id,
                            first_name: event.first_name,
                            last_name: event.last_name,
                            username: event.username,
                            password: '******'
                        }
                    },
                    tags: tagsResult.rows,
                    creator_user: {
                        id: event.creator_id,
                        first_name: event.first_name,
                        last_name: event.last_name,
                    username: event.username,
                        password: '******'
                    }
                };
            })
        );

        res.status(StatusCodes.OK).json({
            success: true,
            events: eventsWithTags
        });

    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error interno'
        });
    }
};
export const getEventByTag = async (req, res) => {
    const { tag } = req.params;
    const client = pool;

    try {
        const sqlQuery = `
            SELECT DISTINCT
                e.id, e.name, e.description, e.start_date, e.duration_in_minutes,
                e.price, e.enabled_for_enrollment, e.max_assistance,
                el.id AS event_location_id, el.name AS location_name, 
                el.full_address, el.latitude, el.longitude, el.max_capacity,
                l.id AS location_id, l.name AS locality_name,
                p.id AS province_id, p.name AS province_name, p.full_name AS province_full_name,
                u.id AS creator_id, u.first_name, u.last_name, u.username
            FROM events e
            LEFT JOIN event_locations el ON e.id_event_location = el.id
            LEFT JOIN locations l ON el.id_location = l.id
            LEFT JOIN provinces p ON l.id_province = p.id
            LEFT JOIN users u ON e.id_creator_user = u.id
            JOIN Event_Tags et ON e.id = et.id_event
            JOIN Tags t ON et.id_tag = t.id
            WHERE t.name ILIKE $1
            ORDER BY e.id ASC
        `;
        
        const result = await client.query(sqlQuery, [`%${tag}%`]);
        if (result.rows.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                events: []
            });
        }

        const eventsWithTags = await Promise.all(
            result.rows.map(async (event) => {
                const tagsQuery = `
                    SELECT t.id, t.name 
                    FROM Event_Tags et 
                    JOIN Tags t ON et.id_tag = t.id 
                    WHERE et.id_event = $1
                `;
                const tagsResult = await client.query(tagsQuery, [event.id]);
                
                return {
                    id: event.id,
                    name: event.name,
                    description: event.description,
                    start_date: event.start_date,
                    duration_in_minutes: event.duration_in_minutes,
                price: event.price,
                    enabled_for_enrollment: event.enabled_for_enrollment,
                    max_assistance: event.max_assistance,
                    id_creator_user: event.creator_id,
                    event_location: {
                        id: event.event_location_id,
                        id_location: event.location_id,
                        name: event.location_name,
                        full_address: event.full_address,
                        max_capacity: event.max_capacity,
                        latitude: event.latitude,
                        longitude: event.longitude,
                        id_creator_user: event.creator_id,
                        location: {
                            id: event.location_id,
                            name: event.locality_name,
                            id_province: event.province_id,
                            latitude: event.latitude,
                            longitude: event.longitude,
                            province: {
                                id: event.province_id,
                                name: event.province_name,
                                full_name: event.province_full_name,
                                latitude: null,
                                longitude: null,
                                display_order: null
                            }
                        },
                        creator_user: {
                            id: event.creator_id,
                            first_name: event.first_name,
                            last_name: event.last_name,
                            username: event.username,
                            password: '******'
                        }
                    },
                    tags: tagsResult.rows,
                    creator_user: {
                        id: event.creator_id,
                        first_name: event.first_name,
                        last_name: event.last_name,
                        username: event.username,
                        password: '******'
                    }
                };
            })
        );

        res.status(StatusCodes.OK).json({
            success: true,
            events: eventsWithTags
        });

    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error internoo'
        });
    }
};
  