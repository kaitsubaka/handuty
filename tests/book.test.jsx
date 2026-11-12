// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import es from '../src/locales/es.json';

const api = vi.hoisted(() => ({
  getService: vi.fn(),
  busySlots: vi.fn(),
  bookService: vi.fn(),
}));

vi.mock('../src/lib/amplify', () => ({
  client: {
    models: { Service: { get: api.getService } },
    queries: { busySlots: api.busySlots },
    mutations: { bookService: api.bookService },
  },
  guestClient: {},
}));
vi.mock('../src/context/Session', () => ({
  useSession: () => ({
    status: 'ready',
    profile: { role: 'CLIENT', name: 'Ana' },
    privateProfile: { address: 'Calle 10 # 5-20' },
    signOut: vi.fn(),
  }),
}));

const { default: Book } = await import('../src/pages/Book');

const SERVICE = {
  id: 's1',
  workerId: 'w1',
  workerName: 'Juan Gómez',
  category: 'PAINTING',
  pricePerHour: 20000,
  description: 'Pintura de interiores',
};

function renderBook() {
  return render(
    <IntlProvider locale="es" messages={es}>
      <MemoryRouter initialEntries={['/book/s1']}>
        <Routes>
          <Route path="/book/:serviceId" element={<Book />} />
          <Route path="/appointments" element={<p>appointments page</p>} />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

beforeEach(() => {
  api.getService.mockResolvedValue({ data: SERVICE });
  api.busySlots.mockResolvedValue({ data: [] });
  api.bookService.mockResolvedValue({ data: { id: 'b1' } });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
});

describe('Book', () => {
  it('shows the service and the total for the chosen duration', async () => {
    const user = userEvent.setup();
    renderBook();
    expect(await screen.findByText('Juan Gómez')).toBeTruthy();
    expect(screen.getByText('Calle 10 # 5-20')).toBeTruthy();
    await user.selectOptions(screen.getByLabelText(es.duration), '90');
    expect(screen.getByText((text) => text.replace(/\s/g, ' ').includes('30.000'))).toBeTruthy();
  });

  it('books the selected slot and confirms', async () => {
    const user = userEvent.setup();
    renderBook();
    await screen.findByText('Juan Gómez');
    await user.selectOptions(screen.getByLabelText(es.duration), '60');
    await user.click(screen.getByRole('button', { name: es.Book }));

    expect(api.bookService).toHaveBeenCalledTimes(1);
    const args = api.bookService.mock.calls[0][0];
    expect(args.serviceId).toBe('s1');
    expect(args.durationMinutes).toBe(60);
    const start = new Date(args.startAt);
    expect(start.getTime()).toBeGreaterThan(Date.now());
    expect(start.getMinutes() % 30).toBe(0);
    expect(await screen.findByText(es.SuccReserve)).toBeTruthy();
  });

  it('refuses a slot that overlaps a busy one without calling the API', async () => {
    const start = new Date(Date.now() + 60 * 60 * 1000);
    start.setSeconds(0, 0);
    start.setMinutes(start.getMinutes() < 30 ? 30 : 60);
    const end = new Date(start.getTime() + 2 * 60 * 60 * 1000);
    api.busySlots.mockResolvedValue({
      data: [{ startAt: start.toISOString(), endAt: end.toISOString() }],
    });
    const user = userEvent.setup();
    renderBook();
    await screen.findByText('Juan Gómez');
    expect(await screen.findByText(es.invalidDate)).toBeTruthy();
    await user.click(screen.getByRole('button', { name: es.Book }));
    expect(api.bookService).not.toHaveBeenCalled();
    expect(await screen.findByText(es['error.SLOT_TAKEN'])).toBeTruthy();
  });

  it('shows the backend rule message when booking fails', async () => {
    api.bookService.mockResolvedValue({ data: null, errors: [{ message: 'HANDUTY:SLOT_TAKEN' }] });
    const user = userEvent.setup();
    renderBook();
    await screen.findByText('Juan Gómez');
    await user.click(screen.getByRole('button', { name: es.Book }));
    expect(await screen.findByText(es['error.SLOT_TAKEN'])).toBeTruthy();
  });
});
