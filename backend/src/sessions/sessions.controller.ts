import { Controller, Get, Post, Param, UploadedFile, UseInterceptors } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionsService } from './sessions.service.js';
import { diskStorage } from 'multer';
import { extname } from 'path';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';

ffmpeg.setFfprobePath(ffprobeStatic.path); 

@Controller('sessions')
export class SessionsController {
  constructor(private readonly sessionsService: SessionsService) {}

  @Get('history')
  getHistory() {
    return this.sessionsService.getHistory();
  }

  @Post(':id/upload-video')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `video-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  async uploadVideo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const videoUrl = `/uploads/${file.filename}`;
    const filePath = file.path; // Ruta donde se guardo el video 

    // se extrae la duracion en segundos usando ffprobe
    const durationSeconds = await new Promise<number>((resolve) => {
      ffmpeg.ffprobe(filePath, (err, metadata) => {
        if (err || !metadata || !metadata.format || !metadata.format.duration) {
          console.error("Error al leer el video:", err);
          resolve(0); // Si falla, devuolve 0
        } else {
          resolve(Number(metadata.format.duration));
        }
      });
    });

    let durationStr = "--:--";
    if (durationSeconds > 0) {
      const hours = Math.floor(durationSeconds / 3600);
      const minutes = Math.floor((durationSeconds % 3600) / 60);
      const seconds = Math.floor(durationSeconds % 60);
      
      const format = (num: number) => num.toString().padStart(2, '0');
      
      durationStr = hours > 0 
        ? `${format(hours)}:${format(minutes)}:${format(seconds)}` 
        : `${format(minutes)}:${format(seconds)}`;
    }

    // se actualiza la URL y la Duracion calculada en Prisma
    return this.sessionsService.updateVideoUrl(Number(id), videoUrl, durationStr);
  }
  @Post(':id/upload-acta')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
      const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
      const ext = extname(file.originalname); // Extrae si es .txt, .pdf o .docx
      callback(null, `acta-${uniqueSuffix}${ext}`);
      },
    }),
  }))
  async uploadActa(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const actaUrl = `/uploads/${file.filename}`;
    
    return this.sessionsService.updateActaUrl(Number(id), actaUrl);
  }
@Post(':id/upload-transcription')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname);
        callback(null, `transcription-${uniqueSuffix}${ext}`); 
      },
    }),
  }))
  async uploadTranscription(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const transcriptionUrl = `/uploads/${file.filename}`;
    
    return this.sessionsService.updateTranscriptionUrl(Number(id), transcriptionUrl);
  }
  @Post(':id/upload-thumbnail')
  @UseInterceptors(FileInterceptor('file', {
    storage: diskStorage({
      destination: './uploads',
      filename: (req, file, callback) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1e9);
        const ext = extname(file.originalname); //  extensiones como .jpg o .png
        callback(null, `thumbnail-${uniqueSuffix}${ext}`); 
      },
    }),
  }))
  async uploadThumbnail(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    const thumbnailUrl = `/uploads/${file.filename}`;
    return this.sessionsService.updateThumbnailUrl(Number(id), thumbnailUrl);
  }
}