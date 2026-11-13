export const CATEGORIES = [
  'CARPENTRY',
  'LOCKSMITH',
  'ELECTRICIAN',
  'FUMIGATION',
  'GARDENING',
  'CLEANING',
  'PETS',
  'MAINTENANCE',
  'PAINTING',
  'PLUMBING',
  'SECURITY',
] as const;

export type Category = (typeof CATEGORIES)[number];

export const ROLES = ['CLIENT', 'WORKER'] as const;

export type Role = (typeof ROLES)[number];

export const DURATIONS_MINUTES = [30, 60, 90, 120] as const;

export const MAX_DURATION_MINUTES = 120;

export const SLOT_MINUTES = 30;

export const MIN_PRICE_PER_HOUR = 1000;

export const MAX_PRICE_PER_HOUR = 10_000_000;

/** Bookings can be made at most this far ahead. */
export const MAX_BOOKING_DAYS = 90;

/** Upcoming bookings one client can hold at the same time. */
export const MAX_UPCOMING_BOOKINGS = 10;

/** Messages one participant can send to one chat per minute. */
export const MAX_MESSAGES_PER_MINUTE = 10;

export const ADULT_AGE = 18;

const MINUTE_MS = 60 * 1000;

const DAY_MS = 24 * 60 * MINUTE_MS;

/**
 * A broken business rule. The message travels to the client as `HANDUTY:<code>` so the UI can
 * show a translated text instead of the raw error.
 */
export class RuleError extends Error {
  readonly code: string;

  constructor(code: string) {
    super(`HANDUTY:${code}`);
    this.code = code;
  }
}

function ensure(condition: unknown, code: string): asserts condition {
  if (!condition) {
    throw new RuleError(code);
  }
}

function textLength(value: string | null | undefined): number {
  return (value ?? '').trim().length;
}

export function ageInYears(birthDate: string, now: Date): number {
  const birth = new Date(`${birthDate}T00:00:00Z`);
  ensure(!Number.isNaN(birth.getTime()), 'INVALID_BIRTH_DATE');
  let age = now.getUTCFullYear() - birth.getUTCFullYear();
  const beforeBirthday =
    now.getUTCMonth() < birth.getUTCMonth() ||
    (now.getUTCMonth() === birth.getUTCMonth() && now.getUTCDate() < birth.getUTCDate());
  if (beforeBirthday) {
    age -= 1;
  }
  return age;
}

export type ProfileInput = {
  name: string;
  role: string;
  city: string;
  phone: string;
  idNumber: string;
  birthDate: string;
  address: string;
};

export function assertContactInput(input: { city: string; phone: string; address: string }): void {
  ensure(textLength(input.city) >= 1 && textLength(input.city) <= 80, 'INVALID_CITY');
  ensure(/^\+?[0-9]{7,15}$/.test(input.phone.trim()), 'INVALID_PHONE');
  ensure(textLength(input.address) >= 1 && textLength(input.address) <= 160, 'INVALID_ADDRESS');
}

export function assertProfileInput(input: ProfileInput, now: Date): void {
  ensure(textLength(input.name) >= 1 && textLength(input.name) <= 80, 'INVALID_NAME');
  ensure((ROLES as readonly string[]).includes(input.role), 'INVALID_ROLE');
  ensure(/^[0-9]{7,15}$/.test(input.idNumber.trim()), 'INVALID_ID_NUMBER');
  ensure(ageInYears(input.birthDate, now) >= ADULT_AGE, 'UNDERAGE');
  assertContactInput(input);
}

export function assertServiceInput(input: {
  category: string;
  pricePerHour: number;
  description: string;
}): void {
  ensure((CATEGORIES as readonly string[]).includes(input.category), 'INVALID_CATEGORY');
  ensure(
    Number.isInteger(input.pricePerHour) &&
      input.pricePerHour >= MIN_PRICE_PER_HOUR &&
      input.pricePerHour <= MAX_PRICE_PER_HOUR,
    'INVALID_PRICE',
  );
  ensure(
    textLength(input.description) >= 10 && textLength(input.description) <= 160,
    'INVALID_DESCRIPTION',
  );
}

export type Interval = { start: Date; end: Date };

export function bookingInterval(startAt: string, durationMinutes: number, now: Date): Interval {
  const start = new Date(startAt);
  ensure(!Number.isNaN(start.getTime()), 'INVALID_START');
  ensure(
    start.getUTCSeconds() === 0 &&
      start.getUTCMilliseconds() === 0 &&
      start.getUTCMinutes() % SLOT_MINUTES === 0,
    'INVALID_START',
  );
  ensure(start.getTime() > now.getTime(), 'START_IN_PAST');
  ensure(start.getTime() <= now.getTime() + MAX_BOOKING_DAYS * DAY_MS, 'START_TOO_FAR');
  ensure((DURATIONS_MINUTES as readonly number[]).includes(durationMinutes), 'INVALID_DURATION');
  return { start, end: new Date(start.getTime() + durationMinutes * MINUTE_MS) };
}

/** Earliest start of a booking that could still overlap `interval`. */
export function overlapSearchFrom(interval: Interval): Date {
  return new Date(interval.start.getTime() - MAX_DURATION_MINUTES * MINUTE_MS);
}

export function overlaps(a: Interval, b: Interval): boolean {
  return a.start.getTime() < b.end.getTime() && b.start.getTime() < a.end.getTime();
}

export function assertNoOverlap(
  interval: Interval,
  existing: ReadonlyArray<{ startAt: string; endAt: string }>,
): void {
  const clash = existing.some((booking) =>
    overlaps(interval, { start: new Date(booking.startAt), end: new Date(booking.endAt) }),
  );
  ensure(!clash, 'SLOT_TAKEN');
}

/** Keeps one account from filling every worker's calendar. */
export function assertBookingQuota(upcomingBookings: number): void {
  ensure(upcomingBookings < MAX_UPCOMING_BOOKINGS, 'TOO_MANY_BOOKINGS');
}

/** Start of the window in which `assertMessageRate` counts messages. */
export function messageRateWindowStart(now: Date): Date {
  return new Date(now.getTime() - MINUTE_MS);
}

/** Keeps one account from flooding a chat (and the bill) with messages. */
export function assertMessageRate(sentInLastMinute: number): void {
  ensure(sentInLastMinute < MAX_MESSAGES_PER_MINUTE, 'TOO_MANY_MESSAGES');
}

export function bookingPrice(pricePerHour: number, durationMinutes: number): number {
  return Math.round((pricePerHour * durationMinutes) / 60);
}

export function assertCanCancel(
  booking: { clientId: string; startAt: string },
  callerId: string,
  now: Date,
): void {
  ensure(booking.clientId === callerId, 'FORBIDDEN');
  ensure(new Date(booking.startAt).getTime() > now.getTime(), 'BOOKING_STARTED');
}

export function assertCanRate(
  booking: { clientId: string; endAt: string; rating?: number | null },
  callerId: string,
  rating: number,
  now: Date,
): void {
  ensure(booking.clientId === callerId, 'FORBIDDEN');
  ensure(new Date(booking.endAt).getTime() <= now.getTime(), 'BOOKING_NOT_FINISHED');
  ensure(booking.rating == null, 'ALREADY_RATED');
  ensure(Number.isInteger(rating) && rating >= 1 && rating <= 5, 'INVALID_RATING');
}

export function applyRating(
  service: { ratingSum: number; ratingCount: number },
  rating: number,
): { ratingSum: number; ratingCount: number; rating: number } {
  const ratingSum = service.ratingSum + rating;
  const ratingCount = service.ratingCount + 1;
  return { ratingSum, ratingCount, rating: Math.round((ratingSum / ratingCount) * 10) / 10 };
}

export const MAX_MESSAGE_LENGTH = 1000;

export function normalizeMessage(content: string): string {
  const trimmed = content.trim();
  ensure(trimmed.length >= 1 && trimmed.length <= MAX_MESSAGE_LENGTH, 'INVALID_MESSAGE');
  return trimmed;
}

export function chatIdFor(clientId: string, workerId: string): string {
  return `${clientId}_${workerId}`;
}
