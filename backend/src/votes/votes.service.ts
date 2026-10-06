import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class VotesService {
  
  // CORRECCIÓN: Filtra por sessionId y retorna null en vez de romper la app
  async getActiveVotingEvent(sessionId?: number) {
    const whereClause: any = { status: 'ACTIVO' };
    if (sessionId) {
      whereClause.sessionId = sessionId;
    }
    
    const activeEvent = await prisma.votingEvent.findFirst({
      where: whereClause,
      orderBy: { id: 'desc' },
    });
    
    return activeEvent || null;
  }

  async checkUserVote(userId: number, votingEventId: number) {
    const voto = await prisma.vote.findUnique({
      where: { userId_votingEventId: { userId, votingEventId } },
    });
    return { hasVoted: !!voto, option: voto?.option || null };
  }

  async emitirVoto(userId: number, votingEventId: number, option: string) {
    try {
      const votoExistente = await prisma.vote.findUnique({
        where: { userId_votingEventId: { userId, votingEventId } },
      });
      if (votoExistente) throw new BadRequestException('El usuario ya ha emitido un voto en este tema.');

      const nuevoVoto = await prisma.vote.create({
        data: { userId, votingEventId, option },
      });
      return { success: true, data: nuevoVoto };
    } catch (error) {
      throw new BadRequestException(error instanceof Error ? error.message : String(error));
    }
  }
  
  async registrarAsistencia(userId: number, sessionId: number) {
    const existe = await prisma.attendance.findUnique({
      where: { userId_sessionId: { userId, sessionId } },
    });
    if (existe) return { success: true, message: 'Asistencia ya registrada' };

    await prisma.attendance.create({ data: { userId, sessionId } });
    return { success: true };
  }

  async solicitarPalabra(userId: number, sessionId: number) {
    await prisma.speakingRequest.create({
      data: { userId, sessionId, status: 'PENDIENTE' },
    });
    return { success: true };
  }
  
  async cancelarPalabra(userId: number, sessionId: number) {
    await prisma.speakingRequest.deleteMany({
      where: { userId, sessionId, status: { in: ['PENDIENTE', 'HABLANDO'] } },
    });
    return { success: true };
  }
  
  async getUserSessionStatus(userId: number, sessionId: number) {
    const asistencia = await prisma.attendance.findUnique({
      where: { userId_sessionId: { userId, sessionId } },
    });
    const palabra = await prisma.speakingRequest.findFirst({
      where: { userId, sessionId, status: { in: ['PENDIENTE', 'HABLANDO'] } },
    });
    return {
      presente: !!asistencia,
      palabraSolicitada: !!palabra,
      estadoPalabra: palabra ? palabra.status : null,
    };
  }
  
  // Aislamiento total por sesión
  async getLiveDashboard(requestedSessionId?: number) {
    let sessionId = requestedSessionId;

    if (!sessionId) {
      const ultimaSesion = await prisma.session.findFirst({
        orderBy: { id: 'desc' }
      });
      if (!ultimaSesion) {
        return { evento: null, resultados: {}, asistentes: [], solicitudes: [], historial: [] };
      }
      sessionId = ultimaSesion.id;
    }

    // Aseguramos que la votación activa SOLO se muestre si pertenece a ESTA sesión seleccionada
    const eventoEnEstaSesion = await prisma.votingEvent.findFirst({
      where: { 
        status: 'ACTIVO',
        sessionId: sessionId 
      },
      orderBy: { id: 'desc' },
    });

    let conteoVotos: any[] = [];
    if (eventoEnEstaSesion) {
      conteoVotos = await prisma.vote.findMany({
        where: { votingEventId: eventoEnEstaSesion.id },
        select: { option: true },
      });
    }

    const asistencia = await prisma.attendance.findMany({
      where: { sessionId: sessionId },
      include: { User: { select: { name: true } } },
    });

    const colaPalabra = await prisma.speakingRequest.findMany({
      where: { sessionId: sessionId, status: { in: ['PENDIENTE', 'HABLANDO'] } },
      orderBy: { requestedAt: 'asc' },
      include: { User: { select: { name: true } } },
    });

    const temasFinalizados = await prisma.votingEvent.findMany({
      where: { status: 'FINALIZADO', sessionId: sessionId },
      orderBy: { id: 'desc' },
    });
    
    const todosLosVotosHistorial = await prisma.vote.findMany({
      where: { votingEventId: { in: temasFinalizados.map(t => t.id) } }
    });

    const historial = temasFinalizados.map(tema => {
      const votosTema = todosLosVotosHistorial.filter(v => v.votingEventId === tema.id);
      const resultados = votosTema.reduce((acc, curr) => {
        acc[curr.option] = (acc[curr.option] || 0) + 1;
        return acc;
      }, {} as Record<string, number>);
      return { id: tema.id, title: tema.title, resultados, totalVotos: votosTema.length };
    });

    return {
      evento: eventoEnEstaSesion, 
      resultados: conteoVotos.reduce((acc, curr) => {
        acc[curr.option] = (acc[curr.option] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      asistentes: asistencia.map(a => a.User.name),
      solicitudes: colaPalabra.map(p => ({
        id: p.id, nombre: p.User.name, hora: p.requestedAt, status: p.status,
      })),
      historial,
    };
  }
  
  // CORRECCIÓN: Solo verifica si hay una votación activa en la sesión específica, no en toda la base
  async crearVotacion(title: string, sessionId: number) {
    const activaEnEstaSesion = await prisma.votingEvent.findFirst({ 
      where: { status: 'ACTIVO', sessionId: sessionId } 
    });
    
    if (activaEnEstaSesion) throw new BadRequestException('Ya existe un tema activo en esta sesión. Ciérralo primero.');
    
    const nuevoEvento = await prisma.votingEvent.create({ data: { title, sessionId, status: 'ACTIVO' } });
    return { success: true, data: nuevoEvento };
  }

  async otorgarPalabra(solicitudId: number) {
    await prisma.speakingRequest.updateMany({
      where: { status: 'HABLANDO' },
      data: { status: 'FINALIZADO' },
    });
    const solicitud = await prisma.speakingRequest.update({
      where: { id: solicitudId },
      data: { status: 'HABLANDO' },
    });
    return { success: true, data: solicitud };
  }

  async terminarPalabra(solicitudId: number) {
    const solicitud = await prisma.speakingRequest.update({
      where: { id: solicitudId },
      data: { status: 'FINALIZADO' },
    });
    return { success: true, data: solicitud };
  }
  
  async cerrarVotacion(votingEventId: number) {
    const evento = await prisma.votingEvent.findUnique({ where: { id: votingEventId } });
    if (!evento) throw new NotFoundException('Evento no encontrado');

    const eventoCerrado = await prisma.votingEvent.update({
      where: { id: votingEventId },
      data: { status: 'FINALIZADO' },
    });

    await prisma.speakingRequest.updateMany({
      where: { sessionId: evento.sessionId, status: { in: ['PENDIENTE', 'HABLANDO'] } },
      data: { status: 'FINALIZADO' },
    });
    return { success: true, data: eventoCerrado };
  }

  async getSessions() {
    return prisma.session.findMany({
      orderBy: { id: 'desc' },
    });
  }

  async createSession(title: string, theme: string) {
    return prisma.session.create({
      data: {
        title,
        theme, 
        status: 'ABIERTA',
      },
    });
  }
// Finalizar una sesión completa y cerrar todo lo que haya quedado abierto
  async finalizarSesionCompleta(sessionId: number) {
    // Cerramos cualquier votación que haya quedado en estado 'ACTIVO' en esta sesión
    await prisma.votingEvent.updateMany({
      where: { 
        sessionId: sessionId,
        status: 'ACTIVO' 
      },
      data: { status: 'FINALIZADA' }
    });

    // Limpiamos la cola de palabra 
    await prisma.speakingRequest.updateMany({
      where: { 
        sessionId: sessionId, 
        status: { in: ['PENDIENTE', 'HABLANDO'] } 
      },
      data: { status: 'FINALIZADA' },
    });

    // Finalmente, cambiamos el estado de la sesión a 'FINALIZADA'
    return prisma.session.update({
      where: { id: sessionId },
      data: { status: 'FINALIZADA' },
    });
  }
}