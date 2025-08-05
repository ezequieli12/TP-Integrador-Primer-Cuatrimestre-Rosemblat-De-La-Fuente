import pkg from 'pg';
import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import config from '../../configs/db-configs.js';
const { Pool } = pkg;
const pool = new Pool(config);

export default class userService {
    static async registerUser(username, password, first_name, last_name) {
        try {
            const checkUserQuery = 'SELECT id FROM Users WHERE username = $1';
            const existingUser = await pool.query(checkUserQuery, [username]);

            if (existingUser.rowCount > 0) {
                return {
                    success: false,
                    message: 'ya existe'
                };
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const insertQuery = `
                INSERT INTO Users (first_name, last_name, username, password)
                VALUES ($1, $2, $3, $4)
                RETURNING id, first_name, last_name, username
            `;
            const result = await pool.query(insertQuery, [
                first_name, last_name, username, hashedPassword
            ]);
            return {
                success: true,
                user: result.rows[0]
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
       
