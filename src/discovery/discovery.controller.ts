import { Body, Controller, Get, Param, Post, Put, UseGuards } from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { IsArray, IsString } from "class-validator";
import { randomUUID } from "crypto";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";
import { PrismaService } from "../prisma/prisma.service";
import { ProjectsService } from "../projects/projects.service";
import { AiOrchestrationService } from "../ai-orchestration/ai-orchestration.service";
class AnswerDto {
  @IsString() question: string;
  @IsString() answer: string;
}
class AnswersDto {
  @IsArray() answers: AnswerDto[];
}
@ApiTags("Discovery")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("projects/:id/discovery")
export class DiscoveryController {
  constructor(
    private db: PrismaService,
    private projects: ProjectsService,
    private ai: AiOrchestrationService,
  ) {}
  @Post("start") async start(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
  ) {
    const p = await this.projects.findOne(u, id);
    await this.db.project.update({
      where: { id },
      data: { status: "DISCOVERY_IN_PROGRESS" },
    });
    return this.ai.discovery(p, []);
  }
  @Post("answer") async answer(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
    @Body() d: AnswerDto,
  ) {
    await this.projects.findOne(u, id);
    return this.db.discoveryAnswer.create({
      data: { id: randomUUID(), projectId: id, ...d },
    });
  }
  @Get("questions") async questions(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
  ) {
    const p = await this.projects.findOne(u, id);
    const answers = await this.db.discoveryAnswer.findMany({
      where: { projectId: id },
    });
    return this.ai.discovery(p, answers);
  }

  @Put("answers") async saveDraft(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
    @Body() d: AnswersDto,
  ) {
    await this.projects.findOne(u, id);
    await this.db.discoveryAnswer.deleteMany({ where: { projectId: id } });
    const answers = d.answers || [];
    if (answers.length) {
      await this.db.discoveryAnswer.createMany({
        data: answers.map((answer) => ({
          id: randomUUID(),
          projectId: id,
          question: answer.question,
          answer: answer.answer,
        })),
      });
    }
    return this.db.discoveryAnswer.findMany({ where: { projectId: id } });
  }
  @Post("complete") async complete(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
  ) {
    await this.projects.findOne(u, id);
    return this.db.project.update({
      where: { id },
      data: { status: "MODEL_READY" },
    });
  }
}
