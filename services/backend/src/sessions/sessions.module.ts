import { Module } from '@nestjs/common';
import { SessionsService } from './sessions.service.js';
import { SessionsController } from './sessions.controller.js';
import { PrismaService } from '../prisma/PrismaService.js';
import { StorageService } from '../storage/storage.service.js';

@Module({
  controllers: [SessionsController],
  providers: [SessionsService, PrismaService, StorageService], 
})
export class SessionsModule {}