import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { confirmSignUp, resendSignUpCode, signIn, signUp } from 'aws-amplify/auth';
import illustration from '../assets/ilLogin.svg';
import logo from '../assets/logoLogin.png';
import MessageModal from '../components/MessageModal';
import AccountStep from '../components/register/AccountStep';
import PersonalStep from '../components/register/PersonalStep';
import { ROLES } from '../constants/roles';
import { useSession } from '../context/Session';
import { errorMessageId } from '../lib/api';
import { createProfile, savePendingProfile } from '../lib/pendingProfile';
import { accountErrors, personalErrors } from '../lib/validation';
import './Login.css';
import './Register.css';

const EMPTY_FORM = {
  name: '',
  email: '',
  password: '',
  passwordRepeat: '',
  role: ROLES.CLIENT,
  city: '',
  address: '',
  phone: '',
  idNumber: '',
  birthDate: null,
};

export default function Register() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const confirmEmail = location.state?.confirmEmail;
  const [step, setStep] = useState(confirmEmail ? 'confirm' : 'account');
  const [form, setForm] = useState({ ...EMPTY_FORM, email: confirmEmail ?? '' });
  const [code, setCode] = useState('');
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorId, setErrorId] = useState(null);
  const [infoId, setInfoId] = useState(null);
  const [done, setDone] = useState(false);

  if (!done && session.status === 'ready') {
    return <Navigate to="/home" replace />;
  }

  const errors = step === 'account' ? accountErrors(form) : personalErrors(form);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  function handleNext() {
    setTouched(true);
    if (errors.size === 0) {
      setTouched(false);
      setStep('personal');
    }
  }

  /** Signs in after the email is confirmed and creates the profile typed in step 2. */
  async function finish() {
    if (!form.password) {
      navigate('/login');
      return;
    }
    await signIn({ username: form.email.trim(), password: form.password });
    try {
      await createProfile(form);
    } catch (error) {
      console.warn('[register] profile creation failed, asking again', error);
      await session.refresh();
      navigate('/complete-profile');
      return;
    }
    setDone(true);
    await session.refresh();
  }

  async function handleSignUp(event) {
    event.preventDefault();
    setTouched(true);
    if (errors.size > 0) {
      return;
    }
    setSending(true);
    try {
      const email = form.email.trim();
      const { nextStep } = await signUp({
        username: email,
        password: form.password,
        options: { userAttributes: { email } },
      });
      savePendingProfile(form);
      if (nextStep.signUpStep === 'CONFIRM_SIGN_UP') {
        setStep('confirm');
      } else {
        await finish();
      }
    } catch (error) {
      setErrorId(errorMessageId(error));
    } finally {
      setSending(false);
    }
  }

  async function handleConfirm(event) {
    event.preventDefault();
    setSending(true);
    try {
      await confirmSignUp({ username: form.email.trim(), confirmationCode: code.trim() });
      await finish();
    } catch (error) {
      setErrorId(errorMessageId(error));
    } finally {
      setSending(false);
    }
  }

  async function handleResend() {
    try {
      await resendSignUpCode({ username: form.email.trim() });
      setInfoId('CodeSent');
    } catch (error) {
      setErrorId(errorMessageId(error));
    }
  }

  return (
    <div className="registro">
      <div className="register-der">
        <div className="slogan">
          <h3>
            <FormattedMessage id="Find" />
          </h3>
        </div>
        <img className="ilLogin" src={illustration} alt="" />
      </div>
      <div className="register-izq">
        <div className="register-izq-content">
          <h1>
            <img className="logoRegistro" src={logo} alt="Handuty" />
          </h1>
          {step === 'account' && (
            <form
              className="register-izq-inputs"
              noValidate
              onSubmit={(event) => event.preventDefault()}
            >
              <AccountStep
                form={form}
                errors={errors}
                touched={touched}
                onChange={handleChange}
                onNext={handleNext}
              />
            </form>
          )}
          {step === 'personal' && (
            <form className="register-izq-inputs" noValidate onSubmit={handleSignUp}>
              <PersonalStep
                form={form}
                errors={errors}
                touched={touched}
                onChange={handleChange}
                onDateChange={(birthDate) => setForm({ ...form, birthDate })}
              />
              <button type="submit" className="botonRegister" disabled={sending}>
                <span>
                  <FormattedMessage id="Create" />
                </span>
              </button>
            </form>
          )}
          {step === 'confirm' && (
            <form className="register-izq-inputs" noValidate onSubmit={handleConfirm}>
              <p className="registro-steps-der-tit">
                <FormattedMessage id="ConfirmTitle" />
              </p>
              <p>
                <FormattedMessage id="ConfirmText" values={{ email: form.email }} />
              </p>
              <label htmlFor="confirmCode">
                <p>
                  <FormattedMessage id="Code" />
                </p>
              </label>
              <input
                id="confirmCode"
                inputMode="numeric"
                autoComplete="one-time-code"
                value={code}
                onChange={(event) => setCode(event.target.value)}
              />
              <button
                type="submit"
                className="botonRegister"
                disabled={sending || code.trim().length === 0}
              >
                <span>
                  <FormattedMessage id="Confirm" />
                </span>
              </button>
              <button type="button" className="registro-steps-but" onClick={handleResend}>
                <FormattedMessage id="ResendCode" />
              </button>
            </form>
          )}
          <div className="preguntaRegistro">
            <p>
              <FormattedMessage id="Already" />{' '}
              <Link to="/login">
                <span>
                  <FormattedMessage id="Login" />
                </span>
              </Link>
            </p>
          </div>
        </div>
      </div>
      <MessageModal messageId={errorId} onClose={() => setErrorId(null)} />
      <MessageModal messageId={infoId} variant="success" onClose={() => setInfoId(null)} />
      <MessageModal
        messageId={done ? 'CuentaExitosa' : null}
        title={<FormattedMessage id="RegisExito" />}
        variant="dark"
        buttonId="Ingresar"
        onClose={() => navigate('/home')}
      />
    </div>
  );
}
