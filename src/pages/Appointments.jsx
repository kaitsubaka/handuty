import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Button, Modal } from 'react-bootstrap';
import { FormattedDate, FormattedMessage, FormattedNumber, FormattedTime } from 'react-intl';
import clientAvatar from '../assets/avatarCliente.png';
import workerAvatar from '../assets/avatarTrabajador.png';
import messageIcon from '../assets/messageIcon.svg';
import deleteIcon from '../assets/deleteGris.svg';
import ratingIcon from '../assets/califGris.svg';
import AppLayout from '../components/AppLayout';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import MessageModal from '../components/MessageModal';
import RatingModal from '../components/RatingModal';
import { categoryMessageId } from '../constants/categories';
import { ROLES } from '../constants/roles';
import { useSession } from '../context/Session';
import { client } from '../lib/amplify';
import { errorMessageId, run } from '../lib/api';
import { chatIdFor } from '../lib/chat';
import { durationMinutes } from '../lib/dates';
import { myBookings } from '../lib/queries';
import './Appointments.css';

function BookingCard({ booking, isClient, past, onMessage, onCancel, onRate }) {
  const finished = new Date(booking.endAt) <= new Date();
  return (
    <div className="citasDetail">
      <div className="card cardCita">
        <div className="cardIntCitas">
          <div className="cardPrincipal">
            <div className="bloqueBorderCitas text-center">
              <h3>
                <FormattedTime value={booking.startAt} />
              </h3>
              <p>
                {durationMinutes(booking.startAt, booking.endAt)} <FormattedMessage id="Minutes" />
              </p>
            </div>
            <div>
              <img
                className="imgTrabajadorCitas"
                src={isClient ? workerAvatar : clientAvatar}
                alt=""
              />
            </div>
            <div className="bloqueTrabajadorCitas">
              <h3>{isClient ? booking.workerName : booking.clientName}</h3>
              <p>
                <FormattedMessage id={categoryMessageId(booking.category)} />
              </p>
            </div>
            <div className="bloqueTextoCitas">
              <h3>
                <FormattedDate
                  value={booking.startAt}
                  year="numeric"
                  month="short"
                  day="numeric"
                  weekday="short"
                />
              </h3>
              <p>{booking.address}</p>
              <p>
                <FormattedNumber
                  value={booking.price}
                  style="currency"
                  currency="COP"
                  maximumFractionDigits={0}
                />
              </p>
            </div>
          </div>
          <div className="bloqueIconosCitas">
            <button type="button" className="iconButton" onClick={() => onMessage(booking)}>
              <img className="iconCitas" src={messageIcon} alt="" />
              <span className="visually-hidden">
                <FormattedMessage id="SendMessage" />
              </span>
            </button>
            {isClient && !past && (
              <button type="button" className="iconButton" onClick={() => onCancel(booking)}>
                <img className="iconCitas" src={deleteIcon} alt="" />
                <span className="visually-hidden">
                  <FormattedMessage id="CancelBooking" />
                </span>
              </button>
            )}
            {past && (
              <span className="califBloc">
                <img className="iconCitas2" src={ratingIcon} alt="" />
                {booking.rating != null ? (
                  booking.rating
                ) : isClient && finished ? (
                  <div className="div-button-calificar">
                    <button
                      type="button"
                      className="btn btn-calificacion"
                      onClick={() => onRate(booking)}
                    >
                      <FormattedMessage id="Calificar" />
                    </button>
                  </div>
                ) : (
                  '-'
                )}
              </span>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Appointments() {
  const session = useSession();
  const navigate = useNavigate();
  const isClient = session.profile.role === ROLES.CLIENT;
  const [past, setPast] = useState(false);
  const [bookings, setBookings] = useState(null);
  const [failed, setFailed] = useState(false);
  const [toCancel, setToCancel] = useState(null);
  const [toRate, setToRate] = useState(null);
  const [errorId, setErrorId] = useState(null);

  useEffect(() => {
    let active = true;
    myBookings(session, { upcoming: !past })
      .then((loaded) => active && setBookings(loaded))
      .catch((error) => {
        console.error('[appointments] could not load bookings', error);
        if (active) {
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [session, past]);

  function togglePast() {
    setBookings(null);
    setFailed(false);
    setPast(!past);
  }

  async function handleMessage(booking) {
    if (!isClient) {
      navigate(
        `/messages?chat=${encodeURIComponent(chatIdFor(booking.clientId, booking.workerId))}`,
      );
      return;
    }
    try {
      const chat = await run(client.mutations.openChat({ workerId: booking.workerId }));
      navigate(`/messages?chat=${encodeURIComponent(chat.id)}`);
    } catch (error) {
      setErrorId(errorMessageId(error));
    }
  }

  async function handleCancel() {
    const booking = toCancel;
    setToCancel(null);
    try {
      await run(client.mutations.cancelBooking({ id: booking.id }));
      setBookings((current) => current.filter((item) => item.id !== booking.id));
    } catch (error) {
      setErrorId(errorMessageId(error));
    }
  }

  async function handleRate(booking, rating) {
    setToRate(null);
    try {
      const rated = await run(client.mutations.rateBooking({ id: booking.id, rating }));
      setBookings((current) => current.map((item) => (item.id === rated.id ? rated : item)));
    } catch (error) {
      setErrorId(errorMessageId(error));
    }
  }

  return (
    <AppLayout>
      <div className="citas">
        <div className="title">
          <h2>
            <FormattedMessage id="Works" />
          </h2>
          <p>
            <FormattedMessage id={isClient ? 'HereFind' : 'HereFindWorker'} />
          </p>
        </div>
        <span className="selectCitas">
          <strong className="lab" id="upcomingLabel">
            <FormattedMessage id="FutureWorks" />
          </strong>
          <label className="switch">
            <input
              type="checkbox"
              checked={past}
              onChange={togglePast}
              aria-labelledby="upcomingLabel pastLabel"
            />
            <span className="slider round"></span>
          </label>
          <strong className="lab" id="pastLabel">
            <FormattedMessage id="PastWorks" />
          </strong>
        </span>
        {failed && <EmptyState messageId="serverProblem" />}
        {!failed && bookings === null && <Loading />}
        {bookings?.length === 0 && (
          <EmptyState messageId="NoWorkError">
            {isClient && (
              <p>
                <FormattedMessage id="GoAndFind" />{' '}
                <Link to="/services">
                  <span>
                    <FormattedMessage id="Services" />
                  </span>
                </Link>{' '}
                <FormattedMessage id="Available" />
              </p>
            )}
          </EmptyState>
        )}
        {bookings?.map((booking) => (
          <BookingCard
            key={booking.id}
            booking={booking}
            isClient={isClient}
            past={past}
            onMessage={handleMessage}
            onCancel={setToCancel}
            onRate={setToRate}
          />
        ))}
      </div>
      <Modal show={toCancel != null} onHide={() => setToCancel(null)} animation={false}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FormattedMessage id="CancelBooking" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <FormattedMessage id="CancelBookingText" />
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setToCancel(null)}>
            <FormattedMessage id="Close" />
          </Button>
          <Button variant="danger" onClick={handleCancel}>
            <FormattedMessage id="CancelBooking" />
          </Button>
        </Modal.Footer>
      </Modal>
      <RatingModal booking={toRate} onRate={handleRate} onClose={() => setToRate(null)} />
      <MessageModal messageId={errorId} onClose={() => setErrorId(null)} />
    </AppLayout>
  );
}
