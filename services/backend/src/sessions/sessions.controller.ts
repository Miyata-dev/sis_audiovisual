import { Controller, Get, Post, Param, Body, Delete, UploadedFile, UseInterceptors, NotFoundException, BadRequestException, InternalServerErrorException, HttpException, HttpStatus } from '@nestjs/common';
import { FileInterceptor } from '@nestjs/platform-express';
import { SessionsService } from './sessions.service.js';
import { StorageService } from '../storage/storage.service.js';
import * as multer from 'multer';
import ffmpeg from 'fluent-ffmpeg';
import ffprobeStatic from 'ffprobe-static';
import { Prisma } from '@prisma/client';
import { GoogleAuth } from 'google-auth-library';
import axios from 'axios';
import PDFDocument from 'pdfkit';
import { PDFParse } from 'pdf-parse';
import * as fs from 'fs';
import * as os from 'os';
import * as path from 'path';

ffmpeg.setFfprobePath(ffprobeStatic.path);

@Controller('sessions')
export class SessionsController {
  private readonly googleAuth = new GoogleAuth();

  constructor(
    private readonly sessionsService: SessionsService,
    private readonly storageService: StorageService,
  ) {}

  // helpers 

  // Llama al servicio de IA. En Cloud Run usa token de identidad
  // en local llama sin autenticacion
  private async callAiService<T>(route: string, body: unknown): Promise<T> {
    const baseUrl = process.env.AI_SERVICE_URL || 'http://sis-audiovisual-ai:8000';

    if (!baseUrl.startsWith('https://')) {
      const res = await axios.post<T>(`${baseUrl}${route}`, body, { timeout: 600000 });
      return res.data;
    }

    const client = await this.googleAuth.getIdTokenClient(baseUrl);
    const res = await client.request<T>({
      url: `${baseUrl}${route}`,
      method: 'POST',
      data: body,
      timeout: 600000,
    });
    return res.data;
  }

  private probeDuration(input: string): Promise<number> {
    return new Promise((resolve) => {
      ffmpeg.ffprobe(input, (err, metadata) => {
        if (err || !metadata?.format?.duration) resolve(0);
        else resolve(Number(metadata.format.duration));
      });
    });
  }

  private formatDuration(totalSeconds: number): string {
    if (!totalSeconds || totalSeconds <= 0) return '--:--';
    const h = Math.floor(totalSeconds / 3600);
    const m = Math.floor((totalSeconds % 3600) / 60);
    const s = Math.floor(totalSeconds % 60);
    const f = (n: number) => n.toString().padStart(2, '0');
    return h > 0 ? `${f(h)}:${f(m)}:${f(s)}` : `${f(m)}:${f(s)}`;
  }

  private textToPdfBuffer(title: string, content: string): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const doc = new PDFDocument({ size: 'A4', margin: 56 });
      const chunks: Buffer[] = [];
      doc.on('data', (chunk: Buffer) => chunks.push(chunk));
      doc.on('end', () => resolve(Buffer.concat(chunks)));
      doc.on('error', reject);

      doc.fontSize(16).text(title);
      doc.moveDown();
      doc.fontSize(11).text(content, { lineGap: 3 });
      doc.end();
    });
  }

  // Extrae el texto de una transcripcion: PDF (nuevas) o TXT (sesiones viejas)
  private async extractTranscriptionText(objectName: string, buffer: Buffer): Promise<string> {
    if (!objectName.toLowerCase().endsWith('.pdf')) {
      return buffer.toString('utf-8');
    }

    const parser = new PDFParse({ data: buffer });
    try {
      const result = await parser.getText();
      return result.text;
    } finally {
      await parser.destroy();
    }
  }

  @Get('history')
  getHistory() {
    return this.sessionsService.getHistory();
  }

  // Subida directa al bucket, el frontend pide una URL firmada
  @Post(':id/video-upload-url')
  async getVideoUploadUrl(
    @Param('id') id: string,
    @Body() body: { filename: string; contentType?: string },
  ) {
    if (!body?.filename) throw new BadRequestException('filename es requerido');
    return this.storageService.createSignedUploadUrl(
      'videos',
      body.filename,
      body.contentType || 'video/mp4',
    );
  }

  // Subida directa al bucket, el frontend avisa que termino
  @Post(':id/video-uploaded')
  async videoUploaded(
    @Param('id') id: string,
    @Body() body: { objectName: string; durationSeconds?: number },
  ) {
    if (!body?.objectName?.startsWith('videos/')) {
      throw new BadRequestException('objectName inválido');
    }
    const info = await this.storageService.getFileInfo(body.objectName);
    if (!info) throw new NotFoundException('El video no existe en el bucket');

    let durationSeconds = Number(body.durationSeconds) || 0;
    if (!durationSeconds) {
      try {
        const signed = await this.storageService.getSignedReadUrl(body.objectName, 10);
        durationSeconds = await this.probeDuration(signed);
      } catch {
        durationSeconds = 0;
      }
    }

    const session = await this.sessionsService.updateVideoUrl(
      Number(id),
      `/api/streams/${body.objectName}`,
      this.formatDuration(durationSeconds),
    );

    this.transcribeVideo(id).catch((error) => {
      console.error(`Error en transcripción automática para sesión ${id}:`, error);
    });

    return session;
  }

  // Subida a traves del backend, solo sirve para archivos menores a 32 MB
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
    const durationSeconds = await this.probeDuration(tempFilePath);
    fs.unlinkSync(tempFilePath);

    const sessionActualizada = await this.sessionsService.updateVideoUrl(
      Number(id),
      publicVideoUrl,
      this.formatDuration(durationSeconds),
    );

    this.transcribeVideo(id).catch((error) => {
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

  @Post(':id/upload-thumbnail')
  @UseInterceptors(FileInterceptor('file', { storage: multer.memoryStorage() }))
  async uploadThumbnail(@Param('id') id: string, @UploadedFile() file: Express.Multer.File) {
    if (!file) throw new NotFoundException('No se envió miniatura');

    const publicUrl = await this.storageService.uploadFile(file, 'thumbnails');
    return this.sessionsService.updateThumbnailUrl(Number(id), publicUrl);
  }

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
      // URL firmada del bucket para que la IA descargue el video
      let videoUrlForAi: string;
      try {
        const objectName = session.videoUrl.replace(/^\/api\/streams\//, '');
        videoUrlForAi = await this.storageService.getSignedReadUrl(objectName);
      } catch {
        // Fallback para desarrollo local, sin credenciales para firmar
        videoUrlForAi = `http://sis-audiovisual-backend:3000${session.videoUrl}`;
      }

      const aiData = await this.callAiService<{ text: string }>('/transcribe-url', {
        video_url: videoUrlForAi,
      });
      const transcripcionTexto: string = aiData.text;

      // La transcripción se guarda como PDF
      const pdfBuffer = await this.textToPdfBuffer(
        `Transcripción de la sesión ${id}`,
        transcripcionTexto,
      );
      const pdfFile = {
        fieldname: 'file',
        originalname: `transcripcion-sesion-${id}.pdf`,
        encoding: '7bit',
        mimetype: 'application/pdf',
        buffer: pdfBuffer,
        size: pdfBuffer.length,
      } as Express.Multer.File;

      const publicUrl = await this.storageService.uploadFile(pdfFile, 'transcriptions');
      return await this.sessionsService.updateTranscriptionUrl(Number(id), publicUrl);
    } catch (error) {
      console.error('Error al transcribir el video:', error);
      throw new InternalServerErrorException('Error al intentar transcribir el video');
    }
  }

  @Post(':id/chat')
  async chatWithSession(@Param('id') id: string, @Body('pregunta') pregunta: string) {
    try {
      const session = await this.sessionsService.getSessionById(Number(id));

      if (!session || !session.transcriptionUrl) {
        throw new HttpException(
          'No hay transcripción disponible para esta sesión',
          HttpStatus.BAD_REQUEST,
        );
      }

      const objectName = session.transcriptionUrl.replace(/^\/api\/streams\//, '');

      let fileUrl: string;
      try {
        fileUrl = await this.storageService.getSignedReadUrl(objectName);
      } catch {
        // Fallback para desarrollo local
        fileUrl = `http://127.0.0.1:3000${session.transcriptionUrl}`;
      }

      const fileResponse = await fetch(fileUrl);
      if (!fileResponse.ok) {
        throw new Error(`Fallo al descargar transcripción. Status: ${fileResponse.status}`);
      }

      const buffer = Buffer.from(await fileResponse.arrayBuffer());
      const transcripcionTexto = await this.extractTranscriptionText(objectName, buffer);

      const dataIA = await this.callAiService<{ respuesta: string }>('/chat', {
        pregunta,
        contexto_transcripcion: transcripcionTexto,
      });

      return { respuesta: dataIA.respuesta };
    } catch (error) {
      console.error('Error en chat:', error);
      if (error instanceof HttpException) throw error;
      throw new HttpException('Error al consultar a la IA', HttpStatus.INTERNAL_SERVER_ERROR);
    }
  }
}