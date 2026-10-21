// app/api/auditLogs.ts
import { api } from './client';

export interface AuditLogInfo {
  id: number;
  actorName: string;
  action:
    | 'WITHDRAWAL_APPROVED' | 'WITHDRAWAL_REJECTED'
    | 'SUPERVISOR_PROMOTED' | 'SUPERVISOR_REVOKED'
    | 'USER_BLOCKED' | 'USER_UNBLOCKED' | 'USER_ROLE_CHANGED'
    | 'INCIDENT_STATUS_CHANGED'
    | 'TONTINE_STATUS_CHANGED' | 'MESSAGE_DELETED' | 'ANNOUNCEMENT_BROADCAST';
  targetType: string;
  targetId: number;
  details: string;
  createdAt: string;
}

export function list() {
  return api.get<AuditLogInfo[]>('/admin/audit-logs');
}
