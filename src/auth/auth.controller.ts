// src/auth/auth.controller.ts
import { Controller, Post, Body, UseGuards, Request, Logger } from '@nestjs/common';
import { AuthService } from './auth.service';
import { LocalAuthGuard } from './local-auth.guard';

@Controller('auth')
export class AuthController {
  constructor(private authService: AuthService) {}

  private readonly logger = new Logger(AuthController.name);
  @UseGuards(LocalAuthGuard)
  @Post('login')
  async login(@Request() req) { 
    return this.authService.login(req.user);
  }

  @Post('register')
  async register(@Body() body: { matricula: string; password: string; isAdmin?: boolean }) {
    return this.authService.register(body.matricula, body.password, body.isAdmin);
  }
}