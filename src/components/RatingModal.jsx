import { Button, Modal } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';

const STARS = [1, 2, 3, 4, 5];

export default function RatingModal({ booking, onRate, onClose }) {
  const intl = useIntl();
  return (
    <Modal show={booking != null} onHide={onClose} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>
          <FormattedMessage id="Calificar" />
        </Modal.Title>
      </Modal.Header>
      <Modal.Body>
        <FormattedMessage id="CalServ" /> {booking?.workerName}
        <div className="ec-stars-wrapper">
          {STARS.map((stars) => (
            <button
              key={stars}
              type="button"
              onClick={() => onRate(booking, stars)}
              title={intl.formatMessage({ id: 'RateWith' }, { stars })}
            >
              &#9733;
            </button>
          ))}
        </div>
      </Modal.Body>
      <Modal.Footer>
        <Button variant="danger" onClick={onClose}>
          <FormattedMessage id="Close" />
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
