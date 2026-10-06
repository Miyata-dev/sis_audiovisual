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
}