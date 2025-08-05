import pkg from 'pg';
import bcrypt from 'bcryptjs';
import { StatusCodes } from 'http-status-codes';
import config from '../../configs/db-configs.js';
import { generateToken } from '../../middleware/autenticar.js';
import { validaciones } from '../helpers/validaciones/validaciones.js';

let { Pool } = pkg;
let pool = new Pool(config);
let validacionesInstance = new validaciones();

export let registerUser = async (req, res) => {
    let { first_name, last_name, username, password } = req.body;

    try {
        try {
            await validacionesInstance.isValidString(first_name, "nombre");
            await validacionesInstance.isValidString(last_name, "apellido");
            await validacionesInstance.isValidEmail(username);
            await validacionesInstance.isValidString(password, "contraseña");
        } catch (error) {
return res.status(StatusCodes.BAD_REQUEST).json({ 
    success: false, 
    message: error.message 
        });
    }
        let existingUserQuery = 'SELECT id FROM Users WHERE username = $1';
        let existingUserResult = await pool.query(existingUserQuery, [username]);

        if (existingUserResult.rowCount > 0) {
            return res.status(StatusCodes.CONFLICT).json({
                success: false,
                message: 'ya existe'
            });
        }

        let hashedPassword = await bcrypt.hash(password, 10);
        let insertQuery = `
            INSERT INTO Users (first_name, last_name, username, password)
            VALUES ($1, $2, $3, $4)
            RETURNING id, first_name, last_name, username
        `;
        let result = await pool.query(insertQuery, [
            first_name, last_name, username, hashedPassword
        ]);

        res.status(StatusCodes.CREATED).json({
            success: true,
            message: 'exito',
            participant: result.rows[0]
        });

    } catch (error) {
        console.error('osjsiuh:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error intenro'
        });
    }
};

export let loginUser = async (req, res) => {
    let { username, password } = req.body;

    try {
        try {
    await validacionesInstance.isValidEmail(username);
    await validacionesInstance.isValidString(password, "contraseña");
        } catch (error) {
            console.error(error)
            return res.status(StatusCodes.BAD_REQUEST).json({ 
                success: false, 
                message: error.message,
                token: ''
            });
        }
        let query = 'SELECT * FROM Users WHERE username = $1';
        let result = await pool.query(query, [username]);
        if (result.rowCount === 0) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'invalido',
                token: ''
            });
        }

        let participant = result.rows[0];
        let isValidPassword = await bcrypt.compare(password, participant.password);

        if (!isValidPassword) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'invalido',
                token: ''
            });
        }

        let token = generateToken(participant);
        res.status(StatusCodes.OK).json({
            success: true,
            message: 'exito',
            token: token
        });

    } catch (error) {
        console.error('error:', error);
        res.status(StatusCodes.INTERNAL_SERVER_ERROR).json({
            success: false,
            message: 'error interno',
            token: ''
        });
    }
}; 