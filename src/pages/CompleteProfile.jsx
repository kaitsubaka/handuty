import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { FormattedMessage, useIntl } from 'react-intl';
import logo from '../assets/logoLogin.png';
import Loading from '../components/Loading';
import MessageModal from '../components/MessageModal';
import PersonalStep from '../components/register/PersonalStep';
import { ROLES } from '../constants/roles';
import { useSession } from '../context/Session';
import { errorMessageId } from '../lib/api';
import { createProfile, loadPendingProfile } from '../lib/pendingProfile';
import { personalErrors } from '../lib/validation';
import './Login.css';
import './Register.css';

const EMPTY = { name: '', role: ROLES.CLIENT, city: '', address: '', phone: '', idNumber: '', birthDate: null };

/** For a signed-in user without a profile (confirmed on another device, or creation failed). */
export default function CompleteProfile() {
  const intl = useIntl();
  const session = useSession();
  const [form, setForm] = useState(() => loadPendingProfile() ?? EMPTY);
  const [touched, setTouched] = useState(false);
  const [sending, setSending] = useState(false);
  const [errorId, setErrorId] = useState(null);

  if (session.status === 'loading') {
    return <Loading />;
  }
  if (session.status === 'signedOut') {
    return <Navigate to="/login" replace />;
  }
  if (session.status === 'ready') {
    return <Navigate to="/home" replace />;
  }

  const errors = personalErrors(form);
  if (form.name.trim().length === 0) {
    errors.add('name');
  }

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
      await createProfile(form);
      await session.refresh();
    } catch (error) {
      setErrorId(errorMessageId(error));
    } finally {
      setSending(false);
    }
  }

  return (
    <div className="registro">
      <div className="register-izq complete-profile">
        <div className="register-izq-content">
          <h1>
            <img className="logoRegistro" src={logo} alt="Handuty" />
          </h1>
          <form className="register-izq-inputs" noValidate onSubmit={handleSubmit}>
            <p>
              <FormattedMessage id="CompleteProfileText" />
            </p>
            <label htmlFor="profile-name">
              <p>
                <FormattedMessage id="CompleteName" />
              </p>
            </label>
            <input
              id="profile-name"
              name="name"
              autoComplete="name"
              value={form.name}
              onChange={handleChange}
              className={touched && errors.has('name') ? 'is-invalid' : ''}
            />
            {touched && errors.has('name') && (
              <div className="invalid-feedback d-block">
                <FormattedMessage id="VerName" />
              </div>
            )}
            <label htmlFor="profile-role">
              <p>
                <FormattedMessage id="SelectType" />
              </p>
            </label>
            <select id="profile-role" name="role" className="form-control" value={form.role} onChange={handleChange}>
              <option value={ROLES.CLIENT}>{intl.formatMessage({ id: 'Client' })}</option>
              <option value={ROLES.WORKER}>{intl.formatMessage({ id: 'Worker' })}</option>
            </select>
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
          <button type="button" className="registro-steps-but" onClick={session.signOut}>
            <FormattedMessage id="exit" />
          </button>
        </div>
      </div>
      <MessageModal messageId={errorId} onClose={() => setErrorId(null)} />
    </div>
  );
}
