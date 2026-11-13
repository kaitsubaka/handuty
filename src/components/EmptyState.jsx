import { FormattedMessage } from 'react-intl';
import emptyIcon from '../assets/emptyIcon.svg';

export default function EmptyState({ messageId, children }) {
  return (
    <div className="emptyPage">
      <img className="emptyIcon" src={emptyIcon} alt="" />
      <p className="emptyPage-bold">
        <FormattedMessage id={messageId} />
      </p>
      {children}
    </div>
  );
}
