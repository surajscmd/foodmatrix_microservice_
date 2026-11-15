import { Transform } from 'class-transformer';
import { IsISO8601, IsIn, IsString, Length } from 'class-validator';

export class RevokeLeaveDto {
  @IsIn(['PENDING', 'APPROVED'])
  expectedStatus!: 'PENDING' | 'APPROVED';

  @IsISO8601({ strict: true, strictSeparator: true })
  expectedUpdatedAt!: string;

  @Transform(({ value }: { value: unknown }) =>
    typeof value === 'string' ? value.trim() : value,
  )
  @IsString()
  @Length(1, 500)
  reason!: string;
}
