// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import es from '../src/locales/es.json';

const auth = vi.hoisted(() => ({
  signUp: vi.fn(),
  confirmSignUp: vi.fn(),
  signIn: vi.fn(),
  resendSignUpCode: vi.fn(),
}));
const mutations = vi.hoisted(() => ({ createProfile: vi.fn() }));
const session = vi.hoisted(() => ({ status: 'signedOut', refresh: vi.fn() }));

vi.mock('aws-amplify/auth', () => auth);
vi.mock('../src/lib/amplify', () => ({ client: { mutations }, guestClient: {} }));
vi.mock('../src/context/Session', () => ({ useSession: () => session }));

const { default: Register } = await import('../src/pages/Register');

function renderRegister() {
  return render(
    <IntlProvider locale="es" messages={es}>
      <MemoryRouter initialEntries={['/register']}>
        <Routes>
          <Route path="/register" element={<Register />} />
          <Route path="/home" element={<p>home page</p>} />
          <Route path="/complete-profile" element={<p>complete profile page</p>} />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

async function fillAccount(user, { password = 'Str0ng!Pass' } = {}) {
  await user.type(screen.getByLabelText(es.CompleteName), 'Ana Pérez');
  await user.type(screen.getByLabelText(es.Mail), 'ana@example.com');
  await user.type(screen.getByLabelText(es.Password), password);
  await user.type(screen.getByLabelText(es.Repeat), password);
  await user.selectOptions(screen.getByLabelText(es.SelectType), 'WORKER');
  await user.click(screen.getByRole('button', { name: es.NEXT }));
}

async function fillPersonal(user, { birthDate = '20/05/1990' } = {}) {
  await user.type(screen.getByLabelText(es.City), 'Bogotá');
  await user.type(screen.getByLabelText(es.Address), 'Calle 10 # 5-20');
  await user.type(screen.getByLabelText(es.phone), '3001234567');
  await user.type(screen.getByLabelText(es.idNumber), '1020304050');
  const birth = screen.getByLabelText(es.Birth);
  await user.clear(birth);
  await user.type(birth, `${birthDate}{Escape}`);
}

beforeEach(() => {
  session.status = 'signedOut';
  session.refresh.mockResolvedValue(undefined);
  auth.signUp.mockResolvedValue({ nextStep: { signUpStep: 'CONFIRM_SIGN_UP' } });
  auth.confirmSignUp.mockResolvedValue({});
  auth.signIn.mockResolvedValue({ nextStep: { signInStep: 'DONE' } });
  mutations.createProfile.mockResolvedValue({ data: { userId: 'u1' }, errors: undefined });
});

afterEach(() => {
  cleanup();
  vi.clearAllMocks();
  sessionStorage.clear();
});

describe('Register', () => {
  it('shows what is missing in step 1 and stays there', async () => {
    const user = userEvent.setup();
    renderRegister();
    await user.click(screen.getByRole('button', { name: es.NEXT }));
    expect(screen.getByText(es.VerName)).toBeTruthy();
    expect(screen.getByText(es.VerMail)).toBeTruthy();
    expect(screen.getByText(es.VerPass)).toBeTruthy();
    expect(screen.queryByText(es.Paso2)).toBeNull();
  });

  it('rejects a weak password', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillAccount(user, { password: 'weakpass' });
    expect(screen.getByText(es.VerPass)).toBeTruthy();
    expect(screen.queryByText(es.Paso2)).toBeNull();
  });

  it('refuses an underage user in step 2', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillAccount(user);
    await fillPersonal(user, { birthDate: `01/01/${new Date().getFullYear() - 10}` });
    await user.click(screen.getByRole('button', { name: es.Create }));
    expect(screen.getByText(es.VerBirth)).toBeTruthy();
    expect(auth.signUp).not.toHaveBeenCalled();
  });

  it('signs up, confirms the code and creates the profile', async () => {
    const user = userEvent.setup();
    renderRegister();
    await fillAccount(user);
    await fillPersonal(user);
    await user.click(screen.getByRole('button', { name: es.Create }));

    expect(auth.signUp).toHaveBeenCalledWith({
      username: 'ana@example.com',
      password: 'Str0ng!Pass',
      options: { userAttributes: { email: 'ana@example.com' } },
    });
    expect(screen.getByText(es.ConfirmTitle)).toBeTruthy();

    await user.type(screen.getByLabelText(es.Code), '123456');
    await user.click(screen.getByRole('button', { name: es.Confirm }));

    expect(auth.confirmSignUp).toHaveBeenCalledWith({ username: 'ana@example.com', confirmationCode: '123456' });
    expect(auth.signIn).toHaveBeenCalledWith({ username: 'ana@example.com', password: 'Str0ng!Pass' });
    expect(mutations.createProfile).toHaveBeenCalledWith({
      name: 'Ana Pérez',
      role: 'WORKER',
      city: 'Bogotá',
      address: 'Calle 10 # 5-20',
      phone: '3001234567',
      idNumber: '1020304050',
      birthDate: '1990-05-20',
    });
    expect(await screen.findByText(es.CuentaExitosa)).toBeTruthy();
  });

  it('shows a translated message when the email is taken', async () => {
    auth.signUp.mockRejectedValue(Object.assign(new Error('exists'), { name: 'UsernameExistsException' }));
    const user = userEvent.setup();
    renderRegister();
    await fillAccount(user);
    await fillPersonal(user);
    await user.click(screen.getByRole('button', { name: es.Create }));
    expect(await screen.findByText(es['error.EMAIL_TAKEN'])).toBeTruthy();
  });
});
