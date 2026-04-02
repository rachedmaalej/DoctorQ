/**
 * Patient Feedback Service
 * Handles post-consultation star ratings and Google review routing.
 *
 * 4–5★ ratings → prompt patient to leave a Google review
 * 1–3★ ratings → absorbed as private feedback for the doctor
 */

import { prisma } from '../lib/prisma.js';
import { QueueStatus } from '@prisma/client';

const GOOGLE_REVIEW_THRESHOLD = 4;

// ── Submit Feedback ──

export async function submitFeedback(
  entryId: string,
  rating: number
): Promise<{
  submitted: true;
  showGooglePrompt: boolean;
  googleReviewUrl: string | null;
}> {
  const entry = await prisma.queueEntry.findUnique({
    where: { id: entryId },
    include: { clinic: { select: { id: true, googlePlaceId: true, feedbackEnabled: true } } },
  });

  if (!entry) throw Object.assign(new Error('Queue entry not found'), { status: 404 });
  if (entry.status !== QueueStatus.COMPLETED) throw Object.assign(new Error('Consultation not yet completed'), { status: 400 });
  if (!entry.clinic.feedbackEnabled) throw Object.assign(new Error('Feedback disabled'), { status: 400 });

  // Check for duplicate
  const existing = await prisma.patientFeedback.findUnique({
    where: { queueEntryId: entryId },
  });
  if (existing) throw Object.assign(new Error('Feedback already submitted'), { status: 409 });

  await prisma.patientFeedback.create({
    data: {
      clinicId: entry.clinic.id,
      queueEntryId: entryId,
      rating,
    },
  });

  const showGooglePrompt = rating >= GOOGLE_REVIEW_THRESHOLD && !!entry.clinic.googlePlaceId;
  const googleReviewUrl = showGooglePrompt
    ? `https://search.google.com/local/writereview?placeid=${entry.clinic.googlePlaceId}`
    : null;

  return { submitted: true, showGooglePrompt, googleReviewUrl };
}

// ── Record Google Click ──

export async function recordGoogleClick(entryId: string): Promise<void> {
  const feedback = await prisma.patientFeedback.findUnique({
    where: { queueEntryId: entryId },
  });
  if (!feedback) throw Object.assign(new Error('Feedback not found'), { status: 404 });

  await prisma.patientFeedback.update({
    where: { id: feedback.id },
    data: { redirectedToGoogle: true },
  });
}

// ── Feedback Summary ──

export async function getFeedbackSummary(clinicId: string) {
  const thirtyDaysAgo = new Date();
  thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

  const [allTime, last30, distribution, googleClicks, eligibleForGoogle, googleClicksLast30] =
    await Promise.all([
      prisma.patientFeedback.aggregate({
        where: { clinicId },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.patientFeedback.aggregate({
        where: { clinicId, createdAt: { gte: thirtyDaysAgo } },
        _avg: { rating: true },
        _count: true,
      }),
      prisma.patientFeedback.groupBy({
        by: ['rating'],
        where: { clinicId },
        _count: true,
      }),
      prisma.patientFeedback.count({
        where: { clinicId, redirectedToGoogle: true },
      }),
      prisma.patientFeedback.count({
        where: { clinicId, rating: { gte: GOOGLE_REVIEW_THRESHOLD } },
      }),
      prisma.patientFeedback.count({
        where: { clinicId, redirectedToGoogle: true, createdAt: { gte: thirtyDaysAgo } },
      }),
    ]);

  const dist: Record<number, number> = { 1: 0, 2: 0, 3: 0, 4: 0, 5: 0 };
  distribution.forEach((d) => {
    dist[d.rating] = d._count;
  });

  return {
    totalRatings: allTime._count,
    averageRating: Math.round((allTime._avg.rating ?? 0) * 10) / 10,
    distribution: dist,
    googleRedirects: googleClicks,
    googleConversionRate: eligibleForGoogle > 0
      ? Math.round((googleClicks / eligibleForGoogle) * 100)
      : 0,
    last30Days: {
      totalRatings: last30._count,
      averageRating: Math.round((last30._avg.rating ?? 0) * 10) / 10,
      googleRedirects: googleClicksLast30,
    },
  };
}
