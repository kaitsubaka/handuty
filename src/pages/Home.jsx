import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { Carousel } from 'react-bootstrap';
import { FormattedDate, FormattedMessage, FormattedTime } from 'react-intl';
import welcome from '../assets/bienvenido.svg';
import emptyBookings from '../assets/emptyCitas.svg';
import emptyMessages from '../assets/emptyMensajes.svg';
import workerAvatar from '../assets/avatarTrabajador.png';
import clientAvatar from '../assets/avatarCliente.png';
import home1 from '../assets/serHome1.svg';
import home2 from '../assets/serHome2.svg';
import home3 from '../assets/serHome3.svg';
import home4 from '../assets/serHome4.svg';
import home5 from '../assets/serHome5.svg';
import AppLayout from '../components/AppLayout';
import EmptyState from '../components/EmptyState';
import { categoryMessageId } from '../constants/categories';
import { ROLES } from '../constants/roles';
import { useSession } from '../context/Session';
import { durationMinutes } from '../lib/dates';
import { myBookings, myChats, myServices } from '../lib/queries';
import './Home.css';

const FEATURED = [
  { image: home1, key: 'CARPENTRY' },
  { image: home2, key: 'ELECTRICIAN' },
  { image: home3, key: 'GARDENING' },
  { image: home4, key: 'PETS' },
  { image: home5, key: 'PAINTING' },
];

const SHOWN_SERVICES = 5;

function EmptyCard({ titleId, image, lines, linkTo, linkId }) {
  return (
    <div className="card homeDetails">
      <div className="cardTitle">
        <h3>
          <FormattedMessage id={titleId} />
        </h3>
      </div>
      <div className="cardIntHome">
        <img className="emptyCitaIcon" src={image} alt="" />
        <div className="emptyHome">
          {lines.map((id, index) => (
            <p key={id}>{index === 0 ? <span><FormattedMessage id={id} /></span> : <FormattedMessage id={id} />}</p>
          ))}
        </div>
      </div>
      <div className="cardButton">
        <Link to={linkTo} className="disabled-link">
          <p>
            <FormattedMessage id={linkId} />
          </p>
        </Link>
      </div>
    </div>
  );
}

function UpcomingBookings({ bookings, isClient }) {
  if (bookings.length === 0) {
    return (
      <EmptyCard
        titleId="NextWork"
        image={emptyBookings}
        lines={['NoWork', isClient ? 'FindWorker' : 'NoReserv']}
        linkTo="/appointments"
        linkId="VerCitas"
      />
    );
  }
  return (
    <div className="card homeDetails">
      <div className="cardTitle">
        <h3>
          <FormattedMessage id="NextWork" />
        </h3>
      </div>
      <Carousel variant="dark" indicators={false} interval={null}>
        {bookings.map((booking) => (
          <Carousel.Item key={booking.id}>
            <div className="cardIntHome">
              <div className="bloqueBorder text-center">
                <h3>
                  <FormattedTime value={booking.startAt} />
                </h3>
                <p>
                  {durationMinutes(booking.startAt, booking.endAt)} <FormattedMessage id="Minutes" />
                </p>
              </div>
              <div>
                <img className="imgTrabajador" src={isClient ? workerAvatar : clientAvatar} alt="" />
              </div>
              <div className="bloqueTexto1">
                <h3>{isClient ? booking.workerName : booking.clientName}</h3>
                <p>
                  <FormattedMessage id={categoryMessageId(booking.category)} />
                </p>
              </div>
              <div className="bloqueTexto2">
                <h3>
                  <FormattedDate value={booking.startAt} year="numeric" month="short" day="numeric" weekday="short" />
                </h3>
                <p>{booking.address}</p>
              </div>
            </div>
          </Carousel.Item>
        ))}
      </Carousel>
      <div className="cardButton">
        <Link to="/appointments">
          <p>
            <FormattedMessage id="VerCitas" />
          </p>
        </Link>
      </div>
    </div>
  );
}

function LastMessage({ chat, isClient }) {
  if (!chat) {
    return (
      <EmptyCard
        titleId="LastMessage"
        image={emptyMessages}
        lines={['NoMess', 'Chat']}
        linkTo="/messages"
        linkId="VerMensajes"
      />
    );
  }
  return (
    <div className="card homeDetails">
      <div className="cardTitle">
        <h3>
          <FormattedMessage id="LastMessage" />
        </h3>
      </div>
      <div className="cardIntHome">
        <div>
          <img className="imgTrabajador" src={isClient ? workerAvatar : clientAvatar} alt="" />
        </div>
        <div className="bloqueBorder">
          <h3>{isClient ? chat.workerName : chat.clientName}</h3>
        </div>
        <div className="bloqueMensaje">
          <p className="horaMensaje">
            <FormattedDate value={chat.lastMessageAt} month="short" day="numeric" />{' '}
            <FormattedTime value={chat.lastMessageAt} />
          </p>
          <p>{chat.lastMessage}</p>
        </div>
      </div>
      <div className="cardButton">
        <Link to={`/messages?chat=${encodeURIComponent(chat.id)}`}>
          <p>
            <FormattedMessage id="VerMensajes" />
          </p>
        </Link>
      </div>
    </div>
  );
}

function WorkerServices({ name, services }) {
  return (
    <div className="mainHome-der">
      <div className="perfil-main-persona">
        <img className="imagen" src={workerAvatar} alt="" />
        <h3>{name}</h3>
      </div>
      <div className="perfil-home-informacion">
        <p>
          <FormattedMessage id="MyServs" />
        </p>
        {services.length > 0 ? (
          <div className="perfil-home-informacionDetail">
            {services.slice(0, SHOWN_SERVICES).map((service) => (
              <p key={service.id}>
                <FormattedMessage id={categoryMessageId(service.category)} />
              </p>
            ))}
            {services.length > SHOWN_SERVICES && <p>…</p>}
          </div>
        ) : (
          <EmptyState messageId="NoServicesAdded" />
        )}
      </div>
      <div className="buttonPerfilHome">
        <Link to="/profile">
          <span>
            <FormattedMessage id={services.length > 0 ? 'VerTodos' : 'AddServ'} />
          </span>
        </Link>
      </div>
    </div>
  );
}

function FeaturedCategories() {
  return (
    <div className="mainHome-der">
      <p className="mainHome-der-frase">
        <FormattedMessage id="FindBetter" />
      </p>
      <div className="mainHome-der-oferta">
        {FEATURED.map((item) => (
          <Link key={item.key} className="row serItem" to={`/services/results?category=${item.key}`}>
            <img className="imgSerHome" src={item.image} alt="" />
            <p>
              <FormattedMessage id={categoryMessageId(item.key)} />
            </p>
          </Link>
        ))}
      </div>
      <div className="buttonHome">
        <Link to="/services">
          <span>
            <FormattedMessage id="VerTodos" />
          </span>
        </Link>
      </div>
    </div>
  );
}

export default function Home() {
  const session = useSession();
  const isClient = session.profile.role === ROLES.CLIENT;
  const [bookings, setBookings] = useState([]);
  const [lastChat, setLastChat] = useState(null);
  const [services, setServices] = useState([]);
  const [failed, setFailed] = useState(false);

  useEffect(() => {
    let active = true;
    Promise.all([
      myBookings(session, { upcoming: true }),
      myChats(session),
      isClient ? Promise.resolve([]) : myServices(session),
    ])
      .then(([upcoming, chats, own]) => {
        if (!active) {
          return;
        }
        setBookings(upcoming);
        setLastChat(chats.find((chat) => chat.lastMessage) ?? null);
        setServices(own);
      })
      .catch((error) => {
        console.error('[home] could not load the dashboard', error);
        if (active) {
          setFailed(true);
        }
      });
    return () => {
      active = false;
    };
  }, [session, isClient]);

  return (
    <AppLayout>
      <div className="home">
        <div className="mainHomeTrabajador">
          <div className="mainHome-izq">
            <div className="bienvenida">
              <div className="textBienvenida">
                <h2>
                  <FormattedMessage id="Welcome" />
                </h2>
                <p>
                  <FormattedMessage id="beginExplore" />
                </p>
              </div>
              <div className="bloqueIl">
                <img className="ilBienvenida" src={welcome} alt="" />
              </div>
            </div>
            {failed ? (
              <EmptyState messageId="serverProblem" />
            ) : (
              <>
                <UpcomingBookings bookings={bookings} isClient={isClient} />
                <LastMessage chat={lastChat} isClient={isClient} />
              </>
            )}
          </div>
          {isClient ? <FeaturedCategories /> : <WorkerServices name={session.profile.name} services={services} />}
        </div>
      </div>
    </AppLayout>
  );
}
