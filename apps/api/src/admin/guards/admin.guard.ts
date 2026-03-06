import { Injectable, CanActivate, ExecutionContext, UnauthorizedException } from '@nestjs/common';
import { Reflector } from '@nestjs/core';
import { AdminRole, ROLES_KEY } from '../decorators/roles.decorator';

const ADMIN_TOKENS: Record<string, { role: AdminRole; name: string }> = {
  'admin-super-token-dev': { role: AdminRole.SUPER_ADMIN, name: 'Super Admin' },
  'admin-operator-token-dev': { role: AdminRole.OPERATOR, name: 'Operator' },
  'admin-auditor-token-dev': { role: AdminRole.AUDITOR, name: 'Auditor' },
  'admin-viewer-token-dev': { role: AdminRole.VIEWER, name: 'Viewer' },
};

const ROLE_HIERARCHY: Record<AdminRole, number> = {
  [AdminRole.SUPER_ADMIN]: 4,
  [AdminRole.OPERATOR]: 3,
  [AdminRole.AUDITOR]: 2,
  [AdminRole.VIEWER]: 1,
};

@Injectable()
export class AdminGuard implements CanActivate {
  constructor(private reflector: Reflector) {}

  canActivate(context: ExecutionContext): boolean {
    const requiredRoles = this.reflector.getAllAndOverride<AdminRole[]>(ROLES_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    const request = context.switchToHttp().getRequest();
    const token = request.headers['x-admin-token'];

    if (!token) throw new UnauthorizedException('Admin token required');

    const admin = ADMIN_TOKENS[token];
    if (!admin) throw new UnauthorizedException('Invalid admin token');

    request.admin = admin;

    if (!requiredRoles || requiredRoles.length === 0) return true;

    const adminLevel = ROLE_HIERARCHY[admin.role];
    const minRequired = Math.min(...requiredRoles.map(r => ROLE_HIERARCHY[r]));

    if (adminLevel < minRequired) {
      throw new UnauthorizedException(`Requires role: ${requiredRoles.join(' or ')}`);
    }

    return true;
  }
}
