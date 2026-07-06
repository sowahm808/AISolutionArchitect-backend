import { Module } from "@nestjs/common";
import { ConfigModule } from "@nestjs/config";
import { ThrottlerModule } from "@nestjs/throttler";
import { BullModule } from "@nestjs/bullmq";
import { PrismaModule } from "./prisma/prisma.module";
import { AuthModule } from "./auth/auth.module";
import { OrganizationsModule } from "./organizations/organizations.module";
import { ProjectsModule } from "./projects/projects.module";
import { DiscoveryModule } from "./discovery/discovery.module";
import { ArchitectureModelModule } from "./architecture-model/architecture-model.module";
import { ArtifactsModule } from "./artifacts/artifacts.module";
import { AiOrchestrationModule } from "./ai-orchestration/ai-orchestration.module";
import { AuditLogModule } from "./audit-log/audit-log.module";
import { ExportModule } from "./export/export.module";
import { UsersController } from "./users.controller";
import { ReviewController } from "./review.controller";
import { OrganizationAliasController } from "./organization-alias.controller";
import { AuditLogsController } from "./audit-logs.controller";
import { createRedisConnectionOptions } from "./redis.config";
@Module({
  controllers: [UsersController, ReviewController, OrganizationAliasController, AuditLogsController],
  imports: [
    ConfigModule.forRoot({ isGlobal: true }),
    ThrottlerModule.forRoot([{ ttl: 60000, limit: 100 }]),
    BullModule.forRoot({
      connection: createRedisConnectionOptions(),
    }),
    PrismaModule,
    AuditLogModule,
    AiOrchestrationModule,
    AuthModule,
    OrganizationsModule,
    ProjectsModule,
    DiscoveryModule,
    ArchitectureModelModule,
    ArtifactsModule,
    ExportModule,
  ],
})
export class AppModule {}
