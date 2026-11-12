// @vitest-environment jsdom
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { cleanup, render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { IntlProvider } from 'react-intl';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import es from '../src/locales/es.json';

const auth = vi.hoisted(() => ({ signIn: vi.fn(), confirmSignIn: vi.fn() }));
const session = vi.hoisted(() => ({ status: 'signedOut', refresh: vi.fn() }));

vi.mock('aws-amplify/auth', () => auth);
vi.mock('../src/context/Session', () => ({ useSession: () => session }));

const { default: Login } = await import('../src/pages/Login');

function renderLogin() {
  return render(
    <IntlProvider locale="es" messages={es}>
      <MemoryRouter initialEntries={['/login']}>
        <Routes>
          <Route path="/login" element={<Login />} />
        </Routes>
      </MemoryRouter>
    </IntlProvider>,
  );
}

async function signInWith(user, password) {
  await user.type(screen.getByLabelText(es.Mail), 'worker@example.com');
  await user.type(screen.getByLabelText(es.Password), password);
  await user.click(screen.getByRole('button', { name: es.Login }));
}

describe('Login', () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });
  afterEach(cleanup);

  it('signs in and refreshes the session', async () => {
    auth.signIn.mockResolvedValue({ nextStep: { signInStep: 'DONE' } });
    const user = userEvent.setup();
    renderLogin();

    await signInWith(user, 'Str0ng!Pass');

    expect(auth.signIn).toHaveBeenCalledWith({ username: 'worker@example.com', password: 'Str0ng!Pass' });
    expect(session.refresh).toHaveBeenCalled();
  });

  it('asks an account created in Cognito for a new password on its first sign-in', async () => {
    auth.signIn.mockResolvedValue({
      nextStep: { signInStep: 'CONFIRM_SIGN_IN_WITH_NEW_PASSWORD_REQUIRED' },
    });
    auth.confirmSignIn.mockResolvedValue({ nextStep: { signInStep: 'DONE' } });
    const user = userEvent.setup();
    renderLogin();

    await signInWith(user, 'Temp0rary!');
    expect(session.refresh).not.toHaveBeenCalled();
    expect(screen.getByText(es.NewPasswordTitle)).toBeTruthy();

    await user.type(screen.getByLabelText(es.NewPassword), 'weak');
    await user.type(screen.getByLabelText(es.Repeat), 'weak');
    await user.click(screen.getByRole('button', { name: es.SaveNewPassword }));
    expect(auth.confirmSignIn).not.toHaveBeenCalled();
    expect(screen.getByText(es.VerPass)).toBeTruthy();

    await user.clear(screen.getByLabelText(es.NewPassword));
    await user.clear(screen.getByLabelText(es.Repeat));
    await user.type(screen.getByLabelText(es.NewPassword), 'N3w!Password');
    await user.type(screen.getByLabelText(es.Repeat), 'N3w!Password');
    await user.click(screen.getByRole('button', { name: es.SaveNewPassword }));

    expect(auth.confirmSignIn).toHaveBeenCalledWith({ challengeResponse: 'N3w!Password' });
    expect(session.refresh).toHaveBeenCalled();
  });
});
