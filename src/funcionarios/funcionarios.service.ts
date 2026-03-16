// src/funcionarios/funcionarios.service.ts
import { Injectable, ForbiddenException, NotFoundException } from '@nestjs/common';
import { InjectRepository } from '@nestjs/typeorm';
import { Repository, DataSource } from 'typeorm';
import { Funcionario } from './funcionario.entity';
import { CreateFuncionarioDto } from './dto/create-funcionario.dto';
import { UpdateFuncionarioDto } from './dto/update-funcionario.dto';
import { AuditService } from '../audit/audit.service';

@Injectable()
export class FuncionariosService {
  constructor(
    @InjectRepository(Funcionario)
    private funcionariosRepository: Repository<Funcionario>,
    private readonly auditService: AuditService,
    private dataSource: DataSource, // <--- Injete o DataSource
  ) { }

  async create(createFuncionarioDto: CreateFuncionarioDto, usuarioLogado: string): Promise<Funcionario> {
    // Iniciamos uma transação única para as duas ações
    return await this.dataSource.transaction(async (manager) => {

      // 1. Tenta criar o funcionário usando o 'manager' da transação
      const novoFuncionario = manager.create(Funcionario, createFuncionarioDto);
      const salvo = await manager.save(novoFuncionario);
      // 2. Tenta criar o log usando o MESMO 'manager'
      // Se esta linha der erro, o 'salvo' acima é cancelado (Rollback)
      await this.auditService.createLog(
        'CRIAÇÃO_FUNCIONARIO',
        salvo,
        usuarioLogado,
        manager // <--- Passamos o manager aqui
      );

      return salvo;
    });
  }

  async findAll(): Promise<Funcionario[]> {
    return this.funcionariosRepository.find();
  }

  async findOne(id: number): Promise<Funcionario> {
    const funcionario = await this.funcionariosRepository.findOne({ where: { id } });
    if (!funcionario) {
      throw new NotFoundException(`Funcionário com ID ${id} não encontrado`);
    }
    return funcionario;
  }

  async findByCpf(cpf: string): Promise<Funcionario> {
    const funcionario = await this.funcionariosRepository.findOne({ where: { cpf } });
    if (!funcionario) {
      throw new NotFoundException(`Funcionário com CPF ${cpf} não encontrado`);
    }
    return funcionario;
  }

  async findByMatricula(matricula: string): Promise<Funcionario> {
    const funcionario = await this.funcionariosRepository.findOne({ where: { matricula } });
    if (!funcionario) {
      throw new NotFoundException(`Funcionário com matrícula ${matricula} não encontrado`);
    }
    return funcionario;
  }

  async update(
    id: number,
    updateFuncionarioDto: UpdateFuncionarioDto,
    isAdmin: boolean,
    usuarioLogado: string,
  ): Promise<Funcionario> {
    if (!isAdmin) {
      throw new ForbiddenException('Somente administradores podem editar funcionários');
    }

    // Verificar se o funcionário existe antes de entrar na transação
    const funcionarioExistente = await this.findOne(id);

    // Não permitir mudança de status para "excluido"
    if (updateFuncionarioDto.status === 'excluido') {
      throw new ForbiddenException('Não é possível excluir funcionários');
    }

    return await this.dataSource.transaction(async (manager) => {
      // Atualizar o funcionário dentro da transação
      await manager.update(Funcionario, id, updateFuncionarioDto);
      const funcionarioAtualizado = await manager.findOne(Funcionario, { where: { id } });
      if (!funcionarioAtualizado) {
        throw new NotFoundException(`Erro ao recuperar funcionário atualizado`);
      }
      // Log atômico — se falhar, o update acima é revertido
      await this.auditService.createLog(
        'funcionario.updated',
        {
          id,
          before: funcionarioExistente,
          after: funcionarioAtualizado,
          changes: updateFuncionarioDto,
        },
        usuarioLogado,
        manager,
      );

      return funcionarioAtualizado;
    });
  }

  async remove(id: number, isAdmin: boolean, usuarioLogado: string): Promise<{ message: string }> {
    if (!isAdmin) {
      throw new ForbiddenException('Somente administradores podem desligar funcionários');
    }

    const funcionario = await this.findOne(id);

    await this.dataSource.transaction(async (manager) => {
      // Soft delete: muda status para "desligado" dentro da transação
      await manager.update(Funcionario, id, { status: 'desligado' });

      // Log atômico — se falhar, o update acima é revertido
      await this.auditService.createLog(
        'funcionario.desativado',
        { id, nome: funcionario.nome, matricula: funcionario.matricula },
        usuarioLogado,
        manager,
      );
    });

    return { message: 'Funcionário desligado com sucesso' };
  }

  async reactivate(id: number, isAdmin: boolean, usuarioLogado: string): Promise<Funcionario> {
    if (!isAdmin) {
      throw new ForbiddenException('Somente administradores podem reativar funcionários');
    }

    // Verifica existência antes da transação
    await this.findOne(id);

    return await this.dataSource.transaction(async (manager) => {
      // Reativa o funcionário dentro da transação
      await manager.update(Funcionario, id, { status: 'ativo' });
      const funcionarioReativado = await manager.findOne(Funcionario, { where: { id } });
      if (!funcionarioReativado) {
        throw new NotFoundException(`Erro ao recuperar funcionário atualizado`);
      }
      // Log atômico — se falhar, o update acima é revertido

      await this.auditService.createLog(
        'funcionario.reativado',
        { id, nome: funcionarioReativado.nome, matricula: funcionarioReativado.matricula },
        usuarioLogado,
        manager,
      );

      return funcionarioReativado;
    });
  }
}