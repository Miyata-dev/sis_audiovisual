import { Injectable } from '@nestjs/common';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();


@Injectable()
export class SessionsService {
  async getHistory() {
    return await prisma.session.findMany({
      orderBy: {
        date: 'desc',
      },
    });
  }

  async updateVideoUrl(id: number, videoUrl: string, duration: string) {
  return await prisma.session.update({
    where: { id },
    data: { videoUrl,
      duration
     },
  });
}
} 