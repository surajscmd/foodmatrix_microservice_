import { IsOptional, IsString, Length } from 'class-validator';

export class PairDeviceDto {
  @IsString()
  @Length(6, 6)
  pairingCode!: string;

  @IsOptional()
  @IsString()
  deviceModel?: string;
}
