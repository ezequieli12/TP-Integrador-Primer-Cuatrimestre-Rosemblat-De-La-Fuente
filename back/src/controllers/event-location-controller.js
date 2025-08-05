import pkg from 'pg';
import { StatusCodes } from 'http-status-codes';
import config from '../../configs/db-configs.js';

let { Pool } = pkg;
let pool = new Pool(config);

export let getUserEventLocations = async (req, res) => {
let userId = req.participant.id;
let { page = 1, limit = 15 } = req.query;
  let offset = (page - 1) * limit;

    try {
        let result = await pool.query(`
            SELECT 
                el.*, l.name as locality_name, l.latitude as locality_latitude, l.longitude as locality_longitude,
                p.name as province_name, p.full_name as province_full_name
            FROM Event_Locations el
            LEFT JOIN Locations l ON el.id_location = l.id
            LEFT JOIN Provinces p ON l.id_province = p.id
            WHERE el.id_creator_user = $1
            ORDER BY el.name ASC
            LIMIT $2 OFFSET $3
        `, [userId, limit, offset]);

        let locations = result.rows.map(row => ({
            id: row.id,
            id_location: row.id_location,
            name: row.name,
            full_address: row.full_address,
            max_capacity: row.max_capacity,
            latitude: row.latitude,
            longitude: row.longitude,
            id_creator_user: row.id_creator_user,
            location: {
                id: row.id_location,
                name: row.locality_name,
                latitude: row.locality_latitude,
                longitude: row.locality_longitude,
                province: {
                    name: row.province_name,
                    full_name: row.province_full_name
                }
            }
        }));

        let countResult = await pool.query('SELECT COUNT(*) FROM Event_Locations WHERE id_creator_user = $1', [userId]);
        let total = parseInt(countResult.rows[0].count);

        let nextPage = offset + limit < total ? page + 1 : null;

        res.status(StatusCodes.OK).json({
            collection: locations,
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

export let getEventLocationById = async (req, res) => {
    let { id } = req.params;
    let userId = req.participant.id;

    try {
        let result = await pool.query(`
            SELECT 
            el.*, l.name as locality_name, l.latitude as locality_latitude, l.longitude as locality_longitude,
                p.name as province_name, p.full_name as province_full_name
            FROM Event_Locations el
            LEFT JOIN Locations l ON el.id_location = l.id
            LEFT JOIN Provinces p ON l.id_province = p.id
            WHERE el.id = $1 AND el.id_creator_user = $2
        `, [id, userId]);

    if (result.rowCount === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'no encontrada'
            });
        }

        let location = result.rows[0];

        let locationDetail = {
            id: location.id,
            id_location: location.id_location,
            name: location.name,
            full_address: location.full_address,
            max_capacity: location.max_capacity,
            latitude: location.latitude,
            longitude: location.longitude,
            id_creator_user: location.id_creator_user,
            location: {
                id: location.id_location,
                name: location.locality_name,
                latitude: location.locality_latitude,
                longitude: location.locality_longitude,
                province: {
                    name: location.province_name,
                    full_name: location.province_full_name
                }
            }
        };

        res.status(StatusCodes.OK).json(locationDetail);

    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error interno'
        });
    }
};
export let createEventLocation = async (req, res) => {
    let { 
        id_location, name, full_address, max_capacity, 
        latitude, longitude 
    } = req.body;
    let userId = req.participant.id;
    try {
        if (!name || name.length < 3) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'debe tener 3  o mas caracteres'
            });
        }

        if (!full_address || full_address.length < 5) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'debe tener 5 o mas caracteres'
            });
        }
        if (max_capacity <= 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'max capacity must be over 0'
            });
        }

    let locationResult = await pool.query('SELECT id FROM Locations WHERE id = $1', [id_location]);

        if (locationResult.rowCount === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'La ubicación no existe'
            });
        }
        let result = await pool.query(`
            INSERT INTO Event_Locations (id_location, name, full_address, max_capacity, 
                                       latitude, longitude, id_creator_user)
            VALUES ($1, $2, $3, $4, $5, $6, $7)
            RETURNING id
        `, [
    id_location, name, full_address, max_capacity,
        latitude, longitude, userId
        ]);
        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'exito',
            locationId: result.rows[0].id
        });
    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error interno'
        });
    }
};
export let updateEventLocation = async (req, res) => {
    let { id } = req.params;
    let updateData = req.body;
    let userId = req.participant.id;

    try {
        let checkResult = await pool.query('SELECT id_creator_user FROM Event_Locations WHERE id = $1', [id]);
        if (checkResult.rowCount === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'no encontrada'
            });
        }

        if (checkResult.rows[0].id_creator_user !== userId) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'no hay permisos de edicion'
            });
        }
        if (updateData.name && updateData.name.length < 3) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'debe tener 3 o mas caracteres'
            });
        }

        if (updateData.full_address && updateData.full_address.length < 5) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'debe tener 5 o mas caracteres'
            });
        }

        if (updateData.max_capacity !== undefined && updateData.max_capacity <= 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'capacidad maxima debe srr mayor a cero'
            });
        }
        let updateFields = [];
        let values = [];
        let paramCount = 0;

        Object.keys(updateData).forEach(key => {
            if (key !== 'id' && key !== 'id_creator_user') {
                paramCount++;
                updateFields.push(`${key} = $${paramCount}`);
                values.push(updateData[key]);
            }
        });
        if (updateFields.length === 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'nada para actualizarr'
            });
        }
    paramCount++;
        values.push(id);

        let updateQuery = `UPDATE Event_Locations SET ${updateFields.join(', ')} WHERE id = $${paramCount}`;
        await pool.query(updateQuery, values);

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

export let deleteEventLocation = async (req, res) => {
    let { id } = req.params;
    let userId = req.participant.id;

    try {
        let checkResult = await pool.query('SELECT id_creator_user FROM Event_Locations WHERE id = $1', [id]);

        if (checkResult.rowCount === 0) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'no encntrada'
            });
        }

        if (checkResult.rows[0].id_creator_user !== userId) {
            return res.status(StatusCodes.NOT_FOUND).json({
                success: false,
                message: 'sin permisos para acceder'
            });
        }
        let eventsResult = await pool.query('SELECT COUNT(*) FROM Events WHERE id_event_location = $1', [id]);

        if (parseInt(eventsResult.rows[0].count) > 0) {
            return res.status(StatusCodes.BAD_REQUEST).json({
                success: false,
                message: 'hay eventos asociados, no se puede'
            });
        }
        await pool.query('DELETE FROM Event_Locations WHERE id = $1', [id]);

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