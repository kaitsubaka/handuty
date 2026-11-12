import { useState } from 'react';
import { Link, Navigate, useLocation, useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { signIn } from 'aws-amplify/auth';
import logo from '../assets/logoLogin.png';
import illustration from '../assets/ilLogin.svg';
import MessageModal from '../components/MessageModal';
import { useSession } from '../context/Session';
import { errorMessageId } from '../lib/api';
import { loginErrors } from '../lib/validation';
import './Login.css';

export default function Login() {
  const session = useSession();
  const navigate = useNavigate();
  const location = useLocation();
  const [form, setForm] = useState({ email: '', password: '' });
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorId, setErrorId] = useState(null);

  if (session.status === 'ready') {
    return <Navigate to={location.state?.from ?? '/home'} replace />;
  }
  if (session.status === 'needsProfile') {
    return <Navigate to="/complete-profile" replace />;
  }

  const errors = loginErrors(form);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (errors.size > 0) {
      return;
    }
    setSending(true);
    try {
      const { nextStep } = await signIn({ username: form.email.trim(), password: form.password });
      if (nextStep.signInStep === 'CONFIRM_SIGN_UP') {
        navigate('/register', { state: { confirmEmail: form.email.trim() } });
        return;
      }
      await session.refresh();
    } catch (error) {
      setErrorId(errorMessageId(error));
    } finally {
      setSending(false);
    }
  }

  const invalid = (field) => (touched && errors.has(field) ? 'is-invalid' : '');

  return (
    <div className="login">
      <div className="login-izq">
        <div className="login-izq-content">
          <h1>
            <img className="logoLogin" src={logo} alt="Handuty" />
          </h1>
          <form className="login-izq-inputs" onSubmit={handleSubmit} noValidate>
            <label htmlFor="loginEmail">
              <p>
                <FormattedMessage id="Mail" />
              </p>
            </label>
            <input
              type="email"
              id="loginEmail"
              name="email"
              autoComplete="email"
              value={form.email}
              onChange={handleChange}
              className={invalid('email')}
            />
            {touched && errors.has('email') && (
              <div className="invalid-feedback d-block">
                <FormattedMessage id="EnterMail" />
              </div>
            )}
            <label htmlFor="loginPassword">
              <p>
                <FormattedMessage id="Password" />
              </p>
            </label>
            <input
              type="password"
              id="loginPassword"
              name="password"
              autoComplete="current-password"
              value={form.password}
              onChange={handleChange}
              className={invalid('password')}
            />
            {touched && errors.has('password') && (
              <div className="invalid-feedback d-block">
                <FormattedMessage id="EnterPass" />
              </div>
            )}
            <button type="submit" className="botonLogin" disabled={sending}>
              <span>
                <FormattedMessage id="Login" />
              </span>
            </button>
          </form>
          <div className="preguntaRegistro">
            <p>
              <FormattedMessage id="NotAccount" />{' '}
              <Link to="/register">
                <span>
                  <FormattedMessage id="Register" />
                </span>
              </Link>
            </p>
          </div>
        </div>
      </div>
      <div className="login-der">
        <div className="slogan">
          <h2>
            <FormattedMessage id="Find" />
          </h2>
        </div>
        <img className="ilLogin" src={illustration} alt="" />
      </div>
      <MessageModal messageId={errorId} onClose={() => setErrorId(null)} />
    </div>
  );
}
