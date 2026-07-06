# AI Solution Architect Backend

Production-oriented NestJS backend foundation for **AI Solution Architect**, an enterprise architecture generation platform that turns high-level initiatives into a canonical architecture model and consistent generated artifacts.

## Capabilities

- JWT authentication with refresh tokens and Argon2 password hashing.
- Organization-scoped users, roles, and project isolation.
- Architecture discovery workflow with stored Q&A.
- Versioned canonical `ArchitectureModel` per project.
- Artifact generation that always reads from the current ArchitectureModel.
- AI orchestration abstraction with prompt catalog, JSON output, validation, and auditable AI run records.
- Prisma/PostgreSQL schema and initial migration.
- Redis/BullMQ queue registration for background artifact generation.
- Swagger documentation at `/docs`.
- Helmet, CORS from environment variables, validation pipes, throttling, request logging, and centralized error filtering.
- Docker and docker-compose for local PostgreSQL/Redis/API development.

## Main API Groups

- `POST /auth/register`, `POST /auth/login`, `POST /auth/refresh`, `GET /auth/me`
- `GET/PATCH /organizations/current`
- `POST/GET /projects`, `GET/PATCH/DELETE /projects/:id`
- `POST /projects/:id/discovery/start`, `POST /projects/:id/discovery/answer`, `GET /projects/:id/discovery/questions`, `POST /projects/:id/discovery/complete`
- `POST /projects/:id/architecture-model/generate`, `GET /projects/:id/architecture-model/current`, `GET /projects/:id/architecture-model/versions`, `GET /projects/:id/architecture-model/:version`
- `POST /projects/:id/artifacts/generate`, `GET /projects/:id/artifacts`, `GET/PATCH /projects/:id/artifacts/:artifactId`, `POST /projects/:id/artifacts/:artifactId/regenerate`
- `POST /projects/:id/generate/{diagrams|adrs|terraform|kubernetes|cicd|security-review|risk-assessment|cost-estimate|executive-presentation}`
- `POST /projects/:id/export/{zip|pdf|docx|pptx}`

## Local Setup

```bash
cp .env.example .env
docker compose up -d postgres redis
npm install
npx prisma generate
npx prisma migrate dev
npm run prisma:seed
npm run start:dev
```

### Local URLs

After `npm run start:dev` is running, the API is available locally at:

- API base URL: `http://localhost:3000`
- Swagger API docs: `http://localhost:3000/docs`

Prisma uses the local PostgreSQL connection from `.env`:

- Database URL: `postgresql://postgres:postgres@localhost:5432/aisa?schema=public`

Useful Prisma commands:

```bash
npx prisma studio
npx prisma migrate dev
npx prisma generate
```

- Prisma Studio: `http://localhost:5555`

The seeded demo login is:

- Email: `demo@aisa.local`
- Password: `ChangeMe123!`

## AI Provider

Set `OPENAI_API_KEY` and `OPENAI_MODEL` to enable live model calls. Without an API key, the orchestration service uses deterministic, schema-valid fallback output so local development and tests remain repeatable.

## Architecture Consistency Rule

Artifacts are generated only after a canonical ArchitectureModel exists. The artifact service loads the latest model and passes it to the AI orchestration service, which records prompt input, output, model name, token usage, status, and errors in `AiRun` for auditability.

## Testing

```bash
npm test
npm run test:e2e
npm run build
```
