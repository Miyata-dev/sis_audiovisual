import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

@Injectable()
export class SessionsService {
  
  async getHistory() {
    return await prisma.session.findMany({
      where: {
        status: 'FINALIZADA', 
      },
      orderBy: {
        date: 'desc',
      },
    });
  }

  async updateVideoUrl(id: number, videoUrl: string, duration: string) {
    return await prisma.session.update({
      where: { id },
      data: { 
        videoUrl,
        duration
      },
    });
  }

  async updateActaUrl(id: number, actaUrl: string) {
    return await prisma.session.update({
      where: { id },
      data: { actaUrl },
    });
  }

  async updateTranscriptionUrl(id: number, transcriptionUrl: string) {
    return await prisma.session.update({
      where: { id },
      data: { transcriptionUrl },
    });
  }
  
  async updateThumbnailUrl(id: number, thumbnailUrl: string) {
    return await prisma.session.update({
      where: { id },
      data: { thumbnailUrl },
    });
  }

  async deleteSession(id: number) {
    return await prisma.session.delete({
      where: { id },
    });
  }
}