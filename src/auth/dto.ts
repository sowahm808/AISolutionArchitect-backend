import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
export class RegisterDto {
  @IsEmail() email: string;
  @IsOptional() @IsString() displayName?: string;
  @IsOptional() @IsString() name?: string;
  @MinLength(8) password: string;
  @IsOptional() @IsString() organizationName?: string;
  @IsOptional() @IsString() role?: string;
  @IsOptional() @IsString() industry?: string;
}
export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}
export class RefreshDto {
  @IsOptional() @IsString() refreshToken?: string;
}
