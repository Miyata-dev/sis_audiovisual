import { Module } from '@nestjs/common';
import { StreamsController } from './streams.controller.js';
import { StorageService } from '../storage/storage.service.js';

@Module({
  controllers: [StreamsController],
  providers: [StorageService],
})
export class StreamsModule {}