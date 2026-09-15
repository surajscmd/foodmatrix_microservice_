import {
  CanActivate,
  ExecutionContext,
  Injectable,
  UnauthorizedException,
} from '@nestjs/common';
import { createRemoteJWKSet, jwtVerify } from 'jose';
import type { Request } from 'express';
import type { AuthenticatedUser } from './auth.types.js';

type AuthenticatedRequest = Request & {
  user?: AuthenticatedUser;
};

@Injectable()
export class JwtAuthGuard implements CanActivate {
  private readonly jwks = createRemoteJWKSet(
    new URL('http://localhost:3001/api/auth/jwks'),
  );

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<AuthenticatedRequest>();

    const authorization = request.headers.authorization;

    if (!authorization) {
      throw new UnauthorizedException('Authorization header is missing');
    }

    const [scheme, token] = authorization.split(' ');

    if (scheme !== 'Bearer' || !token) {
      throw new UnauthorizedException('Invalid authorization header');
    }

    try {
      const { payload } = await jwtVerify(token, this.jwks, {
        issuer: 'http://localhost:3001',
        audience: 'http://localhost:3001',
      });

      if (typeof payload.sub !== 'string') {
        throw new Error('Token subject is missing');
      }

      request.user = {
        id: payload.sub,
        name: typeof payload.name === 'string' ? payload.name : '',
        email: typeof payload.email === 'string' ? payload.email : '',
        role: typeof payload.role === 'string' ? payload.role : '',
        franchiseId:
          typeof payload.franchiseId === 'string' ? payload.franchiseId : null,
        managedRestaurantId:
          typeof payload.managedRestaurantId === 'string'
            ? payload.managedRestaurantId
            : null,
      };

      return true;
    } catch {
      throw new UnauthorizedException('Invalid or expired token');
    }
  }
}
