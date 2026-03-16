// src/auth/auth.service.ts
import { Injectable, UnauthorizedException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import * as bcrypt from 'bcrypt';
import { JwtService } from '@nestjs/jwt';

@Injectable()
export class AuthService {
  constructor(
    @InjectRepository(User)
    private usersRepository: Repository<User>,
    private jwtService: JwtService,
  ) {}

  async validateUser(matricula: string, pass: string): Promise<any> {
    // Busca o usuário pela matrícula
    const user = await this.usersRepository.findOne({ 
      where: { matricula },
      relations: ['funcionario'] 
    });

    if (user && (await bcrypt.compare(pass, user.password))) {
      const { password, ...result } = user;
      return result;
    }
    return null;
  }

  async login(user: any) {
    const payload = { 
      username: user.matricula, 
      sub: user.id, 
      isAdmin: user.isAdmin,
      nome: user.funcionario?.nome || 'Usuário' 
    };
    
    return {
      access_token: this.jwtService.sign(payload),
      user: {
        matricula: user.matricula,
        nome: user.funcionario?.nome,
        isAdmin: user.isAdmin
      }
    };
  }

  async register(matricula: string, pass: string, isAdmin = false) {
    const hashedPassword = await bcrypt.hash(pass, 10);
    const user = this.usersRepository.create({
      matricula,
      password: hashedPassword,
      isAdmin
    });
    return this.usersRepository.save(user);
  }
}