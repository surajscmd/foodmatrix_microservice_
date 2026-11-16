import { Controller, Get, Header, Headers } from '@nestjs/common';
import { AllowAnonymous } from '@thallesp/nestjs-better-auth';
import { WorkspaceAccessService } from '../../auth/workspace-access.service.js';

@Controller('hr-access')
export class HrAccessController {
  constructor(private readonly workspaceAccess: WorkspaceAccessService) {}

  @Get()
  @AllowAnonymous()
  @Header('Cache-Control', 'private, no-store')
  context(@Headers('authorization') authorization?: string) {
    return this.workspaceAccess.verifyBearer(authorization);
  }
}
