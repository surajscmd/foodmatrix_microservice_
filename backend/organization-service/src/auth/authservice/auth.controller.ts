import {
  Body,
  Controller,
  Get,
  HttpCode,
  Post,
  Req,
  Res,
  UseGuards,
} from '@nestjs/common';
import type { Request, Response } from 'express';

import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { AuthService } from './auth.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { RegisterDto } from './dto/register.dto.js';
import { AuthGuard } from '../auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  // ------------------------------------------------------------
  // REGISTER
  // Only authenticated FoodMatrix admins can create users.
  // ------------------------------------------------------------

  @Post('register')
  @UseGuards(AuthGuard)
  register(@Session() session: UserSession, @Body() dto: RegisterDto) {
    return this.authService.register(dto, session.user.id);
  }

  // ------------------------------------------------------------
  // CHANGE PASSWORD
  // ------------------------------------------------------------

  @Post('change-password')
  @HttpCode(200)
  @UseGuards(AuthGuard)
  async changePassword(
    @Req() req: Request,
    @Res({ passthrough: true }) res: Response,
    @Body() dto: ChangePasswordDto,
  ) {
    const cookies = await this.authService.changePassword(req, dto);
    for (const cookie of cookies) res.append('Set-Cookie', cookie);
    res.setHeader('Cache-Control', 'private, no-store');
    return { message: 'Password changed successfully' };
  }

  // ------------------------------------------------------------
  // CURRENT USER
  // ------------------------------------------------------------

  @Get('me')
  @UseGuards(AuthGuard)
  async me(@Session() session: UserSession) {
    const systemUser = await this.authService.getCurrentUser(session.user.id);

    return {
      message: 'Authenticated user fetched successfully',
      data: {
        user: session.user,
        systemUser,
      },
    };
  }
}
