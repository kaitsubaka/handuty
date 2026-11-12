import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import allImage from '../assets/ilTodos.svg';
import AppLayout from '../components/AppLayout';
import Search from '../components/Search';
import { CATEGORIES } from '../constants/categories';
import './Services.css';

const TILES = [
  ...CATEGORIES.map((category) => ({
    messageId: category.messageId,
    image: category.image,
    to: `/services/results?category=${category.key}`,
  })),
  { messageId: 'VerTodos', image: allImage, to: '/services/results' },
];

export default function Services() {
  return (
    <AppLayout>
      <div className="servicios">
        <Search />
        <div className="row mainServicios">
          {TILES.map((tile) => (
            <div key={tile.to} className="col colServicio">
              <Link className="card" to={tile.to}>
                <div className="cardInt">
                  <img className="card-img-top" src={tile.image} alt="" />
                </div>
                <div className="card-body">
                  <h2 className="card-title text-center">
                    <FormattedMessage id={tile.messageId} />
                  </h2>
                </div>
              </Link>
            </div>
          ))}
        </div>
      </div>
    </AppLayout>
  );
}
