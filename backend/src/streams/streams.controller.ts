import {
  BadRequestException,
  Controller,
  Get,
  NotFoundException,
  Param,
  Req,
  Res,
} from '@nestjs/common';
import type { Request, Response } from 'express';
import { basename, extname } from 'path';
import { StorageService } from '../storage/storage.service.js';

// Carpetas permitidas: deben coincidir con las del bucket
const FOLDERS = new Set(['videos', 'thumbnails', 'actas', 'transcripciones']);

const MIME: Record<string, string> = {
  '.mp4': 'video/mp4',
  '.mkv': 'video/x-matroska',
  '.webm': 'video/webm',
  '.pdf': 'application/pdf',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.txt': 'text/plain; charset=utf-8',
};

@Controller('streams')
export class StreamsController {
  constructor(private readonly storage: StorageService) {}

  @Get(':folder/:filename')
  async stream(
    @Param('folder') folder: string,
    @Param('filename') filename: string,
    @Req() req: Request,
    @Res() res: Response,
  ) {
    // Evita rutas raras como ../
    if (!/^[\w-]+$/.test(folder) || basename(filename) !== filename) {
     throw new BadRequestException('Ruta inválida');
  }

    const objectName = `${folder}/${filename}`;
    const info = await this.storage.getFileInfo(objectName);
    if (!info) throw new NotFoundException('Archivo no encontrado');

    const size = info.size;
    const type =
      MIME[extname(filename).toLowerCase()] ?? info.contentType ?? 'application/octet-stream';

    res.setHeader('Content-Type', type);
    res.setHeader('Accept-Ranges', 'bytes');

    let stream;
    const range = req.headers.range;

    if (range) {
      const [s, e] = range.replace(/bytes=/, '').split('-');
      const start = parseInt(s, 10);
      const end = Math.min(e ? parseInt(e, 10) : size - 1, size - 1);

      if (Number.isNaN(start) || start > end) {
        res.setHeader('Content-Range', `bytes */${size}`);
        return res.status(416).end();
      }

      res.status(206);
      res.setHeader('Content-Range', `bytes ${start}-${end}/${size}`);
      res.setHeader('Content-Length', end - start + 1);
      stream = this.storage.createReadStream(objectName, start, end);
    } else {
      res.setHeader('Content-Length', size);
      stream = this.storage.createReadStream(objectName);
    }

    stream.on('error', () => {
      if (!res.headersSent) {
        res.removeHeader('Content-Length');
        res.status(500).end();
      } else {
        res.destroy();
      }
    });

    stream.pipe(res);
  }
}