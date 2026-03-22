import 'reflect-metadata';
import { DataSource } from 'typeorm';
import { Epi } from '../epis/epi.entity';

const AppDataSource = new DataSource({
  type: 'sqlite',
  database: 'database.sqlite',
  entities: [Epi],
  synchronize: false,
});

// ─── Dados base para geração ────────────────────────────────────────────────

const TIPOS: Record<string, string[]> = {
  'Proteção da Cabeça': [
    'Capacete de Segurança Aba Frontal',
    'Capacete com Jugular',
    'Capacete Dielétrico',
    'Capuz de Proteção Térmica',
    'Touca Árabe',
  ],
  'Proteção dos Olhos e Face': [
    'Óculos de Proteção Ampla Visão',
    'Óculos Sobreposto para Lentes de Grau',
    'Protetor Facial Incolor',
    'Protetor Facial Soldagem',
    'Máscara de Solda Automática',
  ],
  'Proteção Auditiva': [
    'Protetor Auricular Tipo Plug Espuma',
    'Protetor Auricular Tipo Concha',
    'Protetor Auricular com Atenuação 26dB',
    'Protetor Auricular Reutilizável',
  ],
  'Proteção Respiratória': [
    'Respirador PFF1',
    'Respirador PFF2',
    'Respirador PFF3',
    'Máscara Semifacial com Filtro',
    'Máscara Facial Inteira',
    'Filtro para Vapores Orgânicos',
    'Filtro para Poeiras e Névoas',
  ],
  'Proteção das Mãos': [
    'Luva de Raspa de Couro',
    'Luva Nitrílica Descartável',
    'Luva de Látex',
    'Luva de Malha de Aço',
    'Luva Isolante Elétrica Classe 0',
    'Luva Isolante Elétrica Classe 2',
    'Luva de Borracha Neoprene',
    'Luva de PVC',
    'Luva Anticorte Nível 5',
  ],
  'Proteção dos Pés': [
    'Botina de Segurança Bico de Aço',
    'Botina Dielétrica',
    'Bota de PVC Cano Longo',
    'Sapato de Segurança Feminino',
    'Botina com Solado Antiderrapante',
    'Bota Impermeável',
  ],
  'Proteção do Tronco': [
    'Avental de Raspa de Couro',
    'Avental de PVC',
    'Jaleco de Brim',
    'Camisa de Manga Longa UV50+',
    'Colete Refletivo',
    'Avental Plumbífero',
  ],
  'Proteção Contra Quedas': [
    'Cinto de Segurança Tipo Paraquedista',
    'Talabarte de Segurança Duplo',
    'Trava-Quedas Retrátil',
    'Mosquetão de Segurança',
    'Linha de Vida Horizontal',
  ],
  'Proteção do Corpo Inteiro': [
    'Macacão Tyvek Descartável',
    'Macacão Antichama',
    'Roupa de Aproximação ao Calor',
    'Conjunto Impermeável Calça e Jaqueta',
  ],
  'Proteção das Pernas': [
    'Perneira de Raspa de Couro',
    'Perneira de PVC',
    'Joelheira de Proteção',
    'Calça de Brim Reforçada',
  ],
};

const FABRICANTES = [
  '3M', 'Honeywell', 'Kalipso', 'Danny', 'Vonder',
  'Carbografite', 'Marluvas', 'Bracol', 'Proteplus',
  'MSA', 'Delta Plus', 'Uvex', 'Petzl', 'Ansell',
];

const OBSERVACOES = [
  'Higienizar antes de devolver ao almoxarifado.',
  'Substituir a cada 6 meses ou quando danificado.',
  'Verificar integridade antes de cada uso.',
  'Armazenar em local seco e arejado.',
  'Não utilizar em ambientes com solventes.',
  'Inspecionar visualmente antes do uso.',
  'Descartável — uso único.',
  'Certificado pelo MTE conforme NR-6.',
  null,
  null, // aumenta chance de observacao nula
  null,
];

// ─── Helpers ────────────────────────────────────────────────────────────────

function pick<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pad(n: number, size: number) {
  return String(n).padStart(size, '0');
}

function gerarCa(i: number): string | undefined {
  // ~80% dos EPIs têm CA
  if (Math.random() < 0.2) return undefined;
  return String(10000 + i * 3 + Math.floor(Math.random() * 100));
}

// ─── Main ────────────────────────────────────────────────────────────────────

async function main() {
  const qtd = Number(process.argv[2] || 500);

  await AppDataSource.initialize();
  const repo = AppDataSource.getRepository(Epi);

  const countAtual = await repo.count();
  const start = countAtual + 1;

  const tipos = Object.keys(TIPOS);
  const epis: Partial<Epi>[] = [];

  for (let k = 0; k < qtd; k++) {
    const i = start + k;
    const tipo = pick(tipos);
    const descricaoBase = pick(TIPOS[tipo]);

    epis.push({
      codigo: `EPI-${pad(i, 5)}`,           // EPI-00001, EPI-00002...
      descricao: descricaoBase,
      ca: gerarCa(i),
      fabricante: pick(FABRICANTES),
      tipo,
      imagem: undefined,                          // deixado em branco conforme solicitado
      observacao: "teste",
    });
  }

  // Inserção em lote
  const BATCH = 100;
  for (let j = 0; j < epis.length; j += BATCH) {
    await repo.insert(epis.slice(j, j + BATCH));
    process.stdout.write(`\rInserindo... ${Math.min(j + BATCH, epis.length)}/${qtd}`);
  }

  console.log(`\nOK: ${qtd} EPIs inseridos.`);
  await AppDataSource.destroy();
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});