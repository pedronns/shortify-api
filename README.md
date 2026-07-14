# Shortify v2

API encurtadora de links construída com **NestJS**, **Prisma** e **SQLite**.

---

## Novidades na v2

| Feature | v1 (Express + MongoDB) | v2 (NestJS + SQLite) |
|---|---|---|
| Framework | Express v5 | NestJS |
| Banco de dados | MongoDB | SQLite via Prisma |
| Autenticação | — | JWT (opcional) |
| Expiração de links | — | TTL por link |
| Estatísticas | Total de cliques | Cliques por dia |
| Validação | Joi | class-validator + ValidationPipe |
| Rate limiting | express-rate-limit | @nestjs/throttler |

---

## Stack

- **Runtime**: Node.js v18+
- **Framework**: NestJS v10
- **ORM**: Prisma v5
- **Banco de dados**: SQLite
- **Linguagem**: TypeScript
- **Autenticação**: JWT + Passport
- **Hash**: bcrypt
- **Validação**: class-validator
- **Rate Limiting**: @nestjs/throttler

---

## Instalação

```bash
npm install
```

Configure o `.env` (copie de `.env.example`):

```env
DATABASE_URL="file:./shortify.db"
PORT=3000
FRONTEND_URL=http://localhost:5173
JWT_SECRET=troque-por-algo-seguro
JWT_EXPIRES_IN=7d
API_URL=http://localhost:3000
NODE_ENV=development
```

Rode as migrations e gere o client do Prisma:

```bash
npm run prisma:migrate   # cria o shortify.db e aplica o schema
npm run prisma:generate  # gera o Prisma Client
```

Inicie o servidor:

```bash
# Desenvolvimento
npm run start:dev

# Produção
npm run build && npm start
```

---

## Endpoints

### Auth

| Método | Rota | Descrição |
|---|---|---|
| POST | /auth/register | Cria conta |
| POST | /auth/login | Login, retorna JWT |

#### POST /auth/register
```json
// Body
{ "email": "user@example.com", "password": "123456" }

// Response 201
{ "access_token": "eyJ..." }
```

#### POST /auth/login
```json
// Body
{ "email": "user@example.com", "password": "123456" }

// Response 200
{ "access_token": "eyJ..." }
```

---

### Links

> Endpoints de criação aceitam JWT opcionalmente (`Authorization: Bearer <token>`).  
> Quando autenticado, o link é vinculado ao usuário.

| Método | Rota | Auth | Descrição |
|---|---|---|---|
| GET | /health | — | Health check |
| POST | /random | Opcional | Cria link aleatório |
| POST | /custom | Opcional | Cria link personalizado |
| GET | /info/:code | — | Info pública do link |
| GET | /stats/:code | Opcional | Estatísticas detalhadas |
| GET | /me/links | Obrigatório | Lista links do usuário |
| GET | /:code | — | Acessa o link |
| POST | /:code/unlock | — | Desbloqueia link protegido |
| DELETE | /:code | Opcional | Deleta link |

#### POST /random
```json
// Body
{
  "url": "https://exemplo.com/pagina-longa",
  "password": "opcional",
  "expiresAt": "2026-12-31T23:59:59.000Z"  // opcional, ISO 8601
}

// Response 201
{
  "id": "cuid...",
  "url": "https://exemplo.com/pagina-longa",
  "code": "a1b2c3d4",
  "custom": false,
  "protected": false,
  "clicks": 0,
  "expiresAt": null,
  "createdAt": "2026-06-01T00:00:00.000Z"
}
```

#### POST /custom
```json
// Body
{
  "url": "https://exemplo.com/pagina",
  "code": "meu-link",       // 3-50 chars, [a-zA-Z0-9-_]
  "password": "opcional",
  "expiresAt": "2026-12-31T23:59:59.000Z"
}

// Response 409 — CODE_TAKEN
```

#### GET /info/:code
```json
// Response 200
{
  "protected": false,
  "url": "https://exemplo.com/pagina",  // null se protegido
  "clicks": 5,
  "expiresAt": null,
  "createdAt": "2026-06-01T00:00:00.000Z"
}
```

#### GET /stats/:code
```json
// Response 200
{
  "code": "meu-link",
  "url": "https://exemplo.com/pagina",
  "clicks": 5,
  "expiresAt": null,
  "createdAt": "2026-06-01T00:00:00.000Z",
  "clicksByDay": [
    { "date": "2026-06-01", "clicks": 3 },
    { "date": "2026-06-02", "clicks": 2 }
  ]
}
```

#### GET /:code
```json
// Response 302 — redirect to the original URL for unprotected links
// Response 302 — redirect to the frontend unlock page for protected links
// Response 410 — LINK_EXPIRED
// Response 404 — NOT_FOUND
```

#### POST /:code/unlock
```json
// Body
{ "password": "senha-do-link" }

// Response 200
{ "url": "https://exemplo.com/pagina" }

// Response 401 — INVALID_PASSWORD
// Response 409 — NOT_PROTECTED
```

#### DELETE /:code
```
Response 204 — No Content
Response 401 — NOT_YOUR_LINK (quando autenticado e o link pertence a outro usuário)
Response 404 — NOT_FOUND
```

---

## Documentação da API (Swagger)

A aplicação expõe uma UI Swagger em:

```bash
http://localhost:3000/api
```

Lá você encontra todas as rotas, esquemas de request/response e pode testar os endpoints com JWT.

---

## Estrutura do Projeto

```
src/
├── main.ts                           # Bootstrap + pipes + filtros globais
├── app.module.ts                     # Módulo raiz (ThrottlerModule, imports)
│
├── prisma/
│   ├── prisma.service.ts             # PrismaClient singleton
│   └── prisma.module.ts              # Global module
│
├── auth/
│   ├── dto/
│   │   ├── register.dto.ts
│   │   └── login.dto.ts
│   ├── jwt.strategy.ts               # Passport JWT strategy
│   ├── auth.service.ts
│   ├── auth.controller.ts
│   └── auth.module.ts
│
├── links/
│   ├── dto/
│   │   ├── create-random-link.dto.ts
│   │   ├── create-custom-link.dto.ts
│   │   └── unlock-link.dto.ts
│   ├── links.repository.ts           # Acesso ao Prisma
│   ├── links.service.ts              # Lógica de negócio
│   ├── links.controller.ts           # Rotas HTTP
│   └── links.module.ts
│
├── health/
│   ├── health.controller.ts
│   └── health.module.ts
│
└── common/
    ├── filters/
    │   └── http-exception.filter.ts  # Tratamento global de erros
    ├── guards/
    │   └── optional-jwt.guard.ts     # JWT sem obrigatoriedade
    └── decorators/
        └── current-user.decorator.ts # @CurrentUser()

prisma/
└── schema.prisma                     # Schema SQLite (User, Link, ClickEvent)
```

---

## Rate Limiting

Duas camadas de throttling via `@nestjs/throttler`:

| Camada | Limite | Janela |
|---|---|---|
| `general` | 60 req | 60s |
| `create` | 10 req | 60s (em POST /random e POST /custom) |

---

## Variáveis de Ambiente

| Variável | Descrição | Padrão |
|---|---|---|
| `DATABASE_URL` | Caminho do arquivo SQLite | `file:./shortify.db` |
| `PORT` | Porta do servidor | `3000` |
| `FRONTEND_URL` | Origem permitida no CORS | `http://localhost:5173` |
| `JWT_SECRET` | Segredo para assinar tokens | obrigatório em produção |
| `JWT_EXPIRES_IN` | Expiração do token | `7d` |
| `API_URL` | URL base da API (anti-recursão) | — |
| `NODE_ENV` | Ambiente | `development` |

---

## Licença

MIT
