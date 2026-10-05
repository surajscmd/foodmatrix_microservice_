import { Body, Controller, Get, Post, Req, UseGuards } from '@nestjs/common';

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
  @UseGuards(AuthGuard)
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req, dto);
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
