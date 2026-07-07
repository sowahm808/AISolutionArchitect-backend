import { IsOptional, IsString } from "class-validator";
export class CreateProjectDto {
  @IsString() name: string;
  @IsOptional() @IsString() description?: string;
  @IsOptional() @IsString() cloudProvider?: string;
  @IsOptional() @IsString() company?: string;
  @IsOptional() @IsString() industry?: string;
  @IsOptional() @IsString() migrationType?: string;
  @IsOptional() @IsString() businessProblem?: string;
  @IsOptional() @IsString() currentArchitecture?: string;
  @IsOptional() @IsString() targetGoal?: string;
  @IsOptional() @IsString() compliance?: string;
  @IsOptional() @IsString() budget?: string;
  @IsOptional() @IsString() timeline?: string;
  @IsOptional() @IsString() notes?: string;
  @IsOptional() @IsString() currentStateSummary?: string;
  @IsOptional() @IsString() targetStateSummary?: string;
}
export class UpdateProjectDto extends CreateProjectDto {}
