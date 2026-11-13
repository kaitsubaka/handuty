// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter } from 'react-router-dom';
import en from '../src/locales/en.json';

const queries = vi.hoisted(() => ({ myBookings: vi.fn() }));

vi.mock('../src/lib/amplify', () => ({ client: { mutations: {} }, guestClient: {} }));
vi.mock('../src/lib/queries', () => queries);
vi.mock('../src/context/Session', () => ({
  useSession: () => ({
    status: 'ready',
    profile: { role: 'CLIENT', name: 'Ana' },
    signOut: vi.fn(),
  }),
}));

const { default: Appointments } = await import('../src/pages/Appointments');

function renderAppointments() {
  return render(
    <IntlProvider locale="en" messages={en}>
      <MemoryRouter>
        <Appointments />
      </MemoryRouter>
    </IntlProvider>,
  );
}

beforeEach(() => {
  queries.myBookings.mockResolvedValue([]);
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Appointments', () => {
  it('switches between upcoming and past with the words next to the switch', async () => {
    renderAppointments();
    const user = userEvent.setup();
    const switchBox = screen.getByRole('checkbox');
    expect(switchBox.checked).toBe(false);

    await user.click(screen.getByRole('button', { name: 'past' }));
    expect(switchBox.checked).toBe(true);
    expect(queries.myBookings).toHaveBeenLastCalledWith(expect.anything(), { upcoming: false });

    await user.click(screen.getByRole('button', { name: 'past' }));
    expect(switchBox.checked).toBe(true);

    await user.click(screen.getByRole('button', { name: 'upcoming' }));
    expect(switchBox.checked).toBe(false);
    expect(queries.myBookings).toHaveBeenLastCalledWith(expect.anything(), { upcoming: true });
  });
});
