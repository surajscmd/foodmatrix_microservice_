import { Controller, Get, Post, Body, UseGuards, Req } from '@nestjs/common';

import { Session, type UserSession } from '@thallesp/nestjs-better-auth';

import { RegisterDto } from './dto/register.dto.js';
import { AuthService } from './auth.service.js';
import { ChangePasswordDto } from './dto/change-password.dto.js';
import { AuthGuard } from '../auth.guard.js';

@Controller('auth')
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post('register')
  register(@Body() dto: RegisterDto) {
    return this.authService.register(dto);
  }

  @Post('change-password')
  @UseGuards(AuthGuard)
  async changePassword(@Req() req: Request, @Body() dto: ChangePasswordDto) {
    return this.authService.changePassword(req, dto);
  }

  /**
   * Get authenticated Better Auth user
   * together with FoodMatrix application data.
   */
  @Get('me')
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
