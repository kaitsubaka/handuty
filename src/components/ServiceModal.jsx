import { useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { FormattedMessage, useIntl } from 'react-intl';
import { CATEGORIES } from '../constants/categories';
import { client } from '../lib/amplify';
import { errorMessageId, run } from '../lib/api';

const MIN_PRICE = 1000;
const MAX_PRICE = 10_000_000;
const EMPTY = { category: CATEGORIES[0].key, pricePerHour: '', description: '' };

function validate(form) {
  const errors = {};
  const price = Number(form.pricePerHour);
  if (!Number.isInteger(price) || price < MIN_PRICE || price > MAX_PRICE) {
    errors.pricePerHour = 'VerPrice';
  }
  const length = form.description.trim().length;
  if (length < 10 || length > 160) {
    errors.description = 'VerDescription';
  }
  return errors;
}

/** Creates a service, or edits `service` when given. Calls `onSaved` with the saved service. */
export default function ServiceModal({ show, service, takenCategories, onClose, onSaved }) {
  const intl = useIntl();
  const [form, setForm] = useState(EMPTY);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorId, setErrorId] = useState(null);

  function resetForm() {
    const free = CATEGORIES.find((category) => !takenCategories.includes(category.key));
    setForm(
      service
        ? {
            category: service.category,
            pricePerHour: String(service.pricePerHour),
            description: service.description,
          }
        : { ...EMPTY, category: free?.key ?? EMPTY.category },
    );
    setTouched(false);
    setErrorId(null);
  }

  const errors = validate(form);

  function handleChange(event) {
    setForm({ ...form, [event.target.name]: event.target.value });
  }

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (Object.keys(errors).length > 0) {
      return;
    }
    setSaving(true);
    try {
      const saved = await run(
        client.mutations.saveService({
          id: service?.id,
          category: form.category,
          pricePerHour: Number(form.pricePerHour),
          description: form.description.trim(),
        }),
      );
      onSaved(saved);
    } catch (error) {
      setErrorId(errorMessageId(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal show={show} onShow={resetForm} onHide={onClose} animation={false}>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FormattedMessage id={service ? 'EditServ' : 'AddServ'} />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          <p>
            <FormattedMessage id="AddNew" />
          </p>
          <Form.Group className="mb-3" controlId="serviceCategory">
            <Form.Label>
              <FormattedMessage id="selCateg" />
            </Form.Label>
            <Form.Select name="category" value={form.category} onChange={handleChange}>
              {CATEGORIES.map((category) => (
                <option
                  key={category.key}
                  value={category.key}
                  disabled={
                    category.key !== service?.category && takenCategories.includes(category.key)
                  }
                >
                  {intl.formatMessage({ id: category.messageId })}
                </option>
              ))}
            </Form.Select>
          </Form.Group>
          <Form.Group className="mb-3" controlId="servicePrice">
            <Form.Label>
              <FormattedMessage id="priceHour" />
            </Form.Label>
            <Form.Control
              type="number"
              min={MIN_PRICE}
              max={MAX_PRICE}
              step={500}
              name="pricePerHour"
              value={form.pricePerHour}
              onChange={handleChange}
              isInvalid={touched && Boolean(errors.pricePerHour)}
            />
            <Form.Control.Feedback type="invalid">
              <FormattedMessage id="VerPrice" />
            </Form.Control.Feedback>
          </Form.Group>
          <Form.Group controlId="serviceDescription">
            <Form.Label>
              <FormattedMessage id="Description" />
            </Form.Label>
            <Form.Control
              as="textarea"
              rows={3}
              maxLength={160}
              name="description"
              value={form.description}
              onChange={handleChange}
              isInvalid={touched && Boolean(errors.description)}
            />
            <Form.Control.Feedback type="invalid">
              <FormattedMessage id="VerDescription" />
            </Form.Control.Feedback>
          </Form.Group>
          {errorId && (
            <p className="text-danger mt-3 mb-0">
              <FormattedMessage id={errorId} />
            </p>
          )}
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={onClose}>
            <FormattedMessage id="Cancel" />
          </Button>
          <Button type="submit" variant="dark" disabled={saving}>
            <FormattedMessage id="Accept" />
          </Button>
        </Modal.Footer>
      </Form>
    </Modal>
  );
}
