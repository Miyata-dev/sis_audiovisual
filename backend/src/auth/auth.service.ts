import { Injectable, UnauthorizedException } from '@nestjs/common';
import { LoginDto } from './dto/login.dto.js';

@Injectable()
export class AuthService {
  async login(loginDto: LoginDto) {
    const { username, password } = loginDto;

    // todo, remplazar esto con logica real
    // const user = await this.prisma.user.findUnique({ where: { username } });
    
    // verificación barata
    if (!username || !password) {
      throw new UnauthorizedException('Usuario y contraseña son requeridos');
    }

    return {
      message: 'Login exitoso',
      token: 'fake-jwt-token-for-testing',
      user: { username }
    };
  }
}