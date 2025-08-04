const db = require('../config/db');

exports.getAll = async (req, res) => {
  try {
    const userId = req.user.id;
    const result = await db.query(`SELECT * FROM event_locations WHERE id_creator_user = $1`, [userId]);
    res.status(200).json(result.rows);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ubicaciones' });
  }
};

exports.getById = async (req, res) => {
  try {
    const { id } = req.params;
    const userId = req.user.id;

    const result = await db.query(`SELECT * FROM event_locations WHERE id = $1 AND id_creator_user = $2`, [id, userId]);
    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Ubicación no encontrada o no autorizada' });
    }

    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener ubicación' });
  }
};

exports.create = async (req, res) => {
  try {
    const userId = req.user.id;
    const { name, full_address, max_capacity, latitude, longitude, id_location } = req.body;

    if (!name || name.length < 3 || !full_address || full_address.length < 3 || max_capacity <= 0) {
      return res.status(400).json({ message: 'Datos inválidos' });
    }

    // Verificamos que exista la localidad
    const loc = await db.query(`SELECT * FROM locations WHERE id = $1`, [id_location]);
    if (loc.rowCount === 0) {
      return res.status(400).json({ message: 'Localidad inexistente' });
    }

    const insert = await db.query(`
      INSERT INTO event_locations (name, full_address, max_capacity, latitude, longitude, id_location, id_creator_user)
      VALUES ($1, $2, $3, $4, $5, $6, $7)
      RETURNING *
    `, [name, full_address, max_capacity, latitude, longitude, id_location, userId]);

    res.status(201).json(insert.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear ubicación' });
  }
};

exports.update = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;
    const { name, full_address, max_capacity, latitude, longitude, id_location } = req.body;

    const existing = await db.query(`SELECT * FROM event_locations WHERE id = $1`, [id]);
    if (existing.rowCount === 0 || existing.rows[0].id_creator_user !== userId) {
      return res.status(404).json({ message: 'Ubicación no encontrada o no autorizada' });
    }

    await db.query(`
      UPDATE event_locations
      SET name = $1, full_address = $2, max_capacity = $3,
          latitude = $4, longitude = $5, id_location = $6
      WHERE id = $7
    `, [name, full_address, max_capacity, latitude, longitude, id_location, id]);

    res.status(200).json({ message: 'Ubicación actualizada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar ubicación' });
  }
};

exports.remove = async (req, res) => {
  try {
    const userId = req.user.id;
    const { id } = req.params;

    const existing = await db.query(`SELECT * FROM event_locations WHERE id = $1`, [id]);
    if (existing.rowCount === 0 || existing.rows[0].id_creator_user !== userId) {
      return res.status(404).json({ message: 'Ubicación no encontrada o no autorizada' });
    }

    await db.query(`DELETE FROM event_locations WHERE id = $1`, [id]);
    res.status(200).json({ message: 'Ubicación eliminada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar ubicación' });
  }
};
