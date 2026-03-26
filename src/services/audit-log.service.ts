import AuditLog from "@/models/AuditLog";

interface CreateAuditLogInput {
  actorId?: string;
  action: string;
  targetType: string;
  targetId?: string;
  metadata?: Record<string, unknown>;
  ip?: string;
  userAgent?: string;
}

class AuditLogService {
  private static instance: AuditLogService;

  private constructor() {}

  static getInstance(): AuditLogService {
    if (!AuditLogService.instance) {
      AuditLogService.instance = new AuditLogService();
    }
    return AuditLogService.instance;
  }

  async create(input: CreateAuditLogInput) {
    return AuditLog.create(input);
  }
}

export const auditLogService = AuditLogService.getInstance();
