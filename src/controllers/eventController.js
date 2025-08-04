const db = require('../config/db');

// 1. Listado paginado y filtrado de eventos
exports.getAllEvents = async (req, res) => {
  try {
    const { page = 1, limit = 10, name, startdate, tag } = req.query;
    const offset = (page - 1) * limit;

    let query = `
      SELECT e.*, u.first_name, u.last_name, el.name AS location_name
      FROM events e
      JOIN users u ON e.id_creator_user = u.id
      JOIN event_locations el ON e.id_event_location = el.id
      WHERE 1=1
    `;
    const params = [];

    if (name) {
      params.push(`%${name.toLowerCase()}%`);
      query += ` AND LOWER(e.name) LIKE $${params.length}`;
    }
    if (startdate) {
      params.push(startdate);
      query += ` AND DATE(e.start_date) = $${params.length}`;
    }
    if (tag) {
      params.push(tag.toLowerCase());
      query += ` AND EXISTS (
        SELECT 1 FROM event_tags et
        JOIN tags t ON t.id = et.id_tag
        WHERE et.id_event = e.id AND LOWER(t.name) = $${params.length}
      )`;
    }

    params.push(limit, offset);
    query += ` LIMIT $${params.length - 1} OFFSET $${params.length}`;

    const result = await db.query(query, params);
    res.json({ collection: result.rows });
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener los eventos' });
  }
};

// 2. Detalle de evento
exports.getEventById = async (req, res) => {
  try {
    const id = req.params.id;

    const result = await db.query(`
      SELECT * FROM events WHERE id = $1
    `, [id]);

    if (result.rowCount === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    // Podrías extenderlo con joins para ubicación, usuario y tags
    res.status(200).json(result.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al obtener el evento' });
  }
};

// 3. Crear evento
exports.createEvent = async (req, res) => {
  try {
    const {
      name, description, id_event_location, start_date,
      duration_in_minutes, price, enabled_for_enrollment, max_assistance
    } = req.body;

    if (!name || name.length < 3 || !description || description.length < 3 ||
        duration_in_minutes < 0 || price < 0 || max_assistance <= 0) {
      return res.status(400).json({ message: 'Datos inválidos' });
    }

    const userId = req.user.id;

    const capacityResult = await db.query(
      `SELECT max_capacity FROM event_locations WHERE id = $1`,
      [id_event_location]
    );

    if (capacityResult.rowCount === 0 || max_assistance > capacityResult.rows[0].max_capacity) {
      return res.status(400).json({ message: 'Capacidad excedida' });
    }

    const insertResult = await db.query(`
      INSERT INTO events (name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id_creator_user)
      VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9) RETURNING *
    `, [name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, userId]);

    res.status(201).json(insertResult.rows[0]);
  } catch (error) {
    res.status(500).json({ error: 'Error al crear evento' });
  }
};

// 4. Editar evento
exports.updateEvent = async (req, res) => {
  try {
    const {
      id, name, description, id_event_location, start_date,
      duration_in_minutes, price, enabled_for_enrollment, max_assistance
    } = req.body;

    const userId = req.user.id;

    const existing = await db.query(`SELECT * FROM events WHERE id = $1`, [id]);
    if (existing.rowCount === 0 || existing.rows[0].id_creator_user !== userId) {
      return res.status(404).json({ message: 'Evento no encontrado o no autorizado' });
    }

    const update = await db.query(`
      UPDATE events SET
        name = $1, description = $2, id_event_location = $3, start_date = $4,
        duration_in_minutes = $5, price = $6, enabled_for_enrollment = $7, max_assistance = $8
      WHERE id = $9
    `, [name, description, id_event_location, start_date, duration_in_minutes, price, enabled_for_enrollment, max_assistance, id]);

    res.status(200).json({ message: 'Evento actualizado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al actualizar evento' });
  }
};

// 5. Eliminar evento
exports.deleteEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const existing = await db.query(`SELECT * FROM events WHERE id = $1`, [eventId]);
    if (existing.rowCount === 0 || existing.rows[0].id_creator_user !== userId) {
      return res.status(404).json({ message: 'Evento no encontrado o no autorizado' });
    }

    const inscriptos = await db.query(`SELECT * FROM user_events WHERE id_event = $1`, [eventId]);
    if (inscriptos.rowCount > 0) {
      return res.status(400).json({ message: 'No se puede eliminar: hay usuarios inscriptos' });
    }

    await db.query(`DELETE FROM events WHERE id = $1`, [eventId]);
    res.status(200).json({ message: 'Evento eliminado' });
  } catch (error) {
    res.status(500).json({ error: 'Error al eliminar evento' });
  }
};

// 6. Inscribirse a evento
exports.enrollToEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await db.query(`SELECT * FROM events WHERE id = $1`, [eventId]);
    if (event.rowCount === 0) return res.status(404).json({ message: 'Evento no encontrado' });

    const e = event.rows[0];
    const now = new Date();
    const eventDate = new Date(e.start_date);
    if (eventDate <= now || !e.enabled_for_enrollment) {
      return res.status(400).json({ message: 'No se puede inscribir a este evento' });
    }

    const registrados = await db.query(`SELECT COUNT(*) FROM user_events WHERE id_event = $1`, [eventId]);
    if (+registrados.rows[0].count >= e.max_assistance) {
      return res.status(400).json({ message: 'Capacidad completa' });
    }

    const yaInsc = await db.query(`SELECT * FROM user_events WHERE id_user = $1 AND id_event = $2`, [userId, eventId]);
    if (yaInsc.rowCount > 0) {
      return res.status(400).json({ message: 'Ya estás inscripto' });
    }

    await db.query(`INSERT INTO user_events (id_user, id_event, registration_date_time) VALUES ($1, $2, NOW())`, [userId, eventId]);
    res.status(201).json({ message: 'Inscripción exitosa' });
  } catch (error) {
    res.status(500).json({ error: 'Error al inscribirse' });
  }
};

// 7. Cancelar inscripción
exports.unenrollFromEvent = async (req, res) => {
  try {
    const eventId = req.params.id;
    const userId = req.user.id;

    const event = await db.query(`SELECT * FROM events WHERE id = $1`, [eventId]);
    if (event.rowCount === 0) return res.status(404).json({ message: 'Evento no encontrado' });

    const e = event.rows[0];
    const now = new Date();
    const eventDate = new Date(e.start_date);
    if (eventDate <= now) {
      return res.status(400).json({ message: 'No se puede cancelar inscripción a evento pasado' });
    }

    const yaInsc = await db.query(`SELECT * FROM user_events WHERE id_user = $1 AND id_event = $2`, [userId, eventId]);
    if (yaInsc.rowCount === 0) {
      return res.status(400).json({ message: 'No estás inscripto en este evento' });
    }

    await db.query(`DELETE FROM user_events WHERE id_user = $1 AND id_event = $2`, [userId, eventId]);
    res.status(200).json({ message: 'Inscripción cancelada' });
  } catch (error) {
    res.status(500).json({ error: 'Error al cancelar inscripción' });
  }
};
