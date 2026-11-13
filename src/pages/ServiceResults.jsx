import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate, useSearchParams } from 'react-router-dom';
import { FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import workerPhoto from '../assets/avatarTrabajador.png';
import ratingIcon from '../assets/califIcon.svg';
import usersIcon from '../assets/usersIcon.svg';
import triangle from '../assets/triangle.svg';
import messageIcon from '../assets/messageIcon.svg';
import AppLayout from '../components/AppLayout';
import EmptyState from '../components/EmptyState';
import Loading from '../components/Loading';
import MessageModal from '../components/MessageModal';
import Search from '../components/Search';
import { CATEGORIES, categoryMessageId } from '../constants/categories';
import { client } from '../lib/amplify';
import { errorMessageId, run } from '../lib/api';
import { all } from '../lib/queries';
import './ServiceResults.css';

const PRICE_RANGES = [
  { id: 'cero-10', min: 0, max: 10000 },
  { id: 'diez-20', min: 10000, max: 20000 },
  { id: 'veinte-30', min: 20000, max: 30000 },
  { id: 'treinta-40', min: 30000, max: 40000 },
  { id: 'mas40', min: 40000, max: Infinity },
];

const SORTS = {
  name: (a, b) => a.workerName.localeCompare(b.workerName),
  price: (a, b) => a.pricePerHour - b.pricePerHour,
  rating: (a, b) => (b.rating ?? 0) - (a.rating ?? 0),
};

function loadServices(category) {
  return all((nextToken) =>
    category
      ? client.models.Service.servicesByCategory({ category }, { limit: 100, nextToken })
      : client.models.Service.list({ limit: 100, nextToken }),
  );
}

export default function ServiceResults() {
  const intl = useIntl();
  const navigate = useNavigate();
  const [params] = useSearchParams();
  const category = CATEGORIES.some((item) => item.key === params.get('category'))
    ? params.get('category')
    : null;
  const text = params.get('q')?.trim().toLowerCase() ?? '';
  const [loaded, setLoaded] = useState({ category: undefined, services: null, failed: false });
  const { services, failed } =
    loaded.category === category ? loaded : { services: null, failed: false };
  const [range, setRange] = useState('');
  const [sort, setSort] = useState('');
  const [errorId, setErrorId] = useState(null);

  useEffect(() => {
    let active = true;
    loadServices(category)
      .then((items) => active && setLoaded({ category, services: items, failed: false }))
      .catch((error) => {
        console.error('[services] could not load services', error);
        if (active) {
          setLoaded({ category, services: null, failed: true });
        }
      });
    return () => {
      active = false;
    };
  }, [category]);

  const shown = useMemo(() => {
    if (!services) {
      return [];
    }
    const priceRange = PRICE_RANGES.find((item) => item.id === range);
    const matches = services.filter((service) => {
      if (
        priceRange &&
        (service.pricePerHour < priceRange.min || service.pricePerHour >= priceRange.max)
      ) {
        return false;
      }
      if (!text) {
        return true;
      }
      const categoryName = intl
        .formatMessage({ id: categoryMessageId(service.category) })
        .toLowerCase();
      return categoryName.includes(text) || service.workerName.toLowerCase().includes(text);
    });
    return sort ? [...matches].sort(SORTS[sort]) : matches;
  }, [services, range, sort, text, intl]);

  async function openChat(service) {
    try {
      const chat = await run(client.mutations.openChat({ workerId: service.workerId }));
      navigate(`/messages?chat=${encodeURIComponent(chat.id)}`);
    } catch (error) {
      setErrorId(errorMessageId(error));
    }
  }

  const titleId = category ? categoryMessageId(category) : text ? 'ResultadosSearch' : 'VerTodos';

  return (
    <AppLayout>
      <div className="serviciosDetail">
        <Search />
        <div className="mainServiciosDetail">
          <nav className="servicioDetailBar" aria-label="breadcrumb">
            <Link to="/home">
              <p>
                <FormattedMessage id="Home" />
              </p>
            </Link>
            <img className="triangle" src={triangle} alt="" />
            <Link to="/services">
              <p>
                <FormattedMessage id="Services" />
              </p>
            </Link>
            <img className="triangle" src={triangle} alt="" />
            <p>
              <FormattedMessage id={titleId} />
            </p>
          </nav>
          <div className="serviceDetailTitle">
            <h2>
              <FormattedMessage id={titleId} />
            </h2>
          </div>
          <div className="serviciosFilter row">
            <div className="col-4">
              <label className="serviciosFilter-tit" htmlFor="priceFilter">
                <FormattedMessage id="FilterBy" />
              </label>
              <div className="serviciosFilter-det">
                <select
                  id="priceFilter"
                  className="form-select"
                  value={range}
                  onChange={(event) => setRange(event.target.value)}
                >
                  <option value="">{intl.formatMessage({ id: 'PriceHour' })}</option>
                  {PRICE_RANGES.map((item) => (
                    <option key={item.id} value={item.id}>
                      {intl.formatMessage({ id: item.id })}
                    </option>
                  ))}
                </select>
              </div>
            </div>
            <div className="col-4">
              <label className="serviciosFilter-tit" htmlFor="sortBy">
                <FormattedMessage id="OrderBy" />
              </label>
              <div className="serviciosFilter-det">
                <select
                  id="sortBy"
                  className="form-select"
                  value={sort}
                  onChange={(event) => setSort(event.target.value)}
                >
                  <option value="">{intl.formatMessage({ id: 'Caracteristica' })}</option>
                  <option value="name">{intl.formatMessage({ id: 'Nombre' })}</option>
                  <option value="price">{intl.formatMessage({ id: 'Precio' })}</option>
                  <option value="rating">{intl.formatMessage({ id: 'Rating' })}</option>
                </select>
                <button
                  type="button"
                  onClick={() => {
                    setRange('');
                    setSort('');
                  }}
                >
                  <FormattedMessage id="Clean" />
                </button>
              </div>
            </div>
          </div>
          <div className="serviceDetailCont">
            {failed && <EmptyState messageId="serverProblem" />}
            {!failed && services === null && <Loading />}
            {!failed && services !== null && shown.length === 0 && (
              <EmptyState messageId={category ? 'NoServCateg' : 'NoResults'} />
            )}
            {shown.length > 0 && (
              <div className="row">
                {shown.map((service) => (
                  <div className="card text-center" key={service.id}>
                    <div className="card-body cardDetail">
                      <div className="cardDetail-nombre">
                        <img className="imgTrabajadorDetail" src={workerPhoto} alt="" />
                        <div className="cardDetail-nombre-det">
                          <p>{service.workerName}</p>
                          <span>
                            <FormattedMessage id={categoryMessageId(service.category)} />
                          </span>
                        </div>
                      </div>
                      <p className="cardDetail-descripcion">{service.description}</p>
                      <hr />
                      <div className="cardDetail-datos">
                        <div className="cardDetail-datos-primera">
                          <img
                            className="detailIcon"
                            src={ratingIcon}
                            alt={intl.formatMessage({ id: 'Rating' })}
                          />
                          <p>{service.rating ?? '-'}</p>
                          <img className="detailIcon" src={usersIcon} alt="" />
                          <p>
                            <FormattedMessage
                              id="RatingsCount"
                              values={{ count: service.ratingCount }}
                            />
                          </p>
                        </div>
                        <div className="cardDetail-datos-segunda">
                          <p>
                            <FormattedNumber
                              value={service.pricePerHour}
                              style="currency"
                              currency="COP"
                              maximumFractionDigits={0}
                            />
                            /
                            <FormattedMessage id="Hour" />
                          </p>
                        </div>
                      </div>
                      <hr />
                      <div className="buttonCita">
                        <Link to={`/book/${service.id}`}>
                          <p>
                            <FormattedMessage id="Schedule" />
                          </p>
                        </Link>
                      </div>
                      <button
                        type="button"
                        className="buttonMessage"
                        onClick={() => openChat(service)}
                      >
                        <img className="detailIcon" src={messageIcon} alt="" />
                        <FormattedMessage id="SendMessage" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      <MessageModal messageId={errorId} onClose={() => setErrorId(null)} />
    </AppLayout>
  );
}
