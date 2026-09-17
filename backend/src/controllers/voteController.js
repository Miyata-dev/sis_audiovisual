import { query } from '../config/db.js';

export const getVotes = async (request, reply) => {
  try {
    const result = await query('SELECT * FROM votes');
    return result.rows;
  } catch (err) {
    request.log.error(err);
    return reply.status(500).send({ error: 'Database error' });
  }
};