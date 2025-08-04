const express = require('express');
const cors = require('cors');
require('dotenv').config();

const userRoutes = require('./routes/user.routes');

const app = express();
app.use(cors());
app.use(express.json());

app.use('/api/user', userRoutes);

app.get('/', (req, res) => {
  res.send('API de Eventos funcionando');
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en puerto ${PORT}`);
});

const eventRoutes = require('./routes/event.routes');
app.use('/api/event', eventRoutes);