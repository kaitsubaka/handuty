import { Link, NavLink, useNavigate } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import logo from '../assets/logoBar.png';
import logoutIcon from '../assets/logoutBar.svg';
import { NAVIGATION } from '../constants/navigation';
import { useSession } from '../context/Session';
import './Sidebar.css';

export default function Sidebar() {
  const { profile, signOut } = useSession();
  const navigate = useNavigate();
  const items = NAVIGATION[profile?.role] ?? [];

  async function handleSignOut() {
    await signOut();
    navigate('/');
  }

  return (
    <nav className="Sidebar">
      <div className="logobar">
        <Link to="/home">
          <img className="logoimg" src={logo} alt="Handuty" />
        </Link>
      </div>
      <div className="menubar">
        <ul className="bar-items">
          {items.map((item) => (
            <li key={item.path} className="bar-text">
              <NavLink to={item.path} style={({ isActive }) => (isActive ? { color: '#cccccc' } : undefined)}>
                <img className="iconItems" src={item.icon} alt="" />
                <span>
                  <FormattedMessage id={item.messageId} />
                </span>
              </NavLink>
            </li>
          ))}
        </ul>
      </div>
      <div className="outbar">
        <ul className="bar-items">
          <li className="bar-text">
            <button type="button" className="bar-button" onClick={handleSignOut}>
              <img className="iconItems" src={logoutIcon} alt="" />
              <span>
                <FormattedMessage id="exit" />
              </span>
            </button>
          </li>
        </ul>
      </div>
    </nav>
  );
}
