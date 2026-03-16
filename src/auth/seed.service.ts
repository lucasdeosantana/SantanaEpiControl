// src/auth/seed.service.ts
import { Injectable, OnApplicationBootstrap, Logger } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository } from 'typeorm';
import { User } from './user.entity';
import { Funcionario } from '../funcionarios/funcionario.entity';
import * as bcrypt from 'bcrypt';

@Injectable()
export class SeedService implements OnApplicationBootstrap {
  private readonly logger = new Logger(SeedService.name);

  constructor(
    @InjectRepository(User)
    private readonly userRepository: Repository<User>,
    @InjectRepository(Funcionario)
    private readonly funcionarioRepository: Repository<Funcionario>,
  ) {}

  // Este método roda automaticamente quando o NestJS termina de subir
  async onApplicationBootstrap() {
    await this.seedAdmin();
  }

  async seedAdmin() {
    const adminExists = await this.userRepository.findOne({ 
      where: { isAdmin: true } 
    });

    if (!adminExists) {
      this.logger.log('Nenhum administrador encontrado. Criando usuário padrão...');

      // Primeiro, criar o funcionário admin
      const funcionarioAdmin = this.funcionarioRepository.create({
        nome: 'Administrador do Sistema',
        cpf: '00000000000',
        matricula: 'admin',
        setor: 'TI',
        status: 'ativo',
        created_at: new Date(),
      });

      const savedFuncionario = await this.funcionarioRepository.save(funcionarioAdmin);

      // Depois, criar o usuário associado ao funcionário
      const hashedPassword = await bcrypt.hash('admin123', 10);
      
      const userAdmin = this.userRepository.create({
        matricula: 'admin',
        password: hashedPassword,
        isAdmin: true,
        funcionario: savedFuncionario, // Relaciona com o funcionário criado
      });

      await this.userRepository.save(userAdmin);
      
      this.logger.log('#################################################');
      this.logger.log('USUÁRIO ADMIN PADRÃO CRIADO:');
      this.logger.log('Matrícula: admin');
      this.logger.log('Senha: admin123');
      this.logger.log('Nome: Administrador do Sistema');
      this.logger.log('CPF: 00000000000');
      this.logger.log('#################################################');
    } else {
      this.logger.log('Administrador já existe no sistema.');
    }
  }
}