import "server-only";
import { prisma } from "@/lib/prisma";
import type { TimelineEventType } from "@prisma/client";

export async function logTimelineEvent(args: {
  patientId: string;
  type: TimelineEventType;
  title: string;
  description?: string | null;
  refId?: string | null;
  authorId?: string | null;
  occurredAt?: Date;
}) {
  return prisma.patientTimelineEvent.create({
    data: {
      patientId: args.patientId,
      type: args.type,
      title: args.title,
      description: args.description ?? null,
      refId: args.refId ?? null,
      authorId: args.authorId ?? null,
      occurredAt: args.occurredAt ?? new Date(),
    },
  });
}
