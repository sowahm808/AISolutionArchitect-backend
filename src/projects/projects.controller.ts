import {
  Body,
  Controller,
  Delete,
  Get,
  Param,
  Patch,
  Post,
  UseGuards,
} from "@nestjs/common";
import { ApiBearerAuth, ApiTags } from "@nestjs/swagger";
import { JwtAuthGuard } from "../common/jwt-auth.guard";
import { CurrentUser, AuthUser } from "../common/current-user.decorator";
import { ProjectsService } from "./projects.service";
import { CreateProjectDto, UpdateProjectDto } from "./dto";
@ApiTags("Projects")
@ApiBearerAuth()
@UseGuards(JwtAuthGuard)
@Controller("projects")
export class ProjectsController {
  constructor(private s: ProjectsService) {}
  @Post() create(@CurrentUser() u: AuthUser, @Body() d: CreateProjectDto) {
    return this.s.create(u, d);
  }
  @Get() all(@CurrentUser() u: AuthUser) {
    return this.s.findAll(u);
  }
  @Get(":id") one(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.s.findOne(u, id);
  }
  @Patch(":id") upd(
    @CurrentUser() u: AuthUser,
    @Param("id") id: string,
    @Body() d: UpdateProjectDto,
  ) {
    return this.s.update(u, id, d);
  }
  @Delete(":id") del(@CurrentUser() u: AuthUser, @Param("id") id: string) {
    return this.s.remove(u, id);
  }
}
