import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ArtifactsController } from "./artifacts.controller";
import { ProjectsModule } from "../projects/projects.module";
import { AiOrchestrationModule } from "../ai-orchestration/ai-orchestration.module";
@Module({
  imports: [
    ProjectsModule,
    AiOrchestrationModule,
    BullModule.registerQueue({ name: "artifact-generation" }),
  ],
  controllers: [ArtifactsController],
})
export class ArtifactsModule {}
