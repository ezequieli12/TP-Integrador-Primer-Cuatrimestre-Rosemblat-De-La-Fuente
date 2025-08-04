const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const pool = require('../config/db');
const validator = require('../services/validator');

exports.register = async (req, res) => {
  const { first_name, last_name, username, password } = req.body;

  // Validaciones
  if (!first_name || first_name.length < 3) return res.status(400).json({ message: 'Nombre inválido' });
  if (!last_name || last_name.length < 3) return res.status(400).json({ message: 'Apellido inválido' });
  if (!validator.isValidEmail(username)) return res.status(400).json({ message: 'El email es invalido.' });
  if (!password || password.length < 3) return res.status(400).json({ message: 'Password inválido' });

  try {
    const hashedPassword = await bcrypt.hash(password, 10);
    const result = await pool.query(
      `INSERT INTO users (first_name, last_name, username, password) VALUES ($1, $2, $3, $4) RETURNING id`,
      [first_name, last_name, username, hashedPassword]
    );
    return res.status(201).json({ success: true, id: result.rows[0].id });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error en servidor' });
  }
};

exports.login = async (req, res) => {
  const { username, password } = req.body;

  if (!validator.isValidEmail(username)) {
    return res.status(400).json({ success: false, message: 'El email es invalido.', token: '' });
  }

  try {
    const result = await pool.query(`SELECT * FROM users WHERE username = $1`, [username]);
    if (result.rows.length === 0) {
      return res.status(401).json({ success: false, message: 'Usuario o clave inválida.', token: '' });
    }

    const user = result.rows[0];
    const match = await bcrypt.compare(password, user.password);
    if (!match) {
      return res.status(401).json({ success: false, message: 'Usuario o clave inválida.', token: '' });
    }

    const token = jwt.sign(
      { id: user.id, first_name: user.first_name, last_name: user.last_name },
      process.env.JWT_SECRET,
      { expiresIn: '2h' }
    );

    return res.status(200).json({ success: true, message: '', token });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ success: false, message: 'Error en servidor', token: '' });
  }
};
