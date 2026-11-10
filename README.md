# Karol System

Sistema de gestão para compra de cabelo em campo. Ele organiza os contatos (clientes em potencial), as compras feitas, as rotas de visita por cidade e a previsão de recompra, e inclui um assistente com IA que cadastra contatos a partir de mensagens em texto livre.

O repositório tem duas aplicações independentes:

| Pasta | O que é | Stack |
|---|---|---|
| [`backend/`](backend/) | API REST | Node.js, Fastify 5, Prisma (Postgres/Supabase), Zod, Vitest |
| [`frontend/`](frontend/) | Aplicação web (SPA) | React 19, Vite, Tailwind CSS 4, TanStack Query, React Router, Leaflet |

---

## Funcionalidades

- **Contatos**: cadastro com cidade, endereço geolocalizado, características do cabelo (cor, textura, química, comprimento), origem/indicação, fotos e observações. Cada contato passa pelo funil `lead` → `avaliacao_agendada` → `comprado` ou `perdido`.
- **Compras**: registro de cada corte (peso, comprimento, valor pago, forma de pagamento, fotos) e, depois, da revenda (valor, data, comprador).
- **Recompra**: a partir da data do último corte e do ciclo do contato (8 meses por padrão), o sistema calcula quando o cabelo estará pronto para uma nova compra. Os contatos ficam marcados como "prontos" 30 dias antes dessa data.
- **Agenda e rotas**: cada dia de rota tem cidade de partida, horário de saída, visitas e tarefas ordenadas, tempo por visita e custos (combustível, alimentação, hospedagem). A distância, a duração e o traçado da rota são calculados automaticamente. Cada visita é concluída com um resultado (`comprou`, `nao_comprou`, `nao_atendeu`, `remarcar`).
- **A agendar**: lista os contatos que ainda precisam entrar em alguma rota.
- **Mapa**: visão geral dos contatos por cidade.
- **Painel e relatórios**: indicadores de compras, custos e resultados, com exportação para Excel.
- **Assistente IA**: interpreta mensagens em linguagem natural (via OpenAI), monta um rascunho de contato/compra, pergunta o que falta e só grava após confirmação do usuário. Tem limite de uso por usuário e proteção contra envio duplicado.
- **Auditoria**: as alterações relevantes ficam registradas.
- **Autenticação**: login via Supabase Auth, com sessão persistente (refresh token em cookie HttpOnly).

---

## Estrutura

```
backend/
  src/
    server.ts          # ponto de entrada (porta 3333)
    app.ts             # Fastify: CORS, cookies, multipart, rotas
    config/            # Supabase, OpenAI, cookie de sessão
    routes/            # definição dos endpoints
    controllers/       # entrada/saída HTTP
    schemas/           # validação com Zod
    services/          # regras de negócio
    repositories/      # acesso ao banco
    prisma/            # contrato do banco (contract.prisma) e cliente
    tests/             # testes unitários e de integração
    seed-cidades.ts    # cidades iniciais (PR/SC)
    seed-demo.ts       # dados de demonstração
  migrations/

frontend/
  src/
    pages/             # Painel, Contatos, Agenda, Mapa, Relatórios, Assistente, Login
    components/        # componentes por área (contacts, schedule, map, reports...)
    services/          # chamadas à API (axios + TanStack Query)
    contexts/          # AuthContext
    schemas/ types/ utils/ hooks/
  tests/
```

### Endpoints da API

Todas as rotas exigem autenticação, exceto as de `/auth`.

| Prefixo | Uso |
|---|---|
| `/auth` | login, `/refresh`, `/logout` |
| `/cidades` | cidades |
| `/contatos` | contatos, status, fotos e compras do contato |
| `/recompras` | previsão de recompra (`/prontas`) |
| `/rotas` | dias de rota, visitas, tarefas, horários, remarcação |
| `/a-agendar` | contatos sem visita agendada |
| `/painel` | indicadores do painel |
| `/relatorios` | relatórios |
| `/mapa` | dados do mapa global |
| `/export` | exportação para Excel |
| `/assistente` | conversa com o assistente IA e confirmação do cadastro |

---

## Como rodar localmente

Pré-requisitos: Node.js 20+ e um projeto no [Supabase](https://supabase.com) (Postgres + Auth + Storage).

### 1. Backend

```bash
cd backend
npm install
cp .env.example .env    # preencha as variáveis (veja abaixo)
npm run dev             # API em http://localhost:3333
```

Variáveis principais do `backend/.env` (a lista completa e comentada está em [`backend/.env.example`](backend/.env.example)):

| Variável | Para quê |
|---|---|
| `DATABASE_URL` / `DIRECT_URL` | conexão com o Postgres do Supabase (pooler e direta) |
| `SUPABASE_URL` / `SUPABASE_SECRET_KEY` | Auth e Storage (fotos) |
| `GEOAPIFY_API_KEY` | geocodificação de endereços e cálculo de rotas |
| `OPENAI_API_KEY` / `OPENAI_MODEL` | assistente IA |
| `FRONTEND_ORIGINS`, `AUTH_COOKIE_*` | necessários em produção quando front e API estão em domínios diferentes |

Dados iniciais (opcional):

```bash
npx tsx src/seed-cidades.ts   # cidades de PR/SC
npm run seed:demo             # dados de demonstração
```

### 2. Frontend

```bash
cd frontend
npm install
cp .env.example .env    # VITE_API_URL=http://localhost:3333
npm run dev
```

---

## Testes

```bash
cd backend && npm test     # Vitest
cd frontend && npm test    # Vitest
cd frontend && npm run typecheck
```

Os testes de integração do backend usam um banco separado, configurado em `backend/.env.test`. Para aplicar o schema nesse banco:

```bash
cd backend
npm run db:test:dry      # mostra o que será alterado
npm run db:test:update   # aplica
```

---

## Deploy

- **Frontend**: preparado para Vercel ([`vercel.json`](frontend/vercel.json)) ou Netlify ([`_redirects`](frontend/public/_redirects)). Os dois arquivos redirecionam todas as rotas para o `index.html` da SPA. Gere o build com `npm run build`.
- **Backend**: qualquer serviço Node (ex.: Render). Em produção, com front e API em domínios diferentes, configure `AUTH_COOKIE_SAMESITE=none` e `FRONTEND_ORIGINS` com a URL do front (exige HTTPS).

> As chaves do Supabase, da OpenAI e da Geoapify ficam **somente no backend**. O frontend só conhece `VITE_API_URL`.
