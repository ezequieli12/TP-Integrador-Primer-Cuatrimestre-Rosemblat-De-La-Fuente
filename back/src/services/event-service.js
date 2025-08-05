import pkg from 'pg';
import config from '../../configs/db-configs.js';
const { Pool } = pkg;
const pool = new Pool(config);

export class eventService {
    static async getAllEvents(page = 1, limit = 15, filters = {}) {
        try {
            const offset = (page - 1) * limit;
            const client = await pool.connect();
            
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

            if (filters.name) {
            paramCount++;
            sqlQuery += ` AND e.name ILIKE $${paramCount}`;
             values.push(`%${filters.name}%`);
            }
            if (filters.startdate) {
                paramCount++;
                sqlQuery += ` AND DATE(e.start_date) = $${paramCount}`;
                values.push(filters.startdate);
            }

            if (filters.tag) {
                paramCount++;
                sqlQuery += ` AND EXISTS (
                    SELECT 1 FROM Event_Tags et 
                    JOIN Tags t ON et.id_tag = t.id 
                    WHERE et.id_event = e.id AND t.name ILIKE $${paramCount}
                )`;
                values.push(`%${filters.tag}%`);
            }
            paramCount++;
            sqlQuery += ` ORDER BY e.id ASC LIMIT $${paramCount} OFFSET $${paramCount + 1}`;
            values.push(limit, offset);

            const result = await client.query(sqlQuery, values);
            client.release();
            return {
                success: true,
                events: result.rows,
                total: result.rowCount
            };

        } catch (error) {
            console.error('error:', error);
            return {
                success: false,
                message: 'error interno'
            };
        }
    }
    static async getEventById(id) {
        try {
            const client = await pool.connect();
            
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
                WHERE e.id = $1
            `;
            const result = await client.query(sqlQuery, [id]);
            client.release();

            if (result.rowCount === 0) {
                return {
                    success: false,
                    message: 'no encontrado'
                };
            }
            return {
            success: true,
                event: result.rows[0]
            };

        } catch (error) {
            console.error('error:', error);
            return {
                success: false,
                message: 'error interno'
            };
        }
    }
}