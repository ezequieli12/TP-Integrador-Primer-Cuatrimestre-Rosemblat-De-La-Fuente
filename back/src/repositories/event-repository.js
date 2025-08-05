import config from '../../configs/db-configs.js';
const { Pool } = pkg;
const pool = new Pool(config);
