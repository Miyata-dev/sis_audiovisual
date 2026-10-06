import { PrismaClient } from '@prisma/client';
const prisma = new PrismaClient();

async function main() {
  const evento = await prisma.votingEvent.create({
    data: {
      title: 'Presupuesto 2026',
      description: 'Presupuesto anual 2026',
      sessionId: 3, 
      status: 'ACTIVO', // Cambia a 'activo' si tu base de datos lo pide en minúsculas
    },
  });
  console.log('¡Evento creado! ID:', evento.id);
}

main().finally(() => prisma.$disconnect()); 