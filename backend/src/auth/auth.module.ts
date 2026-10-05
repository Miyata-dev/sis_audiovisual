import { Module } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { AuthController } from './auth.controller.js';
import { JwtModule } from '@nestjs/jwt';
import { PrismaService } from '../prisma/PrismaService.js';

@Module({
  imports: [
    JwtModule.register({
      secret: 'SECRETO_DE_PRUEBA',
      signOptions: { expiresIn: '1d' },
    }),
  ],
  controllers: [AuthController],
  providers: [
    AuthService, 
    PrismaService,
  ],
})
export class AuthModule {}