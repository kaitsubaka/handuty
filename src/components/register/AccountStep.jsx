import { FormattedMessage, useIntl } from 'react-intl';
import stepImage from '../../assets/Step1.svg';
import { ROLES } from '../../constants/roles';

const FIELD_MESSAGES = {
  name: 'VerName',
  email: 'VerMail',
  password: 'VerPass',
  passwordRepeat: 'VerEquals',
};

function Feedback({ show, messageId }) {
  return show ? (
    <div className="invalid-feedback d-block">
      <FormattedMessage id={messageId} />
    </div>
  ) : null;
}

/** Step 1 of the sign-up: name, email, password and role. */
export default function AccountStep({ form, errors, touched, onChange, onNext }) {
  const intl = useIntl();
  const show = (field) => touched && errors.has(field);
  const invalid = (field) => (show(field) ? 'is-invalid' : '');

  return (
    <div className="registro-steps">
      <div className="registro-steps-izq">
        <img className="pregunta-bar" src={stepImage} alt="" />
      </div>
      <div className="registro-steps-der">
        <p className="registro-steps-der-tit">
          <FormattedMessage id="Paso1" />
        </p>
        <label htmlFor="registerName">
          <p>
            <FormattedMessage id="CompleteName" />
          </p>
        </label>
        <input
          type="text"
          id="registerName"
          name="name"
          autoComplete="name"
          value={form.name}
          onChange={onChange}
          className={invalid('name')}
        />
        <Feedback show={show('name')} messageId={FIELD_MESSAGES.name} />
        <label htmlFor="registerEmail">
          <p>
            <FormattedMessage id="Mail" />
          </p>
        </label>
        <input
          type="email"
          id="registerEmail"
          name="email"
          autoComplete="email"
          value={form.email}
          onChange={onChange}
          className={invalid('email')}
        />
        <Feedback show={show('email')} messageId={FIELD_MESSAGES.email} />
        <div className="contrasena">
          <div className="bloque">
            <label htmlFor="registerPassword">
              <p>
                <FormattedMessage id="Password" />
              </p>
            </label>
            <input
              type="password"
              id="registerPassword"
              name="password"
              autoComplete="new-password"
              value={form.password}
              onChange={onChange}
              className={invalid('password')}
            />
            <Feedback show={show('password')} messageId={FIELD_MESSAGES.password} />
          </div>
          <div className="bloque">
            <label htmlFor="registerPasswordRepeat">
              <p>
                <FormattedMessage id="Repeat" />
              </p>
            </label>
            <input
              type="password"
              id="registerPasswordRepeat"
              name="passwordRepeat"
              autoComplete="new-password"
              value={form.passwordRepeat}
              onChange={onChange}
              className={invalid('passwordRepeat')}
            />
            <Feedback show={show('passwordRepeat')} messageId={FIELD_MESSAGES.passwordRepeat} />
          </div>
        </div>
        <label htmlFor="registerRole">
          <p>
            <FormattedMessage id="SelectType" />
          </p>
        </label>
        <select
          id="registerRole"
          name="role"
          className="form-control"
          value={form.role}
          onChange={onChange}
        >
          <option value={ROLES.CLIENT}>{intl.formatMessage({ id: 'Client' })}</option>
          <option value={ROLES.WORKER}>{intl.formatMessage({ id: 'Worker' })}</option>
        </select>
        <button type="button" className="registro-steps-but" onClick={onNext}>
          <FormattedMessage id="NEXT" />
        </button>
      </div>
    </div>
  );
}
