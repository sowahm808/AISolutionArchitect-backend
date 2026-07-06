import { Module } from "@nestjs/common";
import { ArchitectureModelController } from "./architecture-model.controller";
import { ProjectsModule } from "../projects/projects.module";
import { AiOrchestrationModule } from "../ai-orchestration/ai-orchestration.module";
@Module({
  imports: [ProjectsModule, AiOrchestrationModule],
  controllers: [ArchitectureModelController],
})
export class ArchitectureModelModule {}
