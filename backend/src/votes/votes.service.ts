import { Injectable, BadRequestException } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class VotesService {
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