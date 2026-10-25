import { Injectable, InternalServerErrorException } from '@nestjs/common';
import { Storage } from '@google-cloud/storage';

@Injectable()
export class StorageService {
  private storage: Storage;
  private bucketName: string;

  constructor() {
    const bucketName = process.env.GCS_BUCKET_NAME;
    if (!bucketName) {
      throw new Error('GCS_BUCKET_NAME environment variable es requerido');
    }
    this.bucketName = bucketName;
    this.storage = new Storage({
      projectId: process.env.GCS_PROJECT_ID,
    });
  }

  async uploadFile(file: Express.Multer.File, folder: string): Promise<string> {
    try {
      const bucket = this.storage.bucket(this.bucketName);
      const cleanFileName = file.originalname.replace(/[^a-zA-Z0-9.]/g, '_');
      const fileName = `${folder}/${Date.now()}-${cleanFileName}`;
      const fileRef = bucket.file(fileName);

      await fileRef.save(file.buffer, {
        contentType: file.mimetype,
        resumable: false,
      });

      return `/api/streams/${fileName}`;
    } catch (error) {
      console.error('Error en StorageService:', error);
      throw new InternalServerErrorException('Error al subir el archivo a Google Cloud Storage');
    }
  }

  // Tamaño y tipo del objeto. Devuelve null si no existe.
  async getFileInfo(objectName: string) {
    try {
      const [meta] = await this.storage
        .bucket(this.bucketName)
        .file(objectName)
        .getMetadata();
      return {
        size: Number(meta.size),
        contentType: meta.contentType as string | undefined,
      };
    } catch (error) {
      if ((error as { code?: number }).code === 404) return null;
      throw error;
    }
  }

  // Lee el archivo completo o solo un rango de bytes
  createReadStream(objectName: string, start?: number, end?: number) {
    const file = this.storage.bucket(this.bucketName).file(objectName);
    return start === undefined
      ? file.createReadStream()
      : file.createReadStream({ start, end });
  }

  // URL temporal de solo lectura (para que el servicio de IA descargue el video)
  async getSignedReadUrl(objectName: string, minutes = 120): Promise<string> {
    const [url] = await this.storage
      .bucket(this.bucketName)
      .file(objectName)
      .getSignedUrl({
        version: 'v4',
        action: 'read',
        expires: Date.now() + minutes * 60 * 1000,
      });
    return url;
  }
}