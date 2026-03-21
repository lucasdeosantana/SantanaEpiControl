# Sistema de Controle de Entrega de EPI com Auditoria Criptográfica

## Objetivo

Sistema para registro de entrega de EPI que:

* registra evidência da entrega
* garante integridade dos registros
* cria trilha de auditoria imutável
* gera prova temporal externa

Recursos principais:

* foto da entrega
* hash criptográfico do registro
* ledger interno imutável
* timestamp externo
* comprovante de entrega
* sistema de consulta e auditoria

---

# Arquitetura Geral

```
Usuário (tablet/pc)
        ↓
Frontend
        ↓
API Backend
        ↓
Banco de dados
        ↓
Sistema de Hash
        ↓
Ledger Imutável
        ↓
Hash Diário
        ↓
Timestamp externo
```

---

# Backend

## Módulo 1 — Gestão de Funcionários

Responsável por manter base de trabalhadores.

### Funções

* criar funcionário
* editar funcionário
* desativar funcionário
* consultar funcionário

### Campos principais

* nome
* CPF
* matrícula
* setor
* status

---

## Módulo 2 — Gestão de EPIs

Cadastro de equipamentos controlados.

### Funções

* cadastrar EPI
* editar EPI
* consultar EPI

### Campos principais

* descrição
* CA
* fabricante
* validade

---

## Módulo 3 — Registro de Entrega de EPI

Evento principal do sistema.

### Fluxo

1 funcionário selecionado
2 EPI selecionado
3 responsável pela entrega registrado
4 foto capturada
5 registro criado

### Resultado

Registro de entrega persistido no banco.

---

## Módulo 4 — Captura e Armazenamento de Foto

Evidência visual da entrega.

### Funções

* receber foto do frontend
* armazenar foto
* gerar hash da foto
* associar à entrega

---

## Módulo 5 — Geração de Hash do Registro

Garantia de integridade.

### Dados utilizados

* funcionário
* CPF
* EPI
* CA
* data e hora
* hash da foto
* responsável

### Processo

1 gerar estrutura de dados
2 serializar dados
3 gerar hash SHA256

---

## Módulo 6 — Ledger Imutável (Blockchain Interno)

Registro sequencial de eventos do sistema.

### Objetivo

Detectar alterações administrativas.

### Eventos registrados

* criação de entrega
* edição de dados
* exclusões
* criação de funcionários
* cadastro de EPI

### Estrutura

Cada registro contém:

* timestamp
* tipo de evento
* dados do evento
* hash anterior
* hash atual

---

## Módulo 7 — Agrupamento de Hash Diário

Cria prova consolidada do dia.

### Processo

1 coletar hashes de registros do dia
2 concatenar hashes
3 gerar hash diário

---

## Módulo 8 — Timestamp Externo

Prova temporal do sistema.

### Entrada

hash diário

### Saída

arquivo de timestamp

### Função

provar que os registros existiam naquela data.

---

## Módulo 9 — Geração de Comprovante

Criação de documento de entrega.

### Conteúdo

* dados do funcionário
* EPI entregue
* CA
* data e hora
* foto
* hash do registro

---

## Módulo 10 — Consulta e Auditoria

Interface de análise de dados.

### Funções

* busca por funcionário
* busca por período
* busca por EPI
* visualizar comprovantes
* verificar integridade

---

# Frontend

## Tela 1 — Login

Controle de acesso ao sistema.

### Campos

* usuário
* senha

---

## Tela 2 — Dashboard

Visão geral do sistema.

### Informações

* entregas do dia
* total de funcionários
* total de EPIs cadastrados

---

## Tela 3 — Cadastro de Funcionários

### Funções

* criar funcionário
* editar funcionário
* pesquisar funcionário

---

## Tela 4 — Cadastro de EPIs

### Funções

* cadastrar EPI
* editar EPI
* consultar lista

---

## Tela 5 — Registro de Entrega

Tela principal de operação.

### Fluxo

1 buscar funcionário
2 selecionar EPI
3 capturar foto
4 confirmar entrega

### Resultado

registro criado no sistema.

---

## Tela 6 — Histórico de Entregas

Visualização de entregas registradas.

### Filtros

* funcionário
* data
* EPI

---

## Tela 7 — Visualização de Comprovante

Exibe registro completo.

### Dados exibidos

* dados do funcionário
* dados do EPI
* foto
* hash do registro
* timestamp

---

## Tela 8 — Auditoria

Ferramenta para verificar integridade.

### Funções

* verificar cadeia do ledger
* validar hashes
* validar timestamp

---

# Estrutura do Banco de Dados

## Tabela funcionarios

```
id
nome
cpf
matricula
setor
status
created_at
```

---

## Tabela epis

```
id
descricao
ca
fabricante
validade
created_at
```

---

## Tabela entregas

```
id
funcionario_id
epi_id
responsavel
data_hora
created_at
```

---

## Tabela fotos

```
id
entrega_id
arquivo
hash_foto
created_at
```

---

## Tabela hash_registro

```
id
entrega_id
hash_sha256
created_at
```

---

## Tabela audit_log

Ledger imutável.

```
id
timestamp
evento
dados
hash_anterior
hash_atual
usuario
```

---

## Tabela hash_diario

```
id
data
hash_dia
```

---

## Tabela timestamp_externo

```
id
data
hash_dia
arquivo_timestamp

```

---

## Tabela comprovantes

```
id
epis_ids (multi to multi)
arquivo_pdf (path)
status (processing, validated, created, error)
foto
hash_foto
arquivo_timestamp (path)
hash_pdf
created_at
```

---

# Fluxo de Dados

```
registro de entrega
        ↓
captura foto
        ↓
hash foto
        ↓
hash registro
        ↓
registro no ledger
        ↓
hash diário
        ↓
timestamp externo
        ↓
geração de comprovante
```

---

# Ordem Recomendada de Implementação

### Fase 1 — Base do sistema

1 banco de dados
2 cadastro de funcionários
3 cadastro de EPIs

---

### Fase 2 — Operação principal

4 registro de entrega
5 captura de foto
6 armazenamento de registros

---

### Fase 3 — Segurança de dados

7 geração de hash do registro
8 implementação do ledger imutável

---

### Fase 4 — Prova temporal

9 geração de hash diário
10 integração com timestamp externo

---

### Fase 5 — Auditoria e documentos

11 geração de comprovantes
12 consulta de histórico
13 verificação de integridade

---

# Resultado Esperado

Sistema capaz de:

* registrar entrega de EPI
* fornecer evidência visual
* garantir integridade criptográfica
* detectar manipulação administrativa
* provar existência temporal do registro
* fornecer auditoria completa.

---

Se quiser, posso também montar **uma segunda versão desse markdown**, mas em **formato de checklist de desenvolvimento (estilo GitHub project)**.

Isso ajuda muito quando você vai **construir o sistema iterativamente com IA**, porque cada item vira um prompt de desenvolvimento.
# Sistema de Controle de Entrega de EPI com Auditoria Criptográfica

## Objetivo

Sistema para registro de entrega de EPI que:

* registra evidência da entrega
* garante integridade dos registros
* cria trilha de auditoria imutável
* gera prova temporal externa

Recursos principais:

* foto da entrega
* hash criptográfico do registro
* ledger interno imutável
* timestamp externo
* comprovante de entrega
* sistema de consulta e auditoria

---

# Arquitetura Geral

```
Usuário (tablet/pc)
        ↓
Frontend
        ↓
API Backend
        ↓
Banco de dados
        ↓
Sistema de Hash
        ↓
Ledger Imutável
        ↓
Hash Diário
        ↓
Timestamp externo
```

---

# Backend

## Módulo 1 — Gestão de Funcionários

Responsável por manter base de trabalhadores.

### Funções

* criar funcionário
* editar funcionário
* desativar funcionário
* consultar funcionário

### Campos principais

* nome
* CPF
* matrícula
* setor
* status

---

## Módulo 2 — Gestão de EPIs

Cadastro de equipamentos controlados.

### Funções

* cadastrar EPI
* editar EPI
* consultar EPI

### Campos principais

* descrição
* CA
* fabricante
* validade

---

## Módulo 3 — Registro de Entrega de EPI

Evento principal do sistema.

### Fluxo

1 funcionário selecionado
2 EPI selecionado
3 responsável pela entrega registrado
4 foto capturada
5 registro criado

### Resultado

Registro de entrega persistido no banco.

---

## Módulo 4 — Captura e Armazenamento de Foto

Evidência visual da entrega.

### Funções

* receber foto do frontend
* armazenar foto
* gerar hash da foto
* associar à entrega

---

## Módulo 5 — Geração de Hash do Registro

Garantia de integridade.

### Dados utilizados

* funcionário
* CPF
* EPI
* CA
* data e hora
* hash da foto
* responsável

### Processo

1 gerar estrutura de dados
2 serializar dados
3 gerar hash SHA256

---

## Módulo 6 — Ledger Imutável (Blockchain Interno)

Registro sequencial de eventos do sistema.

### Objetivo

Detectar alterações administrativas.

### Eventos registrados

* criação de entrega
* edição de dados
* exclusões
* criação de funcionários
* cadastro de EPI

### Estrutura

Cada registro contém:

* timestamp
* tipo de evento
* dados do evento
* hash anterior
* hash atual

---

## Módulo 7 — Agrupamento de Hash Diário

Cria prova consolidada do dia.

### Processo

1 coletar hashes de registros do dia
2 concatenar hashes
3 gerar hash diário

---

## Módulo 8 — Timestamp Externo

Prova temporal do sistema.

### Entrada

hash diário

### Saída

arquivo de timestamp

### Função

provar que os registros existiam naquela data.

---

## Módulo 9 — Geração de Comprovante

Criação de documento de entrega.

### Conteúdo

* dados do funcionário
* EPI entregue
* CA
* data e hora
* foto
* hash do registro

---

## Módulo 10 — Consulta e Auditoria

Interface de análise de dados.

### Funções

* busca por funcionário
* busca por período
* busca por EPI
* visualizar comprovantes
* verificar integridade

---

# Frontend

## Tela 1 — Login

Controle de acesso ao sistema.

### Campos

* usuário
* senha

---

## Tela 2 — Dashboard

Visão geral do sistema.

### Informações

* entregas do dia
* total de funcionários
* total de EPIs cadastrados

---

## Tela 3 — Cadastro de Funcionários

### Funções

* criar funcionário
* editar funcionário
* pesquisar funcionário

---

## Tela 4 — Cadastro de EPIs

### Funções

* cadastrar EPI
* editar EPI
* consultar lista

---

## Tela 5 — Registro de Entrega

Tela principal de operação.

### Fluxo

1 buscar funcionário
2 selecionar EPI
3 capturar foto
4 confirmar entrega

### Resultado

registro criado no sistema.

---

## Tela 6 — Histórico de Entregas

Visualização de entregas registradas.

### Filtros

* funcionário
* data
* EPI

---

## Tela 7 — Visualização de Comprovante

Exibe registro completo.

### Dados exibidos

* dados do funcionário
* dados do EPI
* foto
* hash do registro
* timestamp

---

## Tela 8 — Auditoria

Ferramenta para verificar integridade.

### Funções

* verificar cadeia do ledger
* validar hashes
* validar timestamp

---

# Estrutura do Banco de Dados

## Tabela funcionarios

```
id
nome
cpf
matricula
setor
status
created_at
```

---

## Tabela epis

```
id
descricao
ca
fabricante
validade
created_at
```

---

## Tabela entregas

```
id
funcionario_id
epi_id
responsavel
data_hora
created_at
```

---

## Tabela fotos

```
id
entrega_id
arquivo
hash_foto
created_at
```

---

## Tabela hash_registro

```
id
entrega_id
hash_sha256
created_at
```

---

## Tabela audit_log

Ledger imutável.

```
id
timestamp
evento
dados
hash_anterior
hash_atual
usuario
```

---

## Tabela hash_diario

```
id
data
hash_dia
```

---

## Tabela timestamp_externo

```
id
data
hash_dia
arquivo_timestamp
```

---

## Tabela comprovantes

```
id
entrega_id
arquivo_pdf
created_at
```

---

# Fluxo de Dados

```
registro de entrega
        ↓
captura foto
        ↓
hash foto
        ↓
hash registro
        ↓
registro no ledger
        ↓
hash diário
        ↓
timestamp externo
        ↓
geração de comprovante
```

---

# Ordem Recomendada de Implementação

### Fase 1 — Base do sistema

1 banco de dados
2 cadastro de funcionários
3 cadastro de EPIs

---

### Fase 2 — Operação principal

4 registro de entrega
5 captura de foto
6 armazenamento de registros

---

### Fase 3 — Segurança de dados

7 geração de hash do registro
8 implementação do ledger imutável

---

### Fase 4 — Prova temporal

9 geração de hash diário
10 integração com timestamp externo

---

### Fase 5 — Auditoria e documentos

11 geração de comprovantes
12 consulta de histórico
13 verificação de integridade

---

# Resultado Esperado

Sistema capaz de:

* registrar entrega de EPI
* fornecer evidência visual
* garantir integridade criptográfica
* detectar manipulação administrativa
* provar existência temporal do registro
* fornecer auditoria completa.

---

Se quiser, posso também montar **uma segunda versão desse markdown**, mas em **formato de checklist de desenvolvimento (estilo GitHub project)**.

Isso ajuda muito quando você vai **construir o sistema iterativamente com IA**, porque cada item vira um prompt de desenvolvimento.

