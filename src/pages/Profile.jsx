import { useEffect, useMemo, useState } from 'react';
import { Button, Form, Modal } from 'react-bootstrap';
import { FormattedDate, FormattedMessage, FormattedNumber, useIntl } from 'react-intl';
import clientAvatar from '../assets/avatarCliente.png';
import workerAvatar from '../assets/avatarTrabajador.png';
import editIcon from '../assets/perfilEditIcon.svg';
import deleteIcon from '../assets/deleteIcon.svg';
import ratingIcon from '../assets/califIcon.svg';
import addIcon from '../assets/addNuevo.svg';
import AppLayout from '../components/AppLayout';
import EmptyState from '../components/EmptyState';
import MessageModal from '../components/MessageModal';
import ServiceModal from '../components/ServiceModal';
import { categoryMessageId } from '../constants/categories';
import { ROLES } from '../constants/roles';
import { useSession } from '../context/Session';
import { client } from '../lib/amplify';
import { errorMessageId, run } from '../lib/api';
import { fromAwsDate } from '../lib/dates';
import { myServices } from '../lib/queries';
import { contactErrors } from '../lib/validation';
import './Profile.css';

const CONTACT_FIELDS = [
  { name: 'city', messageId: 'City', errorId: 'VerCity' },
  { name: 'address', messageId: 'Address', errorId: 'VerAdd' },
  { name: 'phone', messageId: 'phone', errorId: 'VerPho' },
];

function ContactModal({ show, initial, onClose, onSaved }) {
  const [form, setForm] = useState(initial);
  const [touched, setTouched] = useState(false);
  const [saving, setSaving] = useState(false);
  const [errorId, setErrorId] = useState(null);

  useEffect(() => {
    if (show) {
      setForm(initial);
      setTouched(false);
      setErrorId(null);
    }
  }, [show, initial]);

  const errors = contactErrors(form);

  async function handleSubmit(event) {
    event.preventDefault();
    setTouched(true);
    if (errors.size > 0) {
      return;
    }
    setSaving(true);
    try {
      await run(client.mutations.updateProfile(form));
      await onSaved();
    } catch (error) {
      setErrorId(errorMessageId(error));
    } finally {
      setSaving(false);
    }
  }

  return (
    <Modal show={show} onHide={onClose} animation={false}>
      <Form noValidate onSubmit={handleSubmit}>
        <Modal.Header closeButton>
          <Modal.Title>
            <FormattedMessage id="Modify" />
          </Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {CONTACT_FIELDS.map((field) => (
            <Form.Group className="mb-3" controlId={`contact-${field.name}`} key={field.name}>
              <Form.Label>
                <FormattedMessage id={field.messageId} />
              </Form.Label>
              <Form.Control
                name={field.name}
                value={form[field.name]}
                onChange={(event) => setForm({ ...form, [field.name]: event.target.value })}
                isInvalid={touched && errors.has(field.name)}
              />
              <Form.Control.Feedback type="invalid">
                <FormattedMessage id={field.errorId} />
              </Form.Control.Feedback>
            </Form.Group>
          ))}
          {errorId && (
            <p className="text-danger mb-0">
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

function WorkerServices({ session }) {
  const intl = useIntl();
  const [services, setServices] = useState(null);
  const [editing, setEditing] = useState(undefined);
  const [errorId, setErrorId] = useState(null);

  useEffect(() => {
    myServices(session)
      .then(setServices)
      .catch((error) => {
        console.error('[profile] could not load services', error);
        setErrorId('serverProblem');
        setServices([]);
      });
  }, [session]);

  const takenCategories = useMemo(() => (services ?? []).map((service) => service.category), [services]);

  function handleSaved(saved) {
    setServices((current) =>
      current.some((service) => service.id === saved.id)
        ? current.map((service) => (service.id === saved.id ? saved : service))
        : [...current, saved],
    );
    setEditing(undefined);
  }

  async function handleDelete(service) {
    if (!window.confirm(intl.formatMessage({ id: 'DeleteServiceConfirm' }))) {
      return;
    }
    try {
      await run(client.mutations.deleteService({ id: service.id }));
      setServices((current) => current.filter((item) => item.id !== service.id));
    } catch (error) {
      setErrorId(errorMessageId(error));
    }
  }

  return (
    <div className="perfilMain-servicios">
      <div className="perfilMain-servicios-title">
        <h3>
          <FormattedMessage id="MyServs" />
        </h3>
        <p>
          <FormattedMessage id="HereYou" />
        </p>
      </div>
      <hr />
      {services?.length === 0 && (
        <EmptyState messageId="NoServicesAdded">
          <p>
            <FormattedMessage id="FirstStep" />
          </p>
        </EmptyState>
      )}
      {services?.map((service) => (
        <div key={service.id} className="servicioDetailPerfil">
          <div className="servicioDetailPerfil-primera">
            <p>
              <FormattedMessage id={categoryMessageId(service.category)} />
            </p>
            <div className="servicioDetailIconos">
              <button type="button" className="iconButton" onClick={() => setEditing(service)}>
                <img className="iconPerfil" src={editIcon} alt={intl.formatMessage({ id: 'EditServ' })} />
              </button>
              <button type="button" className="iconButton" onClick={() => handleDelete(service)}>
                <img className="iconPerfil" src={deleteIcon} alt={intl.formatMessage({ id: 'DeleteServ' })} />
              </button>
            </div>
          </div>
          <p className="servicioDetailPerfil-descripcion">{service.description}</p>
          <div className="servicioDetailPerfil-segunda">
            <img className="iconPerfil" src={ratingIcon} alt={intl.formatMessage({ id: 'Rating' })} />
            <p>{service.rating ?? '-'}</p>
            <p className="costo">
              <FormattedMessage id="Cost" />
            </p>
            <p>
              <FormattedNumber value={service.pricePerHour} style="currency" currency="COP" maximumFractionDigits={0} />/
              <FormattedMessage id="Hour" />
            </p>
          </div>
          <hr />
        </div>
      ))}
      <div className="perfilMain-servicios-boton">
        <button type="button" className="iconButton" onClick={() => setEditing(null)}>
          <img className="iconPerfil" src={addIcon} alt="" />
          <p>
            <FormattedMessage id="AddServ" />
          </p>
        </button>
      </div>
      <ServiceModal
        show={editing !== undefined}
        service={editing}
        takenCategories={takenCategories}
        onClose={() => setEditing(undefined)}
        onSaved={handleSaved}
      />
      <MessageModal messageId={errorId} onClose={() => setErrorId(null)} />
    </div>
  );
}

export default function Profile() {
  const session = useSession();
  const { profile, privateProfile } = session;
  const isWorker = profile.role === ROLES.WORKER;
  const [editingContact, setEditingContact] = useState(false);
  const contact = useMemo(
    () => ({ city: profile.city, address: privateProfile.address, phone: privateProfile.phone }),
    [profile.city, privateProfile.address, privateProfile.phone],
  );

  return (
    <AppLayout>
      <div className="perfil">
        <div className="perfil-title">
          <h2>
            <FormattedMessage id="Profile" />
          </h2>
        </div>
        <div className="perfil-main">
          <div className="mainHome-der">
            <div className="perfil-main-persona">
              <img className="imagen" src={isWorker ? workerAvatar : clientAvatar} alt="" />
              <h3>{profile.name}</h3>
              <p>
                <FormattedMessage id={isWorker ? 'Worker' : 'Client'} />
              </p>
            </div>
            <div className="perfil-main-informacion">
              <p>
                <FormattedMessage id="Information" />
              </p>
              <div className="perfil-main-informacionDetail">
                <p>
                  <span><FormattedMessage id="Tel" /></span> {privateProfile.phone}
                </p>
                <p>
                  <span><FormattedMessage id="idNumber" /></span> {privateProfile.idNumber}
                </p>
                <p>
                  <span><FormattedMessage id="FecNac" /></span>{' '}
                  <FormattedDate value={fromAwsDate(privateProfile.birthDate)} year="numeric" month="short" day="numeric" />
                </p>
                <p>
                  <span><FormattedMessage id="City" /></span> {profile.city}
                </p>
                <p>
                  <span><FormattedMessage id="Address" /></span> {privateProfile.address}
                </p>
              </div>
            </div>
            <div className="buttonPerfil">
              <button type="button" onClick={() => setEditingContact(true)}>
                <span>
                  <FormattedMessage id="Modify" />
                </span>
              </button>
            </div>
          </div>
          {isWorker && <WorkerServices session={session} />}
        </div>
      </div>
      <ContactModal
        show={editingContact}
        initial={contact}
        onClose={() => setEditingContact(false)}
        onSaved={async () => {
          await session.refresh();
          setEditingContact(false);
        }}
      />
    </AppLayout>
  );
}
