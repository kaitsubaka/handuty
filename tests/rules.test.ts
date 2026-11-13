import { describe, expect, it } from 'vitest';
import {
  RuleError,
  ageInYears,
  MAX_MESSAGES_PER_MINUTE,
  MAX_UPCOMING_BOOKINGS,
  applyRating,
  assertBookingQuota,
  assertCanCancel,
  assertCanRate,
  assertMessageRate,
  assertNoOverlap,
  assertProfileInput,
  assertServiceInput,
  bookingInterval,
  bookingPrice,
  chatIdFor,
  messageRateWindowStart,
  normalizeMessage,
  overlapSearchFrom,
} from '../amplify/functions/api/rules';

const NOW = new Date('2026-11-12T15:10:00Z');

function codeOf(run: () => unknown): string | undefined {
  try {
    run();
  } catch (error) {
    if (error instanceof RuleError) {
      return error.code;
    }
    throw error;
  }
  return undefined;
}

const validProfile = {
  name: 'Ana Pérez',
  role: 'CLIENT',
  city: 'Bogotá',
  phone: '3001234567',
  idNumber: '1020304050',
  birthDate: '1990-05-20',
  address: 'Calle 10 # 5-20',
};

describe('ageInYears', () => {
  it('counts a birthday later this year as not reached yet', () => {
    expect(ageInYears('2008-11-13', NOW)).toBe(17);
    expect(ageInYears('2008-11-12', NOW)).toBe(18);
  });

  it('rejects an invalid date', () => {
    expect(codeOf(() => ageInYears('not-a-date', NOW))).toBe('INVALID_BIRTH_DATE');
  });
});

describe('assertProfileInput', () => {
  it('accepts a valid adult profile', () => {
    expect(codeOf(() => assertProfileInput(validProfile, NOW))).toBeUndefined();
  });

  it.each([
    [{ birthDate: '2010-01-01' }, 'UNDERAGE'],
    [{ role: 'ADMIN' }, 'INVALID_ROLE'],
    [{ name: '   ' }, 'INVALID_NAME'],
    [{ phone: '12ab' }, 'INVALID_PHONE'],
    [{ idNumber: '123' }, 'INVALID_ID_NUMBER'],
    [{ address: '' }, 'INVALID_ADDRESS'],
    [{ city: '' }, 'INVALID_CITY'],
  ])('rejects %o with %s', (override, code) => {
    expect(codeOf(() => assertProfileInput({ ...validProfile, ...override }, NOW))).toBe(code);
  });
});

describe('assertServiceInput', () => {
  const valid = { category: 'PAINTING', pricePerHour: 25000, description: 'Interior painting' };

  it('accepts a valid service', () => {
    expect(codeOf(() => assertServiceInput(valid))).toBeUndefined();
  });

  it.each([
    [{ category: 'Pintura' }, 'INVALID_CATEGORY'],
    [{ pricePerHour: 999 }, 'INVALID_PRICE'],
    [{ pricePerHour: 1500.5 }, 'INVALID_PRICE'],
    [{ pricePerHour: 10_000_001 }, 'INVALID_PRICE'],
    [{ description: 'short' }, 'INVALID_DESCRIPTION'],
    [{ description: 'x'.repeat(161) }, 'INVALID_DESCRIPTION'],
  ])('rejects %o with %s', (override, code) => {
    expect(codeOf(() => assertServiceInput({ ...valid, ...override }))).toBe(code);
  });
});

describe('bookingInterval', () => {
  it('builds the interval of a valid slot', () => {
    const interval = bookingInterval('2026-11-13T14:30:00.000Z', 90, NOW);
    expect(interval.end.toISOString()).toBe('2026-11-13T16:00:00.000Z');
  });

  it.each([
    ['2026-11-12T15:00:00.000Z', 30, 'START_IN_PAST'],
    ['2026-11-13T14:15:00.000Z', 30, 'INVALID_START'],
    ['garbage', 30, 'INVALID_START'],
    ['2026-11-13T14:00:00.000Z', 45, 'INVALID_DURATION'],
    ['2027-02-11T15:30:00.000Z', 30, 'START_TOO_FAR'],
  ])('rejects %s for %d min with %s', (startAt, duration, code) => {
    expect(codeOf(() => bookingInterval(startAt, duration, NOW))).toBe(code);
  });

  it('accepts a start exactly 90 days ahead', () => {
    expect(codeOf(() => bookingInterval('2027-02-10T15:00:00.000Z', 30, NOW))).toBeUndefined();
  });

  it('searches far enough back to catch the longest booking', () => {
    const interval = bookingInterval('2026-11-13T14:00:00.000Z', 30, NOW);
    expect(overlapSearchFrom(interval).toISOString()).toBe('2026-11-13T12:00:00.000Z');
  });
});

describe('assertNoOverlap', () => {
  const interval = bookingInterval('2026-11-13T14:00:00.000Z', 60, NOW);

  it('allows back-to-back bookings', () => {
    const existing = [
      { startAt: '2026-11-13T13:00:00.000Z', endAt: '2026-11-13T14:00:00.000Z' },
      { startAt: '2026-11-13T15:00:00.000Z', endAt: '2026-11-13T16:00:00.000Z' },
    ];
    expect(codeOf(() => assertNoOverlap(interval, existing))).toBeUndefined();
  });

  it('rejects a booking that starts earlier and runs into the slot', () => {
    const existing = [{ startAt: '2026-11-13T12:30:00.000Z', endAt: '2026-11-13T14:30:00.000Z' }];
    expect(codeOf(() => assertNoOverlap(interval, existing))).toBe('SLOT_TAKEN');
  });

  it('rejects a booking inside the slot', () => {
    const existing = [{ startAt: '2026-11-13T14:30:00.000Z', endAt: '2026-11-13T15:00:00.000Z' }];
    expect(codeOf(() => assertNoOverlap(interval, existing))).toBe('SLOT_TAKEN');
  });
});

describe('bookingPrice', () => {
  it('charges the hourly price pro rata', () => {
    expect(bookingPrice(20000, 30)).toBe(10000);
    expect(bookingPrice(25000, 90)).toBe(37500);
  });
});

describe('assertCanCancel', () => {
  const booking = { clientId: 'client', startAt: '2026-11-13T14:00:00.000Z' };

  it('lets the client cancel before the start', () => {
    expect(codeOf(() => assertCanCancel(booking, 'client', NOW))).toBeUndefined();
  });

  it('refuses another user and a started booking', () => {
    expect(codeOf(() => assertCanCancel(booking, 'worker', NOW))).toBe('FORBIDDEN');
    expect(codeOf(() => assertCanCancel(booking, 'client', new Date('2026-11-13T14:00:00Z')))).toBe(
      'BOOKING_STARTED',
    );
  });
});

describe('assertCanRate', () => {
  const finished = { clientId: 'client', endAt: '2026-11-12T15:00:00.000Z', rating: null };

  it('lets the client rate a finished booking once', () => {
    expect(codeOf(() => assertCanRate(finished, 'client', 5, NOW))).toBeUndefined();
  });

  it.each([
    [finished, 'worker', 4, 'FORBIDDEN'],
    [{ ...finished, endAt: '2026-11-12T16:00:00.000Z' }, 'client', 4, 'BOOKING_NOT_FINISHED'],
    [{ ...finished, rating: 3 }, 'client', 4, 'ALREADY_RATED'],
    [finished, 'client', 6, 'INVALID_RATING'],
    [finished, 'client', 0, 'INVALID_RATING'],
  ])('rejects case %#', (booking, caller, rating, code) => {
    expect(codeOf(() => assertCanRate(booking, caller, rating, NOW))).toBe(code);
  });
});

describe('applyRating', () => {
  it('keeps a running average rounded to one decimal', () => {
    expect(applyRating({ ratingSum: 0, ratingCount: 0 }, 5)).toEqual({
      ratingSum: 5,
      ratingCount: 1,
      rating: 5,
    });
    expect(applyRating({ ratingSum: 9, ratingCount: 2 }, 4)).toEqual({
      ratingSum: 13,
      ratingCount: 3,
      rating: 4.3,
    });
  });
});

describe('messages and chats', () => {
  it('trims messages and enforces their length', () => {
    expect(normalizeMessage('  hola  ')).toBe('hola');
    expect(codeOf(() => normalizeMessage('   '))).toBe('INVALID_MESSAGE');
    expect(codeOf(() => normalizeMessage('x'.repeat(1001)))).toBe('INVALID_MESSAGE');
  });

  it('gives one chat id per client and worker pair', () => {
    expect(chatIdFor('c1', 'w1')).toBe(chatIdFor('c1', 'w1'));
    expect(chatIdFor('c1', 'w1')).not.toBe(chatIdFor('w1', 'c1'));
  });
});

describe('abuse limits', () => {
  it('lets a client hold up to the maximum of upcoming bookings', () => {
    expect(codeOf(() => assertBookingQuota(MAX_UPCOMING_BOOKINGS - 1))).toBeUndefined();
    expect(codeOf(() => assertBookingQuota(MAX_UPCOMING_BOOKINGS))).toBe('TOO_MANY_BOOKINGS');
  });

  it('limits the messages one participant sends to a chat per minute', () => {
    expect(codeOf(() => assertMessageRate(MAX_MESSAGES_PER_MINUTE - 1))).toBeUndefined();
    expect(codeOf(() => assertMessageRate(MAX_MESSAGES_PER_MINUTE))).toBe('TOO_MANY_MESSAGES');
  });

  it('counts messages from the last minute', () => {
    expect(messageRateWindowStart(NOW).toISOString()).toBe('2026-11-12T15:09:00.000Z');
  });
});
