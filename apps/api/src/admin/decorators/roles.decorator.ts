import { SetMetadata } from '@nestjs/common';

export enum AdminRole {
  SUPER_ADMIN = 'super_admin',
  OPERATOR = 'operator',
  AUDITOR = 'auditor',
  VIEWER = 'viewer',
}

export const ROLES_KEY = 'roles';
export const Roles = (...roles: AdminRole[]) => SetMetadata(ROLES_KEY, roles);
