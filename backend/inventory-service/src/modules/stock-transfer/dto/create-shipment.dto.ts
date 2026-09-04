export class CreateStockTransferDto {}
import {
  IsDateString,
  IsOptional,
  IsString,
  MaxLength,
} from 'class-validator';

export class CreateShipmentDto {
  @IsOptional()
  @IsString()
  @MaxLength(150)
  carrierName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  trackingNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  dispatcherName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  dispatcherPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(150)
  driverName?: string;

  @IsOptional()
  @IsString()
  @MaxLength(30)
  driverPhone?: string;

  @IsOptional()
  @IsString()
  @MaxLength(50)
  vehicleNumber?: string;

  @IsOptional()
  @IsString()
  @MaxLength(100)
  vehicleType?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  dispatchLocation?: string;

  @IsOptional()
  @IsString()
  @MaxLength(255)
  deliveryLocation?: string;

  @IsOptional()
  @IsDateString()
  estimatedArrival?: string;

  @IsOptional()
  @IsString()
  @MaxLength(500)
  notes?: string;
}