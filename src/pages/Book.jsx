import { useCallback, useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import DatePicker from 'react-datepicker';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import triangle from '../assets/triangle.svg';
import AppLayout from '../components/AppLayout';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import MessageModal from '../components/MessageModal';
import { categoryMessageId } from '../constants/categories';
import { useSession } from '../context/Session';
import { client } from '../lib/amplify';
import { errorMessageId, run } from '../lib/api';
import { datePickerLocale } from '../lib/datepicker';
import { nextSlot, overlaps } from '../lib/dates';
import './Forms.css';

const DURATIONS = [30, 60, 90, 120];
const MINUTE_MS = 60 * 1000;

export default function Book() {
  const intl = useIntl();
  const navigate = useNavigate();
  const { serviceId } = useParams();
  const { privateProfile } = useSession();
  const [service, setService] = useState(undefined);
  const [busy, setBusy] = useState([]);
  const [startAt, setStartAt] = useState(() => nextSlot());
  const [duration, setDuration] = useState(DURATIONS[0]);
  const [sending, setSending] = useState(false);
  const [errorId, setErrorId] = useState(null);
  const [booked, setBooked] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      run(client.models.Service.get({ id: serviceId })),
      run(client.queries.busySlots({ serviceId })),
    ])
      .then(([loaded, slots]) => {
        if (active) {
          setService(loaded);
          setBusy(
            slots.map((slot) => ({ start: new Date(slot.startAt), end: new Date(slot.endAt) })),
          );
        }
      })
      .catch((error) => {
        console.error('[book] could not load the service', error);
        if (active) {
          setService(null);
        }
      });
    return () => {
      active = false;
    };
  }, [serviceId]);

  const isFree = useCallback(
    (slot) => {
      const end = new Date(slot.getTime() + duration * MINUTE_MS);
      return (
        slot > new Date() &&
        !busy.some((booking) => overlaps(slot, end, booking.start, booking.end))
      );
    },
    [busy, duration],
  );

  async function handleSubmit(event) {
    event.preventDefault();
    if (!isFree(startAt)) {
      setErrorId('error.SLOT_TAKEN');
      return;
    }
    setSending(true);
    try {
      await run(
        client.mutations.bookService({
          serviceId,
          startAt: startAt.toISOString(),
          durationMinutes: duration,
        }),
      );
      setBooked(true);
    } catch (error) {
      setErrorId(errorMessageId(error));
    } finally {
      setSending(false);
    }
  }

  if (service === undefined) {
    return (
      <AppLayout>
        <Loading />
      </AppLayout>
    );
  }

  if (service === null) {
    return (
      <AppLayout>
        <div className="formServicio">
          <EmptyState messageId="error.SERVICE_NOT_FOUND" />
        </div>
      </AppLayout>
    );
  }

  return (
    <AppLayout>
      <div className="formServicio">
        <nav className="servicioDetailBarRe" aria-label="breadcrumb">
          <Link to="/services">
            <p>
              <FormattedMessage id="Services" />
            </p>
          </Link>
          <img className="triangle" src={triangle} alt="" />
          <Link to={`/services/results?category=${service.category}`}>
            <p>
              <FormattedMessage id={categoryMessageId(service.category)} />
            </p>
          </Link>
          <img className="triangle" src={triangle} alt="" />
          <p>
            <FormattedMessage id="Schedule" />
          </p>
        </nav>
        <div className="formServicio-title">
          <div className="formServicio-title-txt">
            <h1>
              <FormattedMessage id="Schedule" />
            </h1>
            <p>
              <FormattedMessage id="newCita" />
            </p>
          </div>
        </div>
        <div className="formServicio-detail-cont">
          <div className="formServicio-detail">
            <dl className="formServicio-detail-bloc">
              <dt>
                <FormattedMessage id="Worker" />
              </dt>
              <dd>{service.workerName}</dd>
              <dt>
                <FormattedMessage id="Category" />
              </dt>
              <dd>
                <FormattedMessage id={categoryMessageId(service.category)} />
              </dd>
              <dt>
                <FormattedMessage id="PriceHour" />
              </dt>
              <dd>
                <FormattedNumber
                  value={service.pricePerHour}
                  style="currency"
                  currency="COP"
                  maximumFractionDigits={0}
                />
              </dd>
              <dt>
                <FormattedMessage id="Total" />
              </dt>
              <dd>
                <FormattedNumber
                  value={Math.round((service.pricePerHour * duration) / 60)}
                  style="currency"
                  currency="COP"
                  maximumFractionDigits={0}
                />
              </dd>
              <dt>
                <FormattedMessage id="Address" />
              </dt>
              <dd>{privateProfile?.address}</dd>
            </dl>
            <p className="formServicio-description">{service.description}</p>
          </div>
          <div className="formServicio-main">
            <form className="formDetailCita" onSubmit={handleSubmit}>
              <label htmlFor="bookStart">
                <p>
                  <FormattedMessage id="Day" />
                </p>
              </label>
              <DatePicker
                id="bookStart"
                selected={startAt}
                onChange={(date) => date && setStartAt(date)}
                showTimeSelect
                timeIntervals={30}
                minDate={new Date()}
                filterTime={isFree}
                dateFormat={intl.locale === 'en' ? 'MM/dd/yyyy hh:mm aa' : 'dd/MM/yyyy HH:mm'}
                locale={datePickerLocale}
              />
              {!isFree(startAt) && (
                <div id="bad-date-feedback">
                  <p>
                    <FormattedMessage id="invalidDate" />
                  </p>
                </div>
              )}
              <label htmlFor="bookDuration">
                <p>
                  <FormattedMessage id="duration" />
                </p>
              </label>
              <select
                id="bookDuration"
                className="form-control"
                value={duration}
                onChange={(event) => setDuration(Number(event.target.value))}
              >
                {DURATIONS.map((minutes) => (
                  <option key={minutes} value={minutes}>
                    {minutes} {intl.formatMessage({ id: 'Minutes' })}
                  </option>
                ))}
              </select>
              <div className="bloqueBotonesCita">
                <button type="button" className="cancelButton" onClick={() => navigate(-1)}>
                  <FormattedMessage id="Cancel" />
                </button>
                <button type="submit" className="reservar" disabled={sending}>
                  <FormattedMessage id="Book" />
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
      <MessageModal messageId={errorId} onClose={() => setErrorId(null)} />
      <MessageModal
        messageId={booked ? 'SuccReserve' : null}
        title={<FormattedMessage id="HasReservado" />}
        variant="success"
        onClose={() => navigate('/appointments')}
      />
    </AppLayout>
  );
}
