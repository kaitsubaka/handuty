import { Navigate, useLocation } from 'react-router-dom';
import { FormattedMessage } from 'react-intl';
import { useSession } from '../context/Session';
import Loading from './Loading';

/** Renders `children` only for a signed-in user with a profile (and the given role, if any). */
export default function RequireSession({ role, children }) {
  const session = useSession();
  const location = useLocation();

  switch (session.status) {
    case 'loading':
      return <Loading />;
    case 'signedOut':
      return <Navigate to="/login" replace state={{ from: location.pathname }} />;
    case 'needsProfile':
      return <Navigate to="/complete-profile" replace />;
    case 'error':
      return (
        <div className="emptyPage">
          <p className="emptyPage-bold">
            <FormattedMessage id="serverProblem" />
          </p>
        </div>
      );
    default:
      if (role && session.profile.role !== role) {
        return <Navigate to="/home" replace />;
      }
      return children;
  }
}
