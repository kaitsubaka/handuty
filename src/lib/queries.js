import { client } from './amplify';
import { unwrap } from './api';
import { nowIso } from './dates';
import { ROLES } from '../constants/roles';

const PAGE = 100;

export async function all(query) {
  const items = [];
  let nextToken;
  do {
    const page = await query(nextToken);
    items.push(...unwrap(page));
    nextToken = page.nextToken;
  } while (nextToken);
  return items;
}

/** Bookings of the signed-in user, upcoming (soonest first) or past (latest first). */
export function myBookings(session, { upcoming }) {
  const isClient = session.profile.role === ROLES.CLIENT;
  const index = isClient
    ? client.models.Booking.bookingsByClient
    : client.models.Booking.bookingsByWorker;
  const key = isClient ? { clientId: session.userId } : { workerId: session.userId };
  const now = nowIso();
  return all((nextToken) =>
    index(
      { ...key, startAt: upcoming ? { gt: now } : { le: now } },
      { sortDirection: upcoming ? 'ASC' : 'DESC', limit: PAGE, nextToken },
    ),
  );
}

/** Chats of the signed-in user, most recent activity first. */
export function myChats(session) {
  const isClient = session.profile.role === ROLES.CLIENT;
  const index = isClient ? client.models.Chat.chatsByClient : client.models.Chat.chatsByWorker;
  const key = isClient ? { clientId: session.userId } : { workerId: session.userId };
  return all((nextToken) => index(key, { sortDirection: 'DESC', limit: PAGE, nextToken }));
}

export function myServices(session) {
  return all((nextToken) =>
    client.models.Service.servicesByWorker(
      { workerId: session.userId },
      { limit: PAGE, nextToken },
    ),
  );
}
