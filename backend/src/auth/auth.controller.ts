import { Controller, Post } from '@nestjs/common';

@Controller('login')
export class AuthController {
  @Post()
  login() {
    return { message: 'This is the /api/login endpoint' };
  }
}