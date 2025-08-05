import express from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import apiRoutes from './routes/api.js';
dotenv.config();

let app = express();
let PORT = process.env.PORT || 3000;
let corsOptions = process.env.NODE_ENV === 'production'
  ? { origin: process.env.FRONTEND_URL, optionsSuccessStatus: 200 }
  : {};
app.use(cors(corsOptions));
app.use(express.json());

app.use('/api', apiRoutes);

app.use((err, req, res, next) => {
    console.error('error:', err);
    res.status(err.status || 500).json({
        success: false,
        message: err.message || 'error interno'
    });
});

app.get('/', (req, res) => {
    res.send('funcionando');
});

app.listen(PORT, () => {
console.log(`servidor por puerto ${PORT}`);
});