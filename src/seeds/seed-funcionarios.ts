import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Funcionario } from '../funcionarios/funcionario.entity';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [Funcionario],
  synchronize: false, // não mexe no schema (deixe true só se você usa isso no projeto)
});

const NOMES = [
  'João', 'Maria', 'José', 'Ana', 'Paulo', 'Carla', 'Pedro', 'Mariana', 'Lucas', 'Fernanda',
  'Rafael', 'Juliana', 'Bruno', 'Camila', 'Gustavo', 'Aline', 'Diego', 'Larissa', 'Felipe', 'Beatriz',
];
const SOBRENOMES = [
  'Silva', 'Santos', 'Oliveira', 'Souza', 'Lima', 'Pereira', 'Costa', 'Ferreira', 'Rodrigues', 'Almeida',
  'Nascimento', 'Araújo', 'Ribeiro', 'Gomes', 'Martins', 'Barbosa',
];
const SETORES = [
  'Produção', 'Manutenção', 'Almoxarifado', 'Segurança do Trabalho', 'Qualidade',
  'Logística', 'Administrativo', 'RH', 'Compras', 'TI',
];

function randInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min;
}

function pick<T>(arr: T[]) {
  return arr[randInt(0, arr.length - 1)];
}

function gerarNomeCompleto() {
  return `${pick(NOMES)} ${pick(SOBRENOMES)} ${pick(SOBRENOMES)}`;
}

function pad(n: number, size: number) {
  return String(n).padStart(size, '0');
}

function formatCpf(digits11: string) {
  return `${digits11.slice(0,3)}.${digits11.slice(3,6)}.${digits11.slice(6,9)}-${digits11.slice(9,11)}`;
}

function gerarCpfUnico(i: number) {
  // 11 dígitos a partir do índice + aleatório (só pra unicidade)
  // Ex: i=1 -> 00000000001
  const base = pad(i, 11);
  return formatCpf(base);
}

function gerarMatriculaUnica(i: number) {
  // matrícula tipo MAT-000123
  return `MAT-${pad(i, 6)}`;
}

async function main() {
  const qtd = Number(process.argv[2] || 2000);

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Funcionario);

  // Descobre um "offset" pra não colidir com o que já existe
  const countAtual = await repo.count();
  const start = countAtual + 1;

  const funcionarios: Partial<Funcionario>[] = [];
  for (let k = 0; k < qtd; k++) {
    const i = start + k;

    funcionarios.push({
      nome: gerarNomeCompleto(),
      cpf: gerarCpfUnico(i),           // único
      matricula: gerarMatriculaUnica(i), // único
      setor: pick(SETORES),
      status: Math.random() < 0.95 ? 'ativo' : 'desligado',
    });
  }

  // Inserção em lote (bem rápido)
  await repo.insert(funcionarios);

  console.log(`OK: inseridos ${qtd} funcionários (a partir do id lógico ${start}).`);
  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});