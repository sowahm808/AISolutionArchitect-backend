import {
  ForbiddenException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { Project } from "@prisma/client";
import { randomUUID } from "crypto";
import { PrismaService } from "../prisma/prisma.service";
import { AuthUser } from "../common/current-user.decorator";
import { CreateProjectDto, UpdateProjectDto } from "./dto";

@Injectable()
export class ProjectsService {
  constructor(private db: PrismaService) {}

  private withDisplaySummaries(project: Project): Project {
    const currentStateSummary =
      project.currentStateSummary || project.currentArchitecture || null;
    const targetStateSummary =
      project.targetStateSummary || project.targetGoal || null;
    const description = project.description || project.businessProblem || null;

    return {
      ...project,
      description,
      currentStateSummary,
      targetStateSummary,
    };
  }

  async create(u: AuthUser, d: CreateProjectDto) {
    const project = await this.db.project.create({
      data: {
        id: randomUUID(),
        ...d,
        organizationId: u.organizationId,
        ownerId: u.sub,
      },
    });
    return this.withDisplaySummaries(project);
  }

  async findAll(u: AuthUser) {
    const projects = await this.db.project.findMany({
      where: { organizationId: u.organizationId },
      orderBy: { updatedAt: "desc" },
    });
    return projects.map((project) => this.withDisplaySummaries(project));
  }

  async findOne(u: AuthUser, id: string) {
    const p = await this.db.project.findFirst({
      where: { id, organizationId: u.organizationId },
    });
    if (!p) throw new NotFoundException("Project not found");
    return this.withDisplaySummaries(p);
  }

  async update(u: AuthUser, id: string, d: UpdateProjectDto) {
    await this.findOne(u, id);
    const project = await this.db.project.update({ where: { id }, data: d });
    return this.withDisplaySummaries(project);
  }

  async remove(u: AuthUser, id: string) {
    if (["REVIEWER", "STAKEHOLDER"].includes(u.role))
      throw new ForbiddenException("Read-only role");
    await this.findOne(u, id);
    return this.db.project.delete({ where: { id } });
  }
}
