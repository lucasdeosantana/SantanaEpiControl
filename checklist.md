# Sistema de Controle de EPI com Auditoria Criptográfica

## Checklist de Desenvolvimento

---

# Épico 1 — Infraestrutura do Projeto

## Estrutura inicial do projeto

* [ ] Criar repositório do projeto
* [ ] Definir estrutura de pastas backend
* [ ] Definir estrutura de pastas frontend
* [ ] Criar estrutura de configuração de ambiente
* [ ] Definir sistema de migração do banco de dados

### Critério de pronto

* projeto inicia sem erros
* banco conecta corretamente
* ambiente local configurado

---

# Épico 2 — Banco de Dados

## Criar estrutura do banco

* [ ] Criar tabela **funcionarios**
* [ ] Criar tabela **epis**
* [ ] Criar tabela **entregas**
* [ ] Criar tabela **fotos**
* [ ] Criar tabela **hash_registro**
* [ ] Criar tabela **audit_log**
* [ ] Criar tabela **hash_diario**
* [ ] Criar tabela **timestamp_externo**
* [ ] Criar tabela **comprovantes**

### Critério de pronto

* todas as tabelas criadas
* relacionamentos funcionando
* migrations funcionando

---

# Épico 3 — Backend Base

## API básica

* [ ] Criar servidor backend
* [ ] Criar estrutura de rotas
* [ ] Criar middleware de erros
* [ ] Criar middleware de autenticação
* [ ] Criar estrutura de serviços
* [ ] Criar estrutura de repositórios de dados

### Critério de pronto

* API responde
* endpoints retornam dados mockados

---

# Épico 4 — Gestão de Funcionários

## Backend

* [ ] Criar endpoint **criar funcionário**
* [ ] Criar endpoint **editar funcionário**
* [ ] Criar endpoint **listar funcionários**
* [ ] Criar endpoint **buscar funcionário**

## Frontend

* [ ] Criar tela de cadastro de funcionário
* [ ] Criar tela de edição
* [ ] Criar campo de busca

### Critério de pronto

* funcionário pode ser criado
* funcionário pode ser editado
* funcionário pode ser listado

---

# Épico 5 — Gestão de EPIs

## Backend

* [ ] Criar endpoint **criar EPI**
* [ ] Criar endpoint **editar EPI**
* [ ] Criar endpoint **listar EPIs**

## Frontend

* [ ] Criar tela de cadastro de EPI
* [ ] Criar lista de EPIs
* [ ] Criar edição de EPI

### Critério de pronto

* EPIs cadastrados aparecem na lista
* edição salva corretamente

---

# Épico 6 — Registro de Entrega de EPI

## Backend

* [ ] Criar endpoint **registrar entrega**
* [ ] Criar endpoint **listar entregas**
* [ ] Criar endpoint **buscar entrega**

## Frontend

* [ ] Criar tela de registro de entrega
* [ ] Criar busca de funcionário
* [ ] Criar seleção de EPI
* [ ] Criar botão de confirmação

### Critério de pronto

* entrega registrada no banco
* entrega aparece no histórico

---

# Épico 7 — Captura de Foto

## Backend

* [ ] Criar endpoint **upload de foto**
* [ ] Criar armazenamento de arquivos
* [ ] Criar geração de hash da foto

## Frontend

* [ ] Criar captura de foto via câmera
* [ ] Criar preview da foto
* [ ] Enviar foto para backend

### Critério de pronto

* foto salva no servidor
* hash da foto armazenado

---

# Épico 8 — Hash do Registro

## Backend

* [ ] Criar serviço de geração de hash
* [ ] Definir estrutura de dados para hash
* [ ] Salvar hash na tabela **hash_registro**

### Critério de pronto

* cada entrega gera um hash único
* hash armazenado corretamente

---

# Épico 9 — Ledger Imutável (Blockchain Interno)

## Backend

* [ ] Criar tabela **audit_log**
* [ ] Criar função de geração de bloco
* [ ] Criar função para recuperar último hash
* [ ] Criar hash encadeado
* [ ] Registrar eventos no ledger

### Eventos registrados

* [ ] criação de entrega
* [ ] edição de dados
* [ ] cadastro de funcionário
* [ ] cadastro de EPI

### Critério de pronto

* eventos aparecem no ledger
* cadeia de hashes funciona

---

# Épico 10 — Verificação de Integridade

## Backend

* [ ] Criar função de verificação da cadeia
* [ ] Criar endpoint de verificação
* [ ] Criar relatório de integridade

### Critério de pronto

* sistema detecta alteração no ledger

---

# Épico 11 — Hash Diário

## Backend

* [ ] criar processo de agregação de hashes
* [ ] gerar hash diário
* [ ] salvar hash na tabela **hash_diario**

### Critério de pronto

* hash diário gerado automaticamente

---

# Épico 12 — Timestamp Externo

Integração com timestamp blockchain.

## Backend

* [ ] integrar serviço de timestamp
* [ ] enviar hash diário
* [ ] armazenar arquivo de prova

### Critério de pronto

* timestamp salvo no banco

---

# Épico 13 — Comprovante de Entrega

## Backend

* [ ] criar geração de PDF
* [ ] incluir foto no comprovante
* [ ] incluir hash do registro
* [ ] salvar arquivo gerado

## Frontend

* [ ] criar botão visualizar comprovante
* [ ] criar download do comprovante

### Critério de pronto

* comprovante gerado automaticamente

---

# Épico 14 — Histórico e Consulta

## Backend

* [ ] endpoint de busca por funcionário
* [ ] endpoint de busca por data
* [ ] endpoint de busca por EPI

## Frontend

* [ ] criar tela de histórico
* [ ] filtros de pesquisa
* [ ] visualização detalhada

### Critério de pronto

* histórico navegável

---

# Épico 15 — Tela de Auditoria

## Backend

* [ ] endpoint para ver ledger
* [ ] endpoint de verificação de hash
* [ ] endpoint de verificação de timestamp

## Frontend

* [ ] criar tela de auditoria
* [ ] mostrar cadeia de eventos
* [ ] mostrar status de integridade

### Critério de pronto

* auditor consegue verificar integridade

---

# Épico 16 — Segurança

## Backend

* [ ] autenticação de usuários
* [ ] autorização por perfil
* [ ] registro de login no audit log

### Critério de pronto

* sistema exige login

---

# Épico 17 — Testes

* [ ] testes unitários de hash
* [ ] testes do ledger
* [ ] testes de endpoints
* [ ] testes de integridade

### Critério de pronto

* testes executam sem falhas

---

# Fluxo Final do Sistema

```text
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
      ↓
consulta e auditoria
```

---

# Definição de Conclusão do Projeto

O sistema é considerado completo quando:

* [ ] entrega de EPI registrada
* [ ] foto armazenada
* [ ] hash gerado
* [ ] ledger imutável funcionando
* [ ] hash diário gerado
* [ ] timestamp externo registrado
* [ ] comprovante gerado
* [ ] auditoria funcional

