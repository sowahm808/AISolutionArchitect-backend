import { Module } from "@nestjs/common";
import { BullModule } from "@nestjs/bullmq";
import { ArtifactsController } from "./artifacts.controller";
import { ProjectsModule } from "../projects/projects.module";
@Module({
  imports: [
    ProjectsModule,
    BullModule.registerQueue({ name: "artifact-generation" }),
  ],
  controllers: [ArtifactsController],
})
export class ArtifactsModule {}
