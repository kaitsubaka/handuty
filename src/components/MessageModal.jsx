import { Button, Modal } from 'react-bootstrap';
import { FormattedMessage } from 'react-intl';

/** Error or success dialog; `messageId` is the body text, `null` hides it. */
export default function MessageModal({ messageId, title, variant = 'danger', buttonId = 'Close', onClose }) {
  return (
    <Modal show={messageId != null} onHide={onClose} animation={false}>
      <Modal.Header closeButton>
        <Modal.Title>{title ?? <FormattedMessage id={variant === 'danger' ? 'ErrorTitle' : 'Done'} />}</Modal.Title>
      </Modal.Header>
      <Modal.Body>{messageId && <FormattedMessage id={messageId} />}</Modal.Body>
      <Modal.Footer>
        <Button variant={variant} onClick={onClose}>
          <FormattedMessage id={buttonId} />
        </Button>
      </Modal.Footer>
    </Modal>
  );
}
