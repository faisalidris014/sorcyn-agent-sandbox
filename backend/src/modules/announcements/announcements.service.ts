import { Prisma } from '@prisma/client';
import { prisma } from '../../config/database.js';
import { NotFoundError } from '../../common/utils/errors.js';
import type { CreateAnnouncementInput } from './announcements.schemas.js';

export interface AnnouncementDTO {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  startsAt: string;
  endsAt: string | null;
  createdAt: string;
}

export class AnnouncementsService {
  // ── Public: active announcements ─────────────────────────

  // Returns announcements whose active window covers `now`, newest first.
  // No auth — polled/cached by the Flutter app.
  async getActiveAnnouncements(now: Date = new Date()): Promise<AnnouncementDTO[]> {
    const announcements = await prisma.systemAnnouncement.findMany({
      where: {
        startsAt: { lte: now },
        OR: [{ endsAt: null }, { endsAt: { gt: now } }],
      },
      orderBy: { startsAt: 'desc' },
    });

    return announcements.map(toDTO);
  }

  // ── Admin: create ────────────────────────────────────────

  async createAnnouncement(
    adminId: string,
    input: CreateAnnouncementInput,
  ): Promise<AnnouncementDTO> {
    const announcement = await prisma.systemAnnouncement.create({
      data: {
        message: input.message,
        severity: input.severity,
        startsAt: input.startsAt ?? undefined,
        endsAt: input.endsAt ?? null,
        createdBy: adminId,
      },
    });

    await this.logAction({
      userId: adminId,
      action: 'announcement_created',
      resourceId: announcement.id,
      details: {
        message: announcement.message,
        severity: announcement.severity,
        startsAt: announcement.startsAt.toISOString(),
        endsAt: announcement.endsAt?.toISOString() ?? null,
      },
    });

    return toDTO(announcement);
  }

  // ── Admin: clear/delete ──────────────────────────────────

  async deleteAnnouncement(adminId: string, id: string): Promise<void> {
    const existing = await prisma.systemAnnouncement.findUnique({ where: { id } });
    if (!existing) throw new NotFoundError('Announcement', id);

    await prisma.systemAnnouncement.delete({ where: { id } });

    await this.logAction({
      userId: adminId,
      action: 'announcement_cleared',
      resourceId: id,
      details: {
        message: existing.message,
        severity: existing.severity,
      },
    });
  }

  // ── Private helpers ──────────────────────────────────────

  private async logAction(params: {
    userId: string;
    action: string;
    resourceId: string;
    details?: Record<string, unknown>;
  }): Promise<void> {
    await prisma.auditLog.create({
      data: {
        userId: params.userId,
        actorType: 'admin',
        action: params.action,
        resourceType: 'announcement',
        resourceId: params.resourceId,
        details: (params.details ?? {}) as Prisma.InputJsonValue,
        success: true,
      },
    });
  }
}

function toDTO(a: {
  id: string;
  message: string;
  severity: 'info' | 'warning' | 'critical';
  startsAt: Date;
  endsAt: Date | null;
  createdAt: Date;
}): AnnouncementDTO {
  return {
    id: a.id,
    message: a.message,
    severity: a.severity,
    startsAt: a.startsAt.toISOString(),
    endsAt: a.endsAt ? a.endsAt.toISOString() : null,
    createdAt: a.createdAt.toISOString(),
  };
}
