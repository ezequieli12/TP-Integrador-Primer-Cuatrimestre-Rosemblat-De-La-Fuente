const pool = require('../config/db');

exports.list = async (req, res) => {
  const { name, startdate, tag, page = 1, limit = 10 } = req.query;
  const offset = (page - 1) * limit;

  try {
    let query = `
      SELECT e.*, 
        json_build_object('id', u.id, 'username', u.username, 'first_name', u.first_name, 'last_name', u.last_name) AS creator_user,
        (
          SELECT json_build_object(
            'id', el.id,
            'name', el.name,
            'full_address', el.full_address,
            'latitude', el.latitude,
            'longitude', el.longitude,
            'max_capacity', el.max_capacity,
            'location', json_build_object(
              'id', l.id,
              'name', l.name,
              'latitude', l.latitude,
              'longitude', l.longitude,
              'province', json_build_object(
                'id', p.id,
                'name', p.name,
                'full_name', p.full_name,
                'latitude', p.latitude,
                'longitude', p.longitude
              )
            )
          )
          FROM event_locations el
          JOIN locations l ON el.id_location = l.id
          JOIN provinces p ON l.id_province = p.id
          WHERE el.id = e.id_event_location
        ) AS event_location,
        (
          SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
          FROM event_tags et
          JOIN tags t ON et.id_tag = t.id
          WHERE et.id_event = e.id
        ) AS tags
      FROM events e
      JOIN users u ON e.id_creator_user = u.id
      WHERE 1 = 1
    `;

    let params = [];
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
      query += ` AND e.id IN (
        SELECT id_event FROM event_tags et
        JOIN tags t ON et.id_tag = t.id
        WHERE LOWER(t.name) = $${params.length}
      )`;
    }

    query += ` ORDER BY e.start_date LIMIT ${limit} OFFSET ${offset}`;

    const result = await pool.query(query, params);
    return res.json({ collection: result.rows });
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error en servidor' });
  }
};

exports.getById = async (req, res) => {
  const { id } = req.params;

  try {
    const query = `
      SELECT e.*,
        json_build_object('id', u.id, 'username', u.username, 'first_name', u.first_name, 'last_name', u.last_name, 'password', u.password) AS creator_user,
        (
          SELECT json_build_object(
            'id', el.id,
            'id_location', l.id,
            'name', el.name,
            'full_address', el.full_address,
            'latitude', el.latitude,
            'longitude', el.longitude,
            'max_capacity', el.max_capacity,
            'id_creator_user', el.id_creator_user,
            'location', json_build_object(
              'id', l.id,
              'name', l.name,
              'id_province', p.id,
              'latitude', l.latitude,
              'longitude', l.longitude,
              'province', json_build_object(
                'id', p.id,
                'name', p.name,
                'full_name', p.full_name,
                'latitude', p.latitude,
                'longitude', p.longitude,
                'display_order', p.display_order
              )
            ),
            'creator_user', json_build_object(
              'id', uc.id,
              'first_name', uc.first_name,
              'last_name', uc.last_name,
              'username', uc.username,
              'password', uc.password
            )
          )
          FROM event_locations el
          JOIN locations l ON el.id_location = l.id
          JOIN provinces p ON l.id_province = p.id
          JOIN users uc ON el.id_creator_user = uc.id
          WHERE el.id = e.id_event_location
        ) AS event_location,
        (
          SELECT json_agg(json_build_object('id', t.id, 'name', t.name))
          FROM event_tags et
          JOIN tags t ON et.id_tag = t.id
          WHERE et.id_event = e.id
        ) AS tags
      FROM events e
      JOIN users u ON e.id_creator_user = u.id
      WHERE e.id = $1
    `;

    const result = await pool.query(query, [id]);
    if (result.rows.length === 0) {
      return res.status(404).json({ message: 'Evento no encontrado' });
    }

    return res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error en servidor' });
  }
};

exports.enroll = async (req, res) => {
  const id_event = parseInt(req.params.id);
  const id_user = req.user.id;

  try {
    const event = await pool.query(`SELECT * FROM events WHERE id = $1`, [id_event]);
    if (event.rows.length === 0) return res.status(404).json({ message: 'Evento no encontrado' });

    const ev = event.rows[0];
    if (!ev.enabled_for_enrollment) return res.status(400).json({ message: 'Evento no habilitado para inscripción' });

    const now = new Date();
    if (new Date(ev.start_date) <= now) return res.status(400).json({ message: 'El evento ya ocurrió o es hoy' });

    const enrolledCount = await pool.query(`SELECT COUNT(*) FROM event_enrollments WHERE id_event = $1`, [id_event]);
    if (parseInt(enrolledCount.rows[0].count) >= ev.max_assistance) {
      return res.status(400).json({ message: 'Capacidad máxima alcanzada' });
    }

    const alreadyEnrolled = await pool.query(
      `SELECT * FROM event_enrollments WHERE id_event = $1 AND id_user = $2`,
      [id_event, id_user]
    );
    if (alreadyEnrolled.rows.length > 0) {
      return res.status(400).json({ message: 'Ya estás inscrito en este evento' });
    }

    await pool.query(
      `INSERT INTO event_enrollments (id_event, id_user, registration_date_time) VALUES ($1, $2, NOW())`,
      [id_event, id_user]
    );
    return res.status(201).json({ message: 'Inscripción exitosa' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error en servidor' });
  }
};

exports.unenroll = async (req, res) => {
  const id_event = parseInt(req.params.id);
  const id_user = req.user.id;

  try {
    const event = await pool.query(`SELECT * FROM events WHERE id = $1`, [id_event]);
    if (event.rows.length === 0) return res.status(404).json({ message: 'Evento no encontrado' });

    const ev = event.rows[0];
    const now = new Date();
    if (new Date(ev.start_date) <= now) return res.status(400).json({ message: 'No se puede cancelar inscripción a evento pasado o de hoy' });

    const enrolled = await pool.query(
      `SELECT * FROM event_enrollments WHERE id_event = $1 AND id_user = $2`,
      [id_event, id_user]
    );
    if (enrolled.rows.length === 0) {
      return res.status(400).json({ message: 'No estás inscrito en este evento' });
    }

    await pool.query(`DELETE FROM event_enrollments WHERE id_event = $1 AND id_user = $2`, [id_event, id_user]);
    return res.status(200).json({ message: 'Baja de inscripción exitosa' });

  } catch (err) {
    console.error(err);
    return res.status(500).json({ message: 'Error en servidor' });
  }
};
