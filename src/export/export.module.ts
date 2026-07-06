import { Module } from "@nestjs/common";
import { ExportController } from "./export.controller";
import { ProjectsModule } from "../projects/projects.module";
@Module({ imports: [ProjectsModule], controllers: [ExportController] })
export class ExportModule {}
