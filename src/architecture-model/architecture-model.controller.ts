import {
  Controller,
  Get,
  NotFoundException,
  Param,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectsService } from "../projects/projects.service";
import { AiOrchestrationService } from "../ai-orchestration/ai-orchestration.service";
@ApiTags("Architecture model")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("projects/:id/architecture-model")
export class ArchitectureModelController {
  constructor(
    private db: PrismaService,
    private projects: ProjectsService,
    private ai: AiOrchestrationService,
  ) {}
  @Post("generate") async gen(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
  ) {
    const p = await this.projects.findOne(u, id);
    const answers = await this.db.discoveryAnswer.findMany({
      where: { projectId: id },
    });
    const last = await this.db.architectureModel.findFirst({
      where: { projectId: id },
      orderBy: { version: "desc" },
    });
    const job = await this.db.generationJob.create({
      data: {
        id: randomUUID(),
        projectId: id,
        requestedBy: u.sub,
        jobType: "ARCHITECTURE_MODEL",
        status: "RUNNING",
        startedAt: new Date(),
      },
    });
    await this.db.project.update({
      where: { id },
      data: { status: "GENERATING" },
    });
    const m = await this.ai.buildModel(p, answers);
    const model = await this.db.architectureModel.create({
      data: {
        id: randomUUID(),
        projectId: id,
        version: (last?.version || 0) + 1,
        businessContext: m.businessContext ?? {},
        currentState: m.currentState ?? {},
        targetState: m.targetState ?? {},
        applications: m.applications ?? [],
        integrations: m.integrations ?? [],
        dataStores: m.dataStores ?? [],
        infrastructure: m.infrastructure ?? {},
        security: m.security ?? {},
        deployment: m.deployment ?? {},
        operations: m.operations ?? {},
        assumptions: m.assumptions ?? [],
        constraints: m.constraints ?? [],
        decisions: m.decisions ?? [],
        risks: m.risks ?? [],
      },
    });
    const completedJob = await this.db.generationJob.update({
      where: { id: job.id },
      data: { status: "COMPLETED", completedAt: new Date() },
    });
    await this.db.project.update({
      where: { id },
      data: { status: "MODEL_READY" },
    });
    return { ...completedJob, architectureModel: model };
  }

  @Get() async get(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
  ) {
    return this.cur(u, id);
  }
  @Get("current") async cur(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
  ) {
    await this.projects.findOne(u, id);
    const m = await this.db.architectureModel.findFirst({
      where: { projectId: id },
      orderBy: { version: "desc" },
    });
    if (!m) throw new NotFoundException("Architecture model not found");
    return m;
  }
  @Get("versions") async versions(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
  ) {
    await this.projects.findOne(u, id);
    return this.db.architectureModel.findMany({
      where: { projectId: id },
      select: { id: true, version: true, createdAt: true },
      orderBy: { version: "desc" },
    });
  }
  @Get(":version") async version(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
    @Param("version") v: string,
  ) {
    await this.projects.findOne(u, id);
    return this.db.architectureModel.findUniqueOrThrow({
      where: { projectId_version: { projectId: id, version: Number(v) } },
    });
  }
}
