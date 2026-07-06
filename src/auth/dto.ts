import { IsEmail, IsOptional, IsString, MinLength } from "class-validator";
export class RegisterDto {
  @IsEmail() email: string;
  @IsString() displayName: string;
  @MinLength(8) password: string;
  @IsString() organizationName: string;
  @IsOptional() @IsString() industry?: string;
}
export class LoginDto {
  @IsEmail() email: string;
  @IsString() password: string;
}
export class RefreshDto {
  @IsString() refreshToken: string;
}
