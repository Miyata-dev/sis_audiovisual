import { Injectable, NotFoundException } from '@nestjs/common';
import { existsSync, statSync, createReadStream } from 'fs';
import { join } from 'path';

@Injectable()
export class StreamsService {
  getVideoInfo(filename: string) {
    const filePath = join(process.cwd(), 'streams', filename);

    if (!existsSync(filePath)) {
      throw new NotFoundException('Stream no encontrado');
    }

    const stat = statSync(filePath);
    return { filePath, fileSize: stat.size };
  }

  // Crea un stream para enviarlo al cliente
  createStream(filePath: string, start: number, end: number) {
    return createReadStream(filePath, { start, end });
  }
}