import { getVotes } from '../controllers/voteController.js';

async function voteRoutes(fastify, options) {
  fastify.get('/votes', getVotes);
}

export default voteRoutes;