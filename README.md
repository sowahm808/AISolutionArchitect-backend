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
- Swagger documentation at `/api/docs`.
- Helmet, CORS from environment variables, validation pipes, throttling, request logging, and centralized error filtering.
- Docker and docker-compose for local PostgreSQL/Redis/API development.

## Main API Groups

- `POST /api/auth/register`, `POST /api/auth/login`, `POST /api/auth/refresh`, `GET /api/auth/me`
- `GET/PATCH /api/organizations/current`
- `POST/GET /api/projects`, `GET/PATCH/DELETE /api/projects/:id`
- `POST /api/projects/:id/discovery/start`, `POST /api/projects/:id/discovery/answer`, `GET /api/projects/:id/discovery/questions`, `POST /api/projects/:id/discovery/complete`
- `POST /api/projects/:id/architecture-model/generate`, `GET /api/projects/:id/architecture-model/current`, `GET /api/projects/:id/architecture-model/versions`, `GET /api/projects/:id/architecture-model/:version`
- `POST /api/projects/:id/artifacts/generate`, `GET /api/projects/:id/artifacts`, `GET/PATCH /api/projects/:id/artifacts/:artifactId`, `POST /api/projects/:id/artifacts/:artifactId/regenerate`
- `POST /api/projects/:id/generate/{diagrams|adrs|terraform|kubernetes|cicd|security-review|risk-assessment|cost-estimate|executive-presentation}`
- `POST /api/projects/:id/export/{zip|pdf|docx|pptx}`

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

- API base URL: `http://localhost:3000/api`
- Swagger API docs: `http://localhost:3000/api/docs`

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


## Render Deployment Notes

Set `DATABASE_URL` to the current **Internal Database URL** from your Render PostgreSQL instance. A Prisma `P1000` error means the username/password in `DATABASE_URL` are not accepted by the database, so rotate or copy the database credentials again in Render.

To fix a Render `P1000` startup failure:

1. Open the Render PostgreSQL service that your backend should use.
2. Copy the latest **Internal Database URL**. Do not use an old URL from a previous database or a manually typed username/password.
3. Open the backend web service in Render, update the `DATABASE_URL` environment variable with that exact value, and save/redeploy.
4. If the URL still fails, rotate the PostgreSQL password in Render, copy the newly generated **Internal Database URL**, update `DATABASE_URL` again, and redeploy.

The application logs a short, sanitized `DATABASE_URL` remediation message for Prisma `P1000` errors so credentials are not printed in deploy logs.

Set Redis with either `REDIS_URL` (for example, Render's internal Redis URL such as `redis://red-...:6379`) or separate `REDIS_HOST`/`REDIS_PORT` values. If using `REDIS_HOST`, provide only the hostname, not a full `redis://` URL.

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
