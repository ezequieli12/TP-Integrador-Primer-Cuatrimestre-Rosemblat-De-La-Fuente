import pkg from 'pg';
import { StatusCodes } from 'http-status-codes';
import { validaciones } from '../helpers/validaciones/validaciones.js';
import config from '../../configs/db-configs.js';

let { Pool } = pkg;
let pool = new Pool(config);
let validacionesInstance = new validaciones();

export let getHello = (req, res) => {
    res.json({ message: 'hola de la api' });
};

export let getAllEvents = async (req, res) => {
    let { page = 1, limit = 15, name, startdate, tag } = req.query;
    let offset = (page - 1) * limit;
    let client = pool;
    
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
        
        let values = [];
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

        let countQuery = sqlQuery.replace(/SELECT.*FROM/, 'SELECT COUNT(*) FROM');
        let countResult = await client.query(countQuery, values);
        
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
        
        let total = parseInt(countResult.rows[0]?.count || 0);

        paramCount++;
        sqlQuery += ` ORDER BY e.id ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
        values.push(limit, offset);

        let result = await client.query(sqlQuery, values);

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

        let eventsWithTags = await Promise.all(
            result.rows.map(async (activity) => {
                let tagsQuery = `
                    SELECT t.id, t.name 
                    FROM Event_Tags et 
                    JOIN Tags t ON et.id_tag = t.id 
                    WHERE et.id_event = $1
                `;
                let tagsResult = await client.query(tagsQuery, [activity.id]);
                
                return {
                    id: activity.id,
                    name: activity.name,
                    description: activity.description,
                    start_date: activity.start_date,
                    duration_in_minutes: activity.duration_in_minutes,
                    price: activity.price,
                    enabled_for_enrollment: activity.enabled_for_enrollment,
                    max_assistance: activity.max_assistance,
                    id_creator_user: activity.creator_id,
                    event_location: {
                        id: activity.event_location_id,
                        id_location: activity.location_id,
                        name: activity.location_name,
                        full_address: activity.full_address,
                        max_capacity: activity.max_capacity,
                        latitude: activity.latitude,
                        longitude: activity.longitude,
                        id_creator_user: activity.creator_id,
                        location: {
                            id: activity.location_id,
                            name: activity.locality_name,
                            id_province: activity.province_id,
                            latitude: activity.latitude,
                            longitude: activity.longitude,
                            province: {
                                id: activity.province_id,
                                name: activity.province_name,
                                full_name: activity.province_full_name,
                                latitude: null,
                                longitude: null,
                                display_order: null
                            }
                        },
                        creator_user: {
                            id: activity.creator_id,
                            first_name: activity.first_name,
                            last_name: activity.last_name,
                            username: activity.username,
                            password: '******'
                        }
                    },
                    tags: tagsResult.rows,
                    creator_user: {
                        id: activity.creator_id,
                        first_name: activity.first_name,
                        last_name: activity.last_name,
                        username: activity.username,
                        password: '******'
                    }
                };
            })
        );

        let nextPage = offset + limit < total ? page + 1 : null;

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
        console.error('Error al obtener eventos:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Ocurrió un error al obtener la lista de eventos. Por favor intenta nuevamente.'
        });
    }
};

export let getEventById = async (req, res) => {
    let { id } = req.params;
    let client = pool;

    try {        
        let sqlQuery = `
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
        
        let result = await client.query(sqlQuery, [id]);

        try {
            await validacionesInstance.chequearSiExiste(result, "Evento");
        } catch(error) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'El evento solicitado no existe o no se encuentra disponible'
            });
        }

        let activity = result.rows[0];
        let tagsQuery = `
            SELECT t.id, t.name 
            FROM Event_Tags et 
            JOIN Tags t ON et.id_tag = t.id 
            WHERE et.id_event = $1
        `;
        let tagsResult = await client.query(tagsQuery, [id]);

        let locationCreatorQuery = 'SELECT id, first_name, last_name, username FROM Users WHERE id = $1';
        let locationCreatorResult = await client.query(locationCreatorQuery, [activity.location_creator_user]);

        let eventDetail = {
            id: activity.id,
            name: activity.name,
            description: activity.description,
            id_event_location: activity.id_event_location,
            start_date: activity.start_date,
            duration_in_minutes: activity.duration_in_minutes,
            price: activity.price,
            enabled_for_enrollment: activity.enabled_for_enrollment,
            max_assistance: activity.max_assistance,
            id_creator_user: activity.id_creator_user,
            event_location: {
                id: activity.event_location_id,
                id_location: activity.location_id,
                name: activity.location_name,
                full_address: activity.full_address,
                max_capacity: activity.max_capacity,
                latitude: activity.latitude,
                longitude: activity.longitude,
                id_creator_user: activity.location_creator_user,
                location: {
                    id: activity.location_id,
                    name: activity.locality_name,
                    id_province: activity.id_province,
                    latitude: activity.latitude,
                    longitude: activity.longitude,
                    province: {
                        id: activity.province_id,
                        name: activity.province_name,
                        full_name: activity.province_full_name,
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
                id: activity.creator_id,
                first_name: activity.first_name,
                last_name: activity.last_name,
                username: activity.username,
                password: '******'
            }
        };

        res.status(StatusCodes.OK).json(eventDetail);

    } catch (error) {
        console.error('Error al obtener evento por ID:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Ocurrió un error al obtener los detalles del evento. Por favor intenta nuevamente.'
        });
    }
};

export let createEvent = async (req, res) => {
    let { 
        name, description, id_event_location, start_date, 
        duration_in_minutes, price, enabled_for_enrollment, 
        max_assistance, tags 
    } = req.body;
    let userId = req.participant.id;
    let client = pool;

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

        let locationQuery = 'SELECT max_capacity FROM Event_Locations WHERE id = $1';
        let locationResult = await client.query(locationQuery, [id_event_location]);
        
        try {
            await validacionesInstance.chequearSiExiste(locationResult, "ubicación");
        } catch(error) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'La ubicación especificada para el evento no existe'
            });
        }

        if (max_assistance > locationResult.rows[0].max_capacity) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: `La capacidad máxima del evento (${max_assistance}) excede la capacidad de la ubicación (${locationResult.rows[0].max_capacity})`
            });
        }

        let insertQuery = `
            INSERT INTO Events (name, description, id_event_location, start_date, 
                              duration_in_minutes, price, enabled_for_enrollment, 
                              max_assistance, id_creator_user)
            VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
            RETURNING id
        `;
        
        let eventResult = await client.query(insertQuery, [
            name, description, id_event_location, start_date,
            duration_in_minutes, price, enabled_for_enrollment,
            max_assistance, userId
        ]);
        let eventId = eventResult.rows[0].id;

        if (tags && tags.length > 0) {
            for (let tagName of tags) {
                let tagQuery = 'SELECT id FROM Tags WHERE name = $1';
                let tagResult = await client.query(tagQuery, [tagName]);
                
                let tagId;
                if (tagResult.rowCount === 0) {
                    let createTagQuery = 'INSERT INTO Tags (name) VALUES ($1) RETURNING id';
                    let newTagResult = await client.query(createTagQuery, [tagName]);
                    tagId = newTagResult.rows[0].id;
                } else {
                    tagId = tagResult.rows[0].id;
                }

                let eventTagQuery = 'INSERT INTO Event_Tags (id_event, id_tag) VALUES ($1, $2)';
                await client.query(eventTagQuery, [eventId, tagId]);
            }
        }

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Evento creado exitosamente',
            eventId: eventId
        });

    } catch (error) {
        console.error('Error al crear evento:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Ocurrió un error al crear el evento. Por favor verifica los datos e intenta nuevamente.'
        });
    }
};

export let updateEvent = async (req, res) => {
    let { id } = req.params;
    let updateData = req.body;
    let userId = req.participant.id;
    let client = pool;

    try {
        let checkQuery = 'SELECT id_creator_user FROM Events WHERE id = $1';
        let checkResult = await client.query(checkQuery, [id]);
        
        try {
            await validacionesInstance.chequearSiExiste(checkResult, "Evento");
        } catch(error) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'No se encontró el evento que intentas actualizar'
            });
        }

        if (checkResult.rows[0].id_creator_user !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: 'No tienes permisos para editar este evento. Solo el creador puede modificarlo.'
            });
        }

        let updateFields = [];
        let values = [];
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
                message: 'No se proporcionaron campos válidos para actualizar'
            });
        }

        values.push(id);
        let updateQuery = `UPDATE Events SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
        
        await client.query(updateQuery, values);

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Evento actualizado exitosamente'
        });

    } catch (error) {
        console.error('Error al actualizar evento:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Ocurrió un error al actualizar el evento. Por favor verifica los datos e intenta nuevamente.'
        });
    }
};

export let deleteEvent = async (req, res) => {
    let { id } = req.params;
    let userId = req.participant.id;
    let client = pool;

    try {
        let checkQuery = 'SELECT id_creator_user FROM Events WHERE id = $1';
        let checkResult = await client.query(checkQuery, [id]);
        
        try {
            await validacionesInstance.chequearSiExiste(checkResult, "Evento");
        } catch(error) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'No se encontró el evento que intentas eliminar'
            });
        }

        if (checkResult.rows[0].id_creator_user !== userId) {
            return res.status(StatusCodes.FORBIDDEN).json({
                success: false,
                message: 'No tienes permisos para eliminar este evento. Solo el creador puede eliminarlo.'
            });
        }

        let enrollmentQuery = 'SELECT COUNT(*) FROM Event_Enrollments WHERE id_event = $1';
        let enrollmentResult = await client.query(enrollmentQuery, [id]);
        
        if (parseInt(enrollmentResult.rows[0].count) > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'No se puede eliminar el evento porque ya tiene participantes inscritos'
            });
        }

        await client.query('DELETE FROM Event_Tags WHERE id_event = $1', [id]);
        await client.query('DELETE FROM Events WHERE id = $1', [id]);

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Evento eliminado exitosamente'
        });

    } catch (error) {
        console.error('Error al eliminar evento:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Ocurrió un error al eliminar el evento. Por favor intenta nuevamente.'
        });
    }
};

export let enrollInEvent = async (req, res) => {
    let { id } = req.params;
    let userId = req.participant.id;
    let client = pool;

    try {
        let eventQuery = `
            SELECT start_date, enabled_for_enrollment, max_assistance 
            FROM Events WHERE id = $1
        `;
        let eventResult = await client.query(eventQuery, [id]);
        
        try {
            await validacionesInstance.chequearSiExiste(eventResult, "Evento");
        } catch(error) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'No se encontró el evento al que intentas inscribirte'
            });
        }

        let activity = eventResult.rows[0];
        if (activity.enabled_for_enrollment !== '1') {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Las inscripciones para este evento están actualmente cerradas'
            });
        }

        let today = new Date();
        let eventDate = new Date(activity.start_date);
        if (eventDate <= today) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'No se puede inscribir a un evento que ya ha ocurrido'
            });
        }

        let existingEnrollmentQuery = 'SELECT id FROM Event_Enrollments WHERE id_event = $1 AND id_user = $2';
        let existingEnrollmentResult = await client.query(existingEnrollmentQuery, [id, userId]);
        
        if (existingEnrollmentResult.rowCount > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'Ya estás inscrito en este evento'
            });
        }

        let currentEnrollmentsQuery = 'SELECT COUNT(*) FROM Event_Enrollments WHERE id_event = $1';
        let currentEnrollmentsResult = await client.query(currentEnrollmentsQuery, [id]);
        let currentEnrollments = parseInt(currentEnrollmentsResult.rows[0].count);

        if (currentEnrollments >= activity.max_assistance) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: `El evento ha alcanzado su capacidad máxima de participantes (${activity.max_assistance} personas)`
            });
        }

        let enrollmentQuery = `
            INSERT INTO Event_Enrollments (id_event, id_user, registration_date_time)
            VALUES ($1, $2, NOW())
        `;
        await client.query(enrollmentQuery, [id, userId]);

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'Inscripción al evento realizada exitosamente'
        });

    } catch (error) {
        console.error('Error al inscribirse en evento:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Ocurrió un error al procesar tu inscripción. Por favor intenta nuevamente.'
        });
    }
};

export let cancelEnrollment = async (req, res) => {
    let { id } = req.params;
    let userId = req.participant.id;
    let client = pool;

    try {
        let eventQuery = 'SELECT start_date FROM Events WHERE id = $1';
        let eventResult = await client.query(eventQuery, [id]);
        
        try {
            await validacionesInstance.chequearSiExiste(eventResult, "Evento");
        } catch(error) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'No se encontró el evento para el que intentas cancelar la inscripción'
            });
        }

        let activity = eventResult.rows[0];
        let today = new Date();
        let eventDate = new Date(activity.start_date);
        
        if (eventDate <= today) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'No se puede cancelar la inscripción a un evento que ya ha ocurrido'
            });
        }

        let enrollmentQuery = 'SELECT id FROM Event_Enrollments WHERE id_event = $1 AND id_user = $2';
        let enrollmentResult = await client.query(enrollmentQuery, [id, userId]);
        
        if (enrollmentResult.rowCount === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'No estás inscrito en este evento'
            });
        }

        await client.query('DELETE FROM Event_Enrollments WHERE id_event = $1 AND id_user = $2', [id, userId]);

        res.status(StatusCodes.OK).json({
            success: true,
            message: 'Inscripción cancelada exitosamente'
        });

    } catch (error) {
        console.error('Error al cancelar inscripción:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Ocurrió un error al cancelar tu inscripción. Por favor intenta nuevamente.'
        });
    }
};

export let getEventParticipants = async (req, res) => {
    let { id } = req.params;
    let client = pool;

    try {
        let eventQuery = 'SELECT id FROM Events WHERE id = $1';
        let eventResult = await client.query(eventQuery, [id]);
        
        try {
            await validacionesInstance.chequearSiExiste(eventResult, "Evento");
        } catch(error) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'No se encontró el evento para listar participantes'
            });
        }

        let participantsQuery = `
            SELECT u.id, u.first_name, u.last_name, u.username, ee.registration_date_time
            FROM Event_Enrollments ee
            JOIN Users u ON ee.id_user = u.id
            WHERE ee.id_event = $1
            ORDER BY ee.registration_date_time ASC
        `;
        let participantsResult = await client.query(participantsQuery, [id]);

        let participants = participantsResult.rows.map(participant => ({
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
        console.error('Error al obtener participantes del evento:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Ocurrió un error al obtener la lista de participantes. Por favor intenta nuevamente.'
        });
    }
};

export let getEventByName = async (req, res) => {
    let { name } = req.params;
    let client = pool;

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
            WHERE e.name ILIKE $1
            ORDER BY e.id ASC
        `;
        
        let result = await client.query(sqlQuery, [`%${name}%`]);

        if (result.rows.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                events: []
            });
        }

        let eventsWithTags = await Promise.all(
            result.rows.map(async (activity) => {
                let tagsQuery = `
                    SELECT t.id, t.name 
                    FROM Event_Tags et 
                    JOIN Tags t ON et.id_tag = t.id 
                    WHERE et.id_event = $1
                `;
                let tagsResult = await client.query(tagsQuery, [activity.id]);
                
                return {
                    id: activity.id,
                    name: activity.name,
                    description: activity.description,
                    start_date: activity.start_date,
                    duration_in_minutes: activity.duration_in_minutes,
                    price: activity.price,
                    enabled_for_enrollment: activity.enabled_for_enrollment,
                    max_assistance: activity.max_assistance,
                    id_creator_user: activity.creator_id,
                    event_location: {
                        id: activity.event_location_id,
                        id_location: activity.location_id,
                        name: activity.location_name,
                        full_address: activity.full_address,
                        max_capacity: activity.max_capacity,
                        latitude: activity.latitude,
                        longitude: activity.longitude,
                        id_creator_user: activity.creator_id,
                        location: {
                            id: activity.location_id,
                            name: activity.locality_name,
                            id_province: activity.province_id,
                            latitude: activity.latitude,
                            longitude: activity.longitude,
                            province: {
                                id: activity.province_id,
                                name: activity.province_name,
                                full_name: activity.province_full_name,
                                latitude: null,
                                longitude: null,
                                display_order: null
                            }
                        },
                        creator_user: {
                            id: activity.creator_id,
                            first_name: activity.first_name,
                            last_name: activity.last_name,
                            username: activity.username,
                            password: '******'
                        }
                    },
                    tags: tagsResult.rows,
                    creator_user: {
                        id: activity.creator_id,
                        first_name: activity.first_name,
                        last_name: activity.last_name,
                        username: activity.username,
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
        console.error('Error al buscar eventos por nombre:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Ocurrió un error al buscar eventos por nombre. Por favor intenta nuevamente.'
        });
    }
};

export let getEventByStartDate = async (req, res) => {
    let { startdate } = req.params;
    let client = pool;

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
            WHERE DATE(e.start_date) = $1
            ORDER BY e.id ASC
        `; 
        let result = await client.query(sqlQuery, [startdate]);
        
        if (result.rows.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                events: []
            });
        }

        let eventsWithTags = await Promise.all(
            result.rows.map(async (activity) => {
                let tagsQuery = `
                    SELECT t.id, t.name 
                    FROM Event_Tags et 
                    JOIN Tags t ON et.id_tag = t.id 
                    WHERE et.id_event = $1
                `;
                let tagsResult = await client.query(tagsQuery, [activity.id]);
                
                return {
                    id: activity.id,
                    name: activity.name,
                    description: activity.description,
                    start_date: activity.start_date,
                    duration_in_minutes: activity.duration_in_minutes,
                    price: activity.price,
                    enabled_for_enrollment: activity.enabled_for_enrollment,
                    max_assistance: activity.max_assistance,
                    id_creator_user: activity.creator_id,
                    event_location: {
                        id: activity.event_location_id,
                        id_location: activity.location_id,
                        name: activity.location_name,
                        full_address: activity.full_address,
                        max_capacity: activity.max_capacity,
                        latitude: activity.latitude,
                        longitude: activity.longitude,
                        id_creator_user: activity.creator_id,
                        location: {
                            id: activity.location_id,
                            name: activity.locality_name,
                            id_province: activity.province_id,
                            latitude: activity.latitude,
                            longitude: activity.longitude,
                            province: {
                                id: activity.province_id,
                                name: activity.province_name,
                                full_name: activity.province_full_name,
                                latitude: null,
                                longitude: null,
                                display_order: null
                            }
                        },
                        creator_user: {
                            id: activity.creator_id,
                            first_name: activity.first_name,
                            last_name: activity.last_name,
                            username: activity.username,
                            password: '******'
                        }
                    },
                    tags: tagsResult.rows,
                    creator_user: {
                        id: activity.creator_id,
                        first_name: activity.first_name,
                        last_name: activity.last_name,
                        username: activity.username,
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
        console.error('Error al buscar eventos por fecha:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Ocurrió un error al buscar eventos por fecha. Por favor intenta nuevamente.'
        });
    }
};

export let getEventByTag = async (req, res) => {
    let { tag } = req.params;
    let client = pool;

    try {
        let sqlQuery = `
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
        
        let result = await client.query(sqlQuery, [`%${tag}%`]);
        
        if (result.rows.length === 0) {
            return res.status(StatusCodes.OK).json({
                success: true,
                events: []
            });
        }

        let eventsWithTags = await Promise.all(
            result.rows.map(async (activity) => {
                let tagsQuery = `
                    SELECT t.id, t.name 
                    FROM Event_Tags et 
                    JOIN Tags t ON et.id_tag = t.id 
                    WHERE et.id_event = $1
                `;
                let tagsResult = await client.query(tagsQuery, [activity.id]);
                
                return {
                    id: activity.id,
                    name: activity.name,
                    description: activity.description,
                    start_date: activity.start_date,
                    duration_in_minutes: activity.duration_in_minutes,
                    price: activity.price,
                    enabled_for_enrollment: activity.enabled_for_enrollment,
                    max_assistance: activity.max_assistance,
                    id_creator_user: activity.creator_id,
                    event_location: {
                        id: activity.event_location_id,
                        id_location: activity.location_id,
                        name: activity.location_name,
                        full_address: activity.full_address,
                        max_capacity: activity.max_capacity,
                        latitude: activity.latitude,
                        longitude: activity.longitude,
                        id_creator_user: activity.creator_id,
                        location: {
                            id: activity.location_id,
                            name: activity.locality_name,
                            id_province: activity.province_id,
                            latitude: activity.latitude,
                            longitude: activity.longitude,
                            province: {
                                id: activity.province_id,
                                name: activity.province_name,
                                full_name: activity.province_full_name,
                                latitude: null,
                                longitude: null,
                                display_order: null
                            }
                        },
                        creator_user: {
                            id: activity.creator_id,
                            first_name: activity.first_name,
                            last_name: activity.last_name,
                            username: activity.username,
                            password: '******'
                        }
                    },
                    tags: tagsResult.rows,
                    creator_user: {
                        id: activity.creator_id,
                        first_name: activity.first_name,
                        last_name: activity.last_name,
                        username: activity.username,
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
        console.error('Error al buscar eventos por etiqueta:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'Ocurrió un error al buscar eventos por etiqueta. Por favor intenta nuevamente.'
        });
    }
};