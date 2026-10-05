import { Module } from '@nestjs/common';
import { AppController } from './app.controller.js';
import { AppService } from './app.service.js';
import { AuthModule } from './auth/auth.module.js';
import { ServeStaticModule } from '@nestjs/serve-static';
import { join } from 'path';
import { SessionsModule } from './sessions/sessions.module.js';


@Module({
  imports: [AuthModule, 
    ServeStaticModule.forRoot({
    rootPath: join(process.cwd(), 'uploads'),
    serveRoot: '/uploads',
  }), 
  SessionsModule
  ],
  controllers: [AppController],
  providers: [AppService],
})
export class AppModule {}
