import jwt from 'jsonwebtoken';
import { StatusCodes } from 'http-status-codes';

if (!process.env.JWT_SECRET) {
    throw new Error('no hay variable JWT_SECRET');
}
let JWT_SECRET = process.env.JWT_SECRET;
export let authenticateToken = (req, res, next) => {
    let authHeader = req.headers['authorization'];
    let token = authHeader && authHeader.split(' ')[1];
    if (!token) {
        return res.status(StatusCodes.UNAUTHORIZED).json({
            success: false,
            message: 'requiere token'
        });
    }
    jwt.verify(token, JWT_SECRET, (err, participant) => {
        if (err) {
            return res.status(StatusCodes.UNAUTHORIZED).json({
                success: false,
                message: 'token no valido'
            });
        }
        req.participant = participant;
        next();
    });
};
export let generateToken = (participant) => {
    return jwt.sign(
        {
            id: participant.id,
            first_name: participant.first_name,
            last_name: participant.last_name,
            username: participant.username
        },
        JWT_SECRET,
        { expiresIn: '24h' }
    );
}; 