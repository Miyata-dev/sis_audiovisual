import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class VotesService {
  
  async getActiveVotingEvent() {
    const activeEvent = await prisma.votingEvent.findFirst({
      where: { status: 'ACTIVO' },
      orderBy: { id: 'desc' },
    });
    if (!activeEvent) throw new NotFoundException('No hay ninguna votación activa en este momento');
    return activeEvent;
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
      if (votoExistente) throw new BadRequestException('El usuario ya ha emitido un voto en esta sesión.');

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
  
  // AHORA EL DASHBOARD TRAE EL HISTORIAL DE TEMAS FINALIZADOS
  async getLiveDashboard(requestedSessionId?: number) {
    const activeEvent = await prisma.votingEvent.findFirst({
      where: { status: 'ACTIVO' },
      orderBy: { id: 'desc' },
    });

    // Usa la sesión que pidió el frontend. Si no pidió, usa la del evento activo o 3 por defecto
    const sessionId = requestedSessionId || (activeEvent ? activeEvent.sessionId : 3);
    
    // Si la sesión que el Presidente está viendo en pantalla NO ES la del evento activo, se oculta la votación
    const eventoAEnviar = (activeEvent && activeEvent.sessionId === sessionId) ? activeEvent : null;

    let conteoVotos: any[] = [];
    if (eventoAEnviar) {
      conteoVotos = await prisma.vote.findMany({
        where: { votingEventId: eventoAEnviar.id },
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

    // BUSCAMOS LOS TEMAS FINALIZADOS PARA EL HISTORIAL
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
      evento: activeEvent,
      resultados: conteoVotos.reduce((acc, curr) => {
        acc[curr.option] = (acc[curr.option] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      asistentes: asistencia.map(a => a.User.name),
      solicitudes: colaPalabra.map(p => ({
        id: p.id, nombre: p.User.name, hora: p.requestedAt, status: p.status,
      })),
      historial, // ENVIAMOS EL HISTORIAL AL FRONTEND
    };
  }
  
  async crearVotacion(title: string, sessionId: number) {
    const activa = await prisma.votingEvent.findFirst({ where: { status: 'ACTIVO' } });
    if (activa) throw new BadRequestException('Ya existe una votación activa. Ciérrala primero.');
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
// Obtener todas las sesiones reales
  async getSessions() {
    return prisma.session.findMany({
      orderBy: { id: 'desc' },
    });
  }

  // Crear una nueva sesión
 async createSession(title: string, theme: string) {
    return prisma.session.create({
      data: {
        title,
        theme, 
        status: 'ABIERTA',
      },
    });
  }

  // Finalizar una sesión completa
  async finalizarSesionCompleta(sessionId: number) {
    return prisma.session.update({
      where: { id: sessionId },
      data: { status: 'FINALIZADA' },
    });
  }
}