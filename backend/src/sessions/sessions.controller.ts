import { Controller, Get, Post, Param, Delete, UploadedFile, UseInterceptors, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionsService } from './sessions.service.js';
import { StorageService } from '../storage/storage.service.js'; 
import * as multer from 'multer'; 
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import { Prisma } from '@prisma/client';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

ffmpeg.setFfprobePath(ffprobeStatic.path);

@Controller('sessions')
export class SessionsController {
  constructor(
    private readonly sessionsService: SessionsService,
    private readonly storageService: StorageService 
  ) {}

  @Get('history')
  getHistory() {
    return this.sessionsService.getHistory();
  }

  //  UPLOAD VIDEO 
  @Post(':id/upload-video')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(), // Guardar en RAM
    limits: { fileSize: 500 * 1024 * 1024 }, // Limite de 500MB 
  }))
  async uploadVideo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No se envió ningún archivo de video');

    // Subir a GCS usando nuestro StorageService
    const publicVideoUrl = await this.storageService.uploadFile(file, 'videos');

    // Extraer duración usando un archivo temporal respetando la extension original
    const ext = path.extname(file.originalname) || '.mp4';
    const tempFilePath = path.join(os.tmpdir(), `temp-video-${Date.now()}${ext}`);
    fs.writeFileSync(tempFilePath, file.buffer); 

    const durationSeconds = await new Promise<number>((resolve) => {
      ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
        if (err || !metadata || !metadata.format || !metadata.format.duration) {
          console.error("Error al leer el video:", err);
          resolve(0);
        } else {
          resolve(Number(metadata.format.duration));
        }
      });
    });

    // Borrar el archivo temporal para no llenar el disco del servidor
    fs.unlinkSync(tempFilePath); 

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

    // Actualizar Prisma con la URL de la nube y la duracion
    return this.sessionsService.updateVideoUrl(Number(id), publicVideoUrl, durationStr);
  }

  //  UPLOAD ACTA 
  @Post(':id/upload-acta')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(), // Guardar en RAM
  }))
  async uploadActa(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No se envió ninguna acta');
    
    const publicUrl = await this.storageService.uploadFile(file, 'actas');
    return this.sessionsService.updateActaUrl(Number(id), publicUrl);
  }

  //  UPLOAD TRANSCRIPTION 
  @Post(':id/upload-transcription')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(), // Guardar en RAM
  }))
  async uploadTranscription(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No se envió transcripción');

    const publicUrl = await this.storageService.uploadFile(file, 'transcriptions');
    return this.sessionsService.updateTranscriptionUrl(Number(id), publicUrl);
  }

  //  UPLOAD THUMBNAIL 
  @Post(':id/upload-thumbnail')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(), 
  }))
  async uploadThumbnail(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No se envió miniatura');

    const publicUrl = await this.storageService.uploadFile(file, 'thumbnails');
    return this.sessionsService.updateThumbnailUrl(Number(id), publicUrl);
  }

  // DELETE SESSION 
  @Delete(':id')
  async deleteSession(@Param('id') id: string) {
    try {
      return await this.sessionsService.deleteSession(Number(id));
    } catch (error) {
      if (error instanceof Prisma.PrismaClientKnownRequestError) {
        if (error.code === 'P2025') {
          throw new NotFoundException(`Sesión con ID ${id} no encontrada`);
        }
      }
      throw new InternalServerErrorException('Error interno al intentar eliminar la sesión');
    }
  }
}