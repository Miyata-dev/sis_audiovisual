import { Controller, Post, Body, HttpCode, HttpStatus } from '@nestjs/common';
import { AuthService } from './auth.service.js';
import { LoginDto } from './dto/login.dto.js';

@Controller('auth') // Ruta base: /api/auth
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('login') 
  @HttpCode(HttpStatus.OK) 
  async login(@Body() loginDto: LoginDto) {
    console.log('BODY RECIBIDO:', loginDto); // Log del cuerpo recibido
    return this.authService.login(loginDto);
  }
}