import DatePicker from 'react-datepicker';
import { FormattedMessage, useIntl } from 'react-intl';
import stepImage from '../../assets/Step2.svg';
import { datePickerLocale } from '../../lib/datepicker';

const FIELDS = [
  {
    name: 'city',
    messageId: 'City',
    errorId: 'VerCity',
    type: 'text',
    autoComplete: 'address-level2',
  },
  {
    name: 'address',
    messageId: 'Address',
    errorId: 'VerAdd',
    type: 'text',
    autoComplete: 'street-address',
  },
  { name: 'phone', messageId: 'phone', errorId: 'VerPho', type: 'tel', autoComplete: 'tel' },
  { name: 'idNumber', messageId: 'idNumber', errorId: 'VerId', type: 'text', autoComplete: 'off' },
];

/** Step 2 of the sign-up (and the "complete profile" form): personal data. */
export default function PersonalStep({
  form,
  errors,
  touched,
  onChange,
  onDateChange,
  titleId = 'Paso2',
}) {
  const intl = useIntl();
  const show = (field) => touched && errors.has(field);

  return (
    <div className="registro-steps">
      <div className="registro-steps-izq">
        <img className="pregunta-bar" src={stepImage} alt="" />
      </div>
      <div className="registro-steps-der">
        <p className="registro-steps-der-tit">
          <FormattedMessage id={titleId} />
        </p>
        {[FIELDS.slice(0, 2), FIELDS.slice(2)].map((pair) => (
          <div className="contrasena" key={pair[0].name}>
            {pair.map((field) => (
              <div className="bloque" key={field.name}>
                <label htmlFor={`profile-${field.name}`}>
                  <p>
                    <FormattedMessage id={field.messageId} />
                  </p>
                </label>
                <input
                  type={field.type}
                  inputMode={field.name === 'idNumber' ? 'numeric' : undefined}
                  id={`profile-${field.name}`}
                  name={field.name}
                  autoComplete={field.autoComplete}
                  value={form[field.name]}
                  onChange={onChange}
                  className={show(field.name) ? 'is-invalid' : ''}
                />
                {show(field.name) && (
                  <div className="invalid-feedback d-block">
                    <FormattedMessage id={field.errorId} />
                  </div>
                )}
              </div>
            ))}
          </div>
        ))}
        <label htmlFor="profile-birthDate">
          <p>
            <FormattedMessage id="Birth" />
          </p>
        </label>
        <DatePicker
          id="profile-birthDate"
          selected={form.birthDate}
          onChange={onDateChange}
          maxDate={new Date()}
          showMonthDropdown
          showYearDropdown
          dropdownMode="select"
          placeholderText={intl.formatMessage({ id: 'Birth' })}
          dateFormat={intl.locale === 'en' ? 'MM/dd/yyyy' : 'dd/MM/yyyy'}
          locale={datePickerLocale}
        />
        {show('birthDate') && (
          <div id="bad-date-feedback">
            <p>
              <FormattedMessage id="VerBirth" />
            </p>
          </div>
        )}
      </div>
    </div>
  );
}
