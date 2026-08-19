import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { Request } from 'express';

@Injectable()
export class InternalAuthGuard implements CanActivate {
  canActivate(context: ExecutionContext): boolean {
    // 2. Add <Request> here to remove the 'any' type
    const request = context.switchToHttp().getRequest<Request>();

    // request.headers is now strictly typed!
    const providedKey = request.headers['x-internal-key'];
    const requiredKey = process.env.INTERNAL_API_KEY;

    if (!providedKey || providedKey !== requiredKey) {
      throw new UnauthorizedException('Access denied: Invalid internal key.');
    }

    return true;
  }
}
