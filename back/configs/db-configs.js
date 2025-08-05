import dotenv from 'dotenv';

dotenv.config();

let requiredEnv = ['DB_HOST', 'DB_PORT', 'DB_NAME', 'DB_USER', 'DB_PASSWORD'];
requiredEnv.forEach((envVar) => {
    if (!process.env[envVar]) {
        throw new Error(`Falta la variable deseada: ${envVar}`);
    }
    else {
        console.log(`variable ${envVar} 👌`)
    }
});

let config = {
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    participant: process.env.DB_USER,
    password: process.env.DB_PASSWORD
};

export default config; 