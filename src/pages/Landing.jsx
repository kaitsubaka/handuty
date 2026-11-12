import { Link } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import illustration from '../assets/principal.svg';
import logo from '../assets/logoBar.png';
import clientIcon from '../assets/perfilBar.svg';
import workerIcon from '../assets/trabajador.svg';
import Graph from '../components/Graph';
import { useSession } from '../context/Session';
import { signUpOpen } from '../lib/config';
import './Landing.css';

export default function Landing() {
  const { status, signOut } = useSession();
  const signedIn = status === 'ready' || status === 'needsProfile';

  return (
    <div className="Principal">
      <div className="principal-banner">
        <header className="principal-bar">
          <h1>
            <img className="logoPrincipal" src={logo} alt="Handuty" />
          </h1>
          {signedIn ? (
            <>
              <div className="principal-bar-izq">
                <Link to="/home">
                  <p>
                    <FormattedMessage id="Home" />
                  </p>
                </Link>
                <Link to="/appointments">
                  <p>
                    <FormattedMessage id="citas" />
                  </p>
                </Link>
              </div>
              <div className="principal-bar-der">
                <button type="button" className="bar-button" onClick={signOut}>
                  <p>
                    <FormattedMessage id="exit" />
                  </p>
                </button>
              </div>
            </>
          ) : (
            <div className="principal-bar-der">
              <Link to="/login">
                <p>
                  <FormattedMessage id="Login" />
                </p>
              </Link>
              {signUpOpen && (
                <Link to="/register">
                  <p>
                    <FormattedMessage id="Register" />
                  </p>
                </Link>
              )}
            </div>
          )}
        </header>
        <div className="principal-cont">
          <div className="principal-cont-izq">
            <h2>
              <FormattedMessage id="TrabajemosJuntos" />
            </h2>
            <p>
              <FormattedMessage id="TextoPresentacion" />
            </p>
          </div>
          <div className="principal-cont-der">
            <img className="principal-cont-il" src={illustration} alt="" />
          </div>
        </div>
      </div>
      <div className="principal-segundo">
        <div className="principal-segundo-izq">
          <img className="iconPrincipal" src={clientIcon} alt="" />
          <p className="principal-segundo-der-prin">
            <FormattedMessage id="ClientePrincipal" />
          </p>
          <p>
            <FormattedMessage id="ClientePrincipalTexto" />
          </p>
        </div>
        <div className="principal-segundo-der">
          <img className="iconPrincipal" src={workerIcon} alt="" />
          <p className="principal-segundo-der-prin">
            <FormattedMessage id="TrabajadorPrincipal" />
          </p>
          <p>
            <FormattedMessage id="TrabajadorPrincipalTexto" />
          </p>
        </div>
      </div>
      <div className="principal-tercero">
        <div className="principal-tercero-txt">
          <p className="principal-tercero-txt-prin">
            <FormattedMessage id="Descubre" />
          </p>
          <p>
            <FormattedMessage id="DescubreText" />
          </p>
        </div>
        <Graph />
      </div>
    </div>
  );
}
