import { IsIn } from 'class-validator';

export class ReviewUnavailableItemDto {
  @IsIn(['approve', 'cancel-order', 'dismiss'])
  decision!: 'approve' | 'cancel-order' | 'dismiss';
}
