import { Module } from "@nestjs/common";
import { DiscoveryController } from "./discovery.controller";
import { ProjectsModule } from "../projects/projects.module";
import { AiOrchestrationModule } from "../ai-orchestration/ai-orchestration.module";
@Module({
  imports: [ProjectsModule, AiOrchestrationModule],
  controllers: [DiscoveryController],
})
export class DiscoveryModule {}
