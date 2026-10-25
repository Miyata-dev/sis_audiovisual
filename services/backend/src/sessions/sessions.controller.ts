import { Controller, Get, Post, Param, Delete, UploadedFile, UseInterceptors, NotFoundException, InternalServerErrorException } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionsService } from './sessions.service.js';
import { StorageService } from '../storage/storage.service.js'; 
import * as multer from 'multer'; 
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import { Prisma } from '@prisma/client';
import axios from 'axios';
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
    storage: multer.memoryStorage(), 
    limits: { fileSize: 500 * 1024 * 1024 }, 
  }))
  async uploadVideo(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No se envió ningún archivo de video');

    const publicVideoUrl = await this.storageService.uploadFile(file, 'videos');

    const ext = path.extname(file.originalname) || '.mp4';
    const tempFilePath = path.join(os.tmpdir(), `temp-video-${Date.now()}${ext}`);
    fs.writeFileSync(tempFilePath, file.buffer); 

    const durationSeconds = await new Promise<number>((resolve) => {
      ffmpeg.ffprobe(tempFilePath, (err, metadata) => {
        if (err || !metadata || !metadata.format || !metadata.format.duration) {
          resolve(0);
        } else {
          resolve(Number(metadata.format.duration));
        }
      });
    });
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

    const sessionActualizada = await this.sessionsService.updateVideoUrl(Number(id), publicVideoUrl, durationStr);

    this.transcribeVideo(id).catch(error => {
      console.error(`Error en transcripción automática para sesión ${id}:`, error);
    });

    return sessionActualizada;
  }

  @Post(':id/upload-acta')
  @UseInterceptors(FileInterceptor('file', {
    storage: multer.memoryStorage(), 
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

  @Post(':id/transcribe-video')
  async transcribeVideo(@Param('id') id: string) {
    const session = await this.sessionsService.getSessionById(Number(id));
    if (!session || !session.videoUrl) {
      throw new NotFoundException('La sesión no tiene un video asociado');
    }

    try {
      const aiServiceUrl = process.env.AI_SERVICE_URL || 'http://sis-audiovisual-ai:8000/transcribe-url';
      
      let urlAbsoluta = session.videoUrl;
      if (urlAbsoluta.startsWith('/')) {
        urlAbsoluta = `http://sis-audiovisual-backend:3000${urlAbsoluta}`; 
      }

      console.log('Enviando a IA URL absoluta:', urlAbsoluta);

      const aiResponse = await axios.post(aiServiceUrl, {
        video_url: urlAbsoluta 
      }, { timeout: 600000 }); 

      const transcripcionTexto: string = aiResponse.data.text;

      const buffer = Buffer.from(transcripcionTexto, 'utf-8');
      const fakeMulterFile = {
        fieldname: 'file',
        originalname: `transcripcion-sesion-${id}.txt`,
        encoding: '7bit',
        mimetype: 'text/plain',
        buffer: buffer,
        size: buffer.length,
      } as Express.Multer.File;

      const publicUrl = await this.storageService.uploadFile(fakeMulterFile, 'transcriptions');
      return await this.sessionsService.updateTranscriptionUrl(Number(id), publicUrl);

    } catch (error) {
      throw new InternalServerErrorException('Error al intentar transcribir el video');
    }
  }
}