const MINUTE_MS = 60 * 1000;

export function durationMinutes(startAt, endAt) {
  return Math.round((new Date(endAt).getTime() - new Date(startAt).getTime()) / MINUTE_MS);
}

export function nowIso() {
  return new Date().toISOString();
}

/** `YYYY-MM-DD` of a local calendar date, the format of an AWSDate. */
export function toAwsDate(date) {
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${date.getFullYear()}-${month}-${day}`;
}

export function fromAwsDate(value) {
  const [year, month, day] = value.split('-').map(Number);
  return new Date(year, month - 1, day);
}

export function isAdult(date, now = new Date()) {
  const eighteenth = new Date(date.getFullYear() + 18, date.getMonth(), date.getDate());
  return eighteenth <= now;
}

/** Next 30-minute boundary at least `leadMinutes` from now. */
export function nextSlot(leadMinutes = 60) {
  const slot = new Date(Date.now() + leadMinutes * MINUTE_MS);
  slot.setSeconds(0, 0);
  slot.setMinutes(slot.getMinutes() < 30 ? 30 : 60);
  return slot;
}

export function overlaps(startA, endA, startB, endB) {
  return startA < endB && startB < endA;
}
