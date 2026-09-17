import dotenv from 'dotenv';
import Fastify from 'fastify';
import voteRoutes from './routes/voteRoutes.js';

dotenv.config();

const fastify = Fastify({ logger: true });

// on VM this will be uncommented.,  Register Routes
//fastify.register(voteRoutes, { prefix: '/api' });

fastify.get('/', async () => {
  return { status: 'OK', timestamp: new Date() };
});

const start = async () => {
  try {
    const port = process.env.PORT || 3000;
    await fastify.listen({ port: port, host: '0.0.0.0' });
    console.log(`Server listening on port ${port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};

start();