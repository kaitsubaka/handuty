import { client } from './amplify';
import { run } from './api';
import { fromAwsDate, toAwsDate } from './dates';

const KEY = 'handuty.pendingProfile';

/**
 * The profile typed during sign-up is kept for the tab's lifetime, so a user who reloads while
 * confirming the email code does not have to type it again.
 */
export function savePendingProfile(profile) {
  const { name, role, city, address, phone, idNumber, birthDate } = profile;
  try {
    sessionStorage.setItem(
      KEY,
      JSON.stringify({
        name,
        role,
        city,
        address,
        phone,
        idNumber,
        birthDate: toAwsDate(birthDate),
      }),
    );
  } catch (error) {
    console.warn('[profile] could not keep the pending profile', error);
  }
}

export function loadPendingProfile() {
  try {
    const value = sessionStorage.getItem(KEY);
    if (!value) {
      return null;
    }
    const profile = JSON.parse(value);
    return { ...profile, birthDate: fromAwsDate(profile.birthDate) };
  } catch {
    return null;
  }
}

function clearPendingProfile() {
  try {
    sessionStorage.removeItem(KEY);
  } catch (error) {
    console.warn('[profile] could not clear the pending profile', error);
  }
}

export async function createProfile(profile) {
  const created = await run(
    client.mutations.registerProfile({
      name: profile.name.trim(),
      role: profile.role,
      city: profile.city.trim(),
      address: profile.address.trim(),
      phone: profile.phone.trim(),
      idNumber: profile.idNumber.trim(),
      birthDate: toAwsDate(profile.birthDate),
    }),
  );
  clearPendingProfile();
  return created;
}
