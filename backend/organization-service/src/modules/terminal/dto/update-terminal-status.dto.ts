import { IsBoolean, IsNotEmpty } from 'class-validator';

export class UpdateTerminalStatusDto {
  @IsNotEmpty()
  @IsBoolean()
  isActive!: boolean;
}
