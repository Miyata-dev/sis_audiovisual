import { Injectable, BadRequestException, NotFoundException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class VotesService {
  
  // Nueva función para obtener la votación activa
  async getActiveVotingEvent() {
    const activeEvent = await prisma.votingEvent.findFirst({
      where: {
        status: 'ACTIVO',
      },
      orderBy: {
        id: 'desc', 
      },
    });

    if (!activeEvent) {
      throw new NotFoundException('No hay ninguna votación activa en este momento');
    }

    return activeEvent;
  }

  // Verifica si un usuario específico ya votó en un evento
  async checkUserVote(userId: number, votingEventId: number) {
    const voto = await prisma.vote.findUnique({
      where: {
        userId_votingEventId: {
          userId,
          votingEventId,
        },
      },
    });

    return { 
      hasVoted: !!voto, 
      option: voto?.option || null 
    };
  }

  async emitirVoto(userId: number, votingEventId: number, option: string) {
    try {
      // Verifica si el usuario ya votó en este evento para evitar duplicados
      const votoExistente = await prisma.vote.findUnique({
        where: {
          userId_votingEventId: {
            userId,
            votingEventId,
          },
        },
      });

      if (votoExistente) {
        throw new BadRequestException('El usuario ya ha emitido un voto en esta sesión.');
      }

      // Registra el nuevo voto
      const nuevoVoto = await prisma.vote.create({
        data: {
          userId,
          votingEventId,
          option,
        },
      });

      return { success: true, data: nuevoVoto };
    } catch (error) {
      throw new BadRequestException(
        error instanceof Error ? error.message : String(error),
      );
    }
  }
  
  // Registrar asistencia
  async registrarAsistencia(userId: number, sessionId: number) {
    const existe = await prisma.attendance.findUnique({
      where: {
        userId_sessionId: { userId, sessionId },
      },
    });

    if (existe) return { success: true, message: 'Asistencia ya registrada' };

    await prisma.attendance.create({
      data: { userId, sessionId },
    });
    return { success: true };
  }

  // Solicitar la palabra
  async solicitarPalabra(userId: number, sessionId: number) {
    await prisma.speakingRequest.create({
      data: {
        userId,
        sessionId,
        status: 'PENDIENTE',
      },
    });
    return { success: true };
  }
  
  // Cancelar solicitud de palabra o Terminar Intervención (CORREGIDO)
  async cancelarPalabra(userId: number, sessionId: number) {
    await prisma.speakingRequest.deleteMany({
      where: {
        userId: userId,
        sessionId: sessionId,
        status: { in: ['PENDIENTE', 'HABLANDO'] }, // <-- Ahora borra en ambos estados
      },
    });
    return { success: true };
  }
  
  // Recupera el estado de los botones al cargar la página (CORREGIDO)
  async getUserSessionStatus(userId: number, sessionId: number) {
    const asistencia = await prisma.attendance.findUnique({
      where: { userId_sessionId: { userId, sessionId } },
    });
    
    const palabra = await prisma.speakingRequest.findFirst({
      where: { 
        userId, 
        sessionId, 
        status: { in: ['PENDIENTE', 'HABLANDO'] } // <-- Busca ambos estados
      },
    });

    return {
      presente: !!asistencia,
      palabraSolicitada: !!palabra,
      estadoPalabra: palabra ? palabra.status : null, // <-- Devuelve el estado exacto
    };
  }
  
  // Dashboard en tiempo real para el Presidente (CORREGIDO)
  async getLiveDashboard() {
    const activeEvent = await prisma.votingEvent.findFirst({
      where: { status: 'ACTIVO' },
      orderBy: { id: 'desc' },
    });

    const sessionId = activeEvent ? activeEvent.sessionId : 3;

    let conteoVotos: any[] = [];
    
    if (activeEvent) {
      conteoVotos = await prisma.vote.findMany({
        where: { votingEventId: activeEvent.id },
        select: { option: true },
      });
    }

    const asistencia = await prisma.attendance.findMany({
      where: { sessionId: sessionId },
      include: { User: { select: { name: true } } },
    });

    const colaPalabra = await prisma.speakingRequest.findMany({
      where: { 
        sessionId: sessionId, 
        status: { in: ['PENDIENTE', 'HABLANDO'] } // <-- El presidente debe ver a los que hablan
      },
      orderBy: { requestedAt: 'asc' },
      include: { User: { select: { name: true } } },
    });

    return {
      evento: activeEvent,
      resultados: conteoVotos.reduce((acc, curr) => {
        acc[curr.option] = (acc[curr.option] || 0) + 1;
        return acc;
      }, {} as Record<string, number>),
      asistentes: asistencia.map(a => a.User.name),
      solicitudes: colaPalabra.map(p => ({
        id: p.id,
        nombre: p.User.name,
        hora: p.requestedAt,
        status: p.status, // <-- Enviamos el status al frontend
      })),
    };
  }
  
  // El presidente otorga la palabra
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

  // El presidente termina el turno de palabra
  async terminarPalabra(solicitudId: number) {
    const solicitud = await prisma.speakingRequest.update({
      where: { id: solicitudId },
      data: { status: 'FINALIZADO' },
    });
    return { success: true, data: solicitud };
  }
  
 // Cerrar la votación activa y limpiar la cola de palabra
  async cerrarVotacion(votingEventId: number) {
    // 1. Buscamos el evento para saber a qué sesión pertenece
    const evento = await prisma.votingEvent.findUnique({
      where: { id: votingEventId },
    });

    if (!evento) {
      throw new NotFoundException('Evento no encontrado');
    }

    // Cambiamos el estado de ACTIVO a FINALIZADO
    const eventoCerrado = await prisma.votingEvent.update({
      where: { id: votingEventId },
      data: { status: 'FINALIZADO' },
    });

    // Todos los PENDIENTE y HABLANDO pasan a FINALIZADO
    await prisma.speakingRequest.updateMany({
      where: { 
        sessionId: evento.sessionId,
        status: { in: ['PENDIENTE', 'HABLANDO'] }
      },
      data: { status: 'FINALIZADO' },
    });

    return { success: true, data: eventoCerrado };
  }
}