import type { AppSyncIdentityCognito, AppSyncResolverEvent } from 'aws-lambda';
import { Amplify } from 'aws-amplify';
import { generateClient } from 'aws-amplify/data';
import { getAmplifyDataClientConfig } from '@aws-amplify/backend/function/runtime';
import { env } from '$amplify/env/api';
import type { Schema } from '../../data/resource';
import {
  RuleError,
  applyRating,
  assertCanCancel,
  assertCanRate,
  assertContactInput,
  assertNoOverlap,
  assertProfileInput,
  assertServiceInput,
  bookingInterval,
  bookingPrice,
  chatIdFor,
  normalizeMessage,
  overlapSearchFrom,
  type Category,
  type ProfileInput,
  type Role,
} from './rules';

const { resourceConfig, libraryOptions } = await getAmplifyDataClientConfig(env);
Amplify.configure(resourceConfig, libraryOptions);

const client = generateClient<Schema>({ authMode: 'iam' });

type Args = Record<string, unknown>;

type Context = { callerId: string; now: Date };

type Result<T> = { data: T | null; errors?: ReadonlyArray<{ message: string }> };

/** Unwraps a data client result; a GraphQL error here is a server fault, not a user mistake. */
function must<T>(operation: string, result: Result<T>): T | null {
  if (result.errors?.length) {
    console.error('[api] data operation failed', operation, JSON.stringify(result.errors));
    throw new Error(`HANDUTY:INTERNAL`);
  }
  return result.data;
}

function found<T>(value: T | null | undefined, code: string): T {
  if (value == null) {
    throw new RuleError(code);
  }
  return value;
}

async function profileOf(userId: string) {
  return found(must('getProfile', await client.models.Profile.get({ userId })), 'PROFILE_REQUIRED');
}

async function requireRole(userId: string, role: Role) {
  const profile = await profileOf(userId);
  if (profile.role !== role) {
    throw new RuleError('FORBIDDEN');
  }
  return profile;
}

async function registerProfile(args: Args, { callerId, now }: Context) {
  const input = args as ProfileInput;
  assertProfileInput(input, now);
  const existing = must('getProfile', await client.models.Profile.get({ userId: callerId }));
  if (existing) {
    throw new RuleError('PROFILE_EXISTS');
  }
  must(
    'createPrivateProfile',
    await client.models.PrivateProfile.create({
      userId: callerId,
      phone: input.phone.trim(),
      idNumber: input.idNumber.trim(),
      birthDate: input.birthDate,
      address: input.address.trim(),
    }),
  );
  return must(
    'registerProfile',
    await client.models.Profile.create({
      userId: callerId,
      name: input.name.trim(),
      role: input.role as Role,
      city: input.city.trim(),
    }),
  );
}

async function editProfile(args: Args, { callerId }: Context) {
  const input = args as { city: string; phone: string; address: string };
  assertContactInput(input);
  await profileOf(callerId);
  must(
    'updatePrivateProfile',
    await client.models.PrivateProfile.update({
      userId: callerId,
      phone: input.phone.trim(),
      address: input.address.trim(),
    }),
  );
  return must(
    'editProfile',
    await client.models.Profile.update({ userId: callerId, city: input.city.trim() }),
  );
}

async function saveService(args: Args, { callerId }: Context) {
  const input = args as {
    id?: string | null;
    category: Category;
    pricePerHour: number;
    description: string;
  };
  assertServiceInput(input);
  const worker = await requireRole(callerId, 'WORKER');
  const own =
    must(
      'servicesByWorker',
      await client.models.Service.servicesByWorker({ workerId: callerId }),
    ) ?? [];
  const sameCategory = own.find(
    (service) => service.category === input.category && service.id !== input.id,
  );
  if (sameCategory) {
    throw new RuleError('CATEGORY_TAKEN');
  }
  const fields = {
    category: input.category,
    pricePerHour: input.pricePerHour,
    description: input.description.trim(),
  };
  if (input.id) {
    const current = found(
      own.find((service) => service.id === input.id),
      'SERVICE_NOT_FOUND',
    );
    return must('updateService', await client.models.Service.update({ id: current.id, ...fields }));
  }
  return must(
    'createService',
    await client.models.Service.create({
      ...fields,
      workerId: callerId,
      workerName: worker.name,
      ratingSum: 0,
      ratingCount: 0,
    }),
  );
}

async function removeService(args: Args, { callerId, now }: Context) {
  const { id } = args as { id: string };
  const service = found(
    must('getService', await client.models.Service.get({ id })),
    'SERVICE_NOT_FOUND',
  );
  if (service.workerId !== callerId) {
    throw new RuleError('FORBIDDEN');
  }
  const upcoming =
    must(
      'bookingsByService',
      await client.models.Booking.bookingsByService(
        { serviceId: id, startAt: { gt: now.toISOString() } },
        { limit: 1 },
      ),
    ) ?? [];
  if (upcoming.length > 0) {
    throw new RuleError('SERVICE_HAS_BOOKINGS');
  }
  must('removeService', await client.models.Service.delete({ id }));
  return id;
}

async function bookService(args: Args, { callerId, now }: Context) {
  const input = args as { serviceId: string; startAt: string; durationMinutes: number };
  const interval = bookingInterval(input.startAt, input.durationMinutes, now);
  const clientProfile = await requireRole(callerId, 'CLIENT');
  const service = found(
    must('getService', await client.models.Service.get({ id: input.serviceId })),
    'SERVICE_NOT_FOUND',
  );
  const nearby =
    must(
      'bookingsByService',
      await client.models.Booking.bookingsByService({
        serviceId: service.id,
        startAt: {
          between: [overlapSearchFrom(interval).toISOString(), interval.end.toISOString()],
        },
      }),
    ) ?? [];
  assertNoOverlap(interval, nearby);
  const privateProfile = found(
    must('getPrivateProfile', await client.models.PrivateProfile.get({ userId: callerId })),
    'PROFILE_REQUIRED',
  );
  const booking = must(
    'createBooking',
    await client.models.Booking.create({
      serviceId: service.id,
      clientId: callerId,
      workerId: service.workerId,
      clientName: clientProfile.name,
      workerName: service.workerName,
      category: service.category,
      address: privateProfile.address,
      startAt: interval.start.toISOString(),
      endAt: interval.end.toISOString(),
      price: bookingPrice(service.pricePerHour, input.durationMinutes),
    }),
  );
  console.info('[api] booking created', booking?.id, 'service', service.id);
  return booking;
}

async function busySlots(args: Args, { now }: Context) {
  const { serviceId } = args as { serviceId: string };
  const from = overlapSearchFrom({ start: now, end: now }).toISOString();
  const bookings =
    must(
      'bookingsByService',
      await client.models.Booking.bookingsByService(
        { serviceId, startAt: { gt: from } },
        { selectionSet: ['startAt', 'endAt'], limit: 1000 },
      ),
    ) ?? [];
  return bookings.map(({ startAt, endAt }) => ({ startAt, endAt }));
}

async function cancelBooking(args: Args, { callerId, now }: Context) {
  const { id } = args as { id: string };
  const booking = found(
    must('getBooking', await client.models.Booking.get({ id })),
    'BOOKING_NOT_FOUND',
  );
  assertCanCancel(booking, callerId, now);
  must('deleteBooking', await client.models.Booking.delete({ id }));
  return id;
}

async function rateBooking(args: Args, { callerId, now }: Context) {
  const { id, rating } = args as { id: string; rating: number };
  const booking = found(
    must('getBooking', await client.models.Booking.get({ id })),
    'BOOKING_NOT_FOUND',
  );
  assertCanRate(booking, callerId, rating, now);
  const rated = must('updateBooking', await client.models.Booking.update({ id, rating }));
  const service = must('getService', await client.models.Service.get({ id: booking.serviceId }));
  if (service) {
    must(
      'updateService',
      await client.models.Service.update({ id: service.id, ...applyRating(service, rating) }),
    );
  } else {
    console.warn('[api] rated a booking whose service was deleted', id);
  }
  return rated;
}

async function openChat(args: Args, { callerId, now }: Context) {
  const { workerId } = args as { workerId: string };
  const clientProfile = await requireRole(callerId, 'CLIENT');
  const worker = found(
    must('getProfile', await client.models.Profile.get({ userId: workerId })),
    'WORKER_NOT_FOUND',
  );
  if (worker.role !== 'WORKER') {
    throw new RuleError('WORKER_NOT_FOUND');
  }
  const id = chatIdFor(callerId, workerId);
  const existing = must('getChat', await client.models.Chat.get({ id }));
  if (existing) {
    return existing;
  }
  return must(
    'createChat',
    await client.models.Chat.create({
      id,
      clientId: callerId,
      workerId,
      clientName: clientProfile.name,
      workerName: worker.name,
      participants: [callerId, workerId],
      lastMessageAt: now.toISOString(),
    }),
  );
}

async function sendMessage(args: Args, { callerId, now }: Context) {
  const { chatId, content } = args as { chatId: string; content: string };
  const text = normalizeMessage(content);
  const chat = found(
    must('getChat', await client.models.Chat.get({ id: chatId })),
    'CHAT_NOT_FOUND',
  );
  if (!chat.participants.includes(callerId)) {
    throw new RuleError('FORBIDDEN');
  }
  const sentAt = now.toISOString();
  const message = must(
    'createMessage',
    await client.models.Message.create({
      chatId,
      senderId: callerId,
      content: text,
      sentAt,
      participants: chat.participants,
    }),
  );
  must(
    'updateChat',
    await client.models.Chat.update({ id: chatId, lastMessage: text, lastMessageAt: sentAt }),
  );
  return message;
}

const resolvers: Record<string, (args: Args, context: Context) => Promise<unknown>> = {
  busySlots,
  registerProfile,
  editProfile,
  saveService,
  removeService,
  bookService,
  cancelBooking,
  rateBooking,
  openChat,
  sendMessage,
};

export const handler = async (event: AppSyncResolverEvent<Args>) => {
  const field = event.info.fieldName;
  const resolver = resolvers[field];
  if (!resolver) {
    console.error('[api] no resolver for field', field);
    throw new Error('HANDUTY:INTERNAL');
  }
  const identity = event.identity as AppSyncIdentityCognito | null;
  if (!identity?.sub) {
    throw new RuleError('UNAUTHENTICATED');
  }
  try {
    return await resolver(event.arguments, { callerId: identity.sub, now: new Date() });
  } catch (error) {
    if (error instanceof RuleError) {
      console.info('[api] rule rejected', field, error.code);
    } else {
      console.error('[api] unexpected failure', field, error);
    }
    throw error;
  }
};
