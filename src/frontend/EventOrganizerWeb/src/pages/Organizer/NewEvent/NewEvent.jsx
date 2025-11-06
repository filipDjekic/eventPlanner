// src/pages/Organizer/NewEvent/NewEvent.jsx
import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import BasicInfo from './BasicInfo';
import Tickets from './Tickets';
import Days from './Days';
import Areas from './Areas';
import Locations from './Locations';
import PriceList from './PriceList';
import Activities from './Activities';
import Section from './Section';

import '../../../styles/NewEvent/NewEvent.css';

import * as neweventApi from '../../../services/newEventApi';
import * as ticketsApi from '../../../services/ticketsApi';
import * as daysApi from '../../../services/daysApi';
import * as locationsApi from '../../../services/locationsApi';
import * as priceListApi from '../../../services/priceListApi';
import * as activitiesApi from '../../../services/activitiesApi';

const initialPublishState = {
  open: false,
  loading: false,
  data: null,
  error: '',
  published: false,
};

export default function NewEvent(){
  const [eventId, setEventId] = useState(null);
  const [capFromBasic, setCapFromBasic] = useState(null);
  const [infFromBasic, setInfFromBasic] = useState(false);
  const [publishState, setPublishState] = useState(initialPublishState);

  const navigate = useNavigate();

  async function loadSnapshot(id){
    const [event, tickets, days, locsRaw, allPriceLists, activities] = await Promise.all([
      neweventApi.getById(id),
      ticketsApi.fetchTickets(id).catch(() => []),
      daysApi.listForEventApi(id).catch(() => []),
      locationsApi.listByEvent(id).catch(() => []),
      priceListApi.listByEvent(id).catch(() => []),
      activitiesApi.listByEvent(id).catch(() => []),
    ]);

    const locations = Array.isArray(locsRaw) ? locsRaw : [];
    const locationIds = new Set(
      locations
        .map((loc) => String(locationsApi.normalizeId(loc) || ''))
        .filter(Boolean)
    );

    const priceLists = (Array.isArray(allPriceLists) ? allPriceLists : [])
      .filter((pl) => locationIds.size === 0 || locationIds.has(String(pl?.LokacijaId || pl?.lokacijaId || '')));

    return { event, tickets, days, locations, priceLists, activities };
  }

  const openPublishModal = async () => {
    if (!eventId){
      toast.error('Sačuvaj osnovne informacije pre objave.');
      return;
    }
    setPublishState({ ...initialPublishState, open: true, loading: true });
    try {
      const data = await loadSnapshot(eventId);
      setPublishState({ open: true, loading: false, data, error: '', published: data?.event?.Status === 'objavljen' });
    } catch (err) {
      console.error('Publish snapshot failed:', err);
      setPublishState({ open: true, loading: false, data: null, error: 'Ne mogu da prikupim podatke za objavu.', published: false });
    }
  };

  const closePublishModal = () => {
    setPublishState(initialPublishState);
  };

  const handlePublish = async () => {
    if (!eventId) return;
    setPublishState((prev) => ({ ...prev, loading: true, error: '' }));
    try {
      await neweventApi.updateDraft(eventId, { Status: 'objavljen' });
      setPublishState((prev) => ({
        ...prev,
        loading: false,
        published: true,
        data: prev.data ? { ...prev.data, event: { ...(prev.data.event || {}), Status: 'objavljen' } } : prev.data,
      }));
      toast.success('Događaj je objavljen.');
    } catch (err) {
      console.error('Publish event failed:', err);
      setPublishState((prev) => ({ ...prev, loading: false, error: 'Objava nije uspela. Pokušaj ponovo.' }));
    }
  };

  const handleFinish = () => {
    closePublishModal();
    window.location.reload();
  };

  const handleGoToEvent = () => {
    closePublishModal();
    if (eventId) {
      navigate(`/events/${eventId}`);
    }
  };

  return (
    <div className="ne-page">
      <div className="ne-page__glow" aria-hidden />
      <div className="ne-page__glow ne-page__glow--secondary" aria-hidden />

      <div className="ne-container">
        <div className="ne-hero">
          <span className="ne-hero__badge">Kreiraj događaj</span>
          <h1 className="ne-title">Novi događaj</h1>
          <p className="ne-subtitle">Popuni osnovne informacije i poveži sve podforme kako bi kreirao kompletan događaj spreman za objavu.</p>
        </div>

        <BasicInfo
          eventId={eventId}
          onEventId={(id) => setEventId(id)}
          onBasicInfoChange={({ capacity, infinite }) => {
            setCapFromBasic(capacity);
            setInfFromBasic(!!infinite);
          }}
        />
        <Tickets eventId={eventId} initialCapacity={capFromBasic} initialInfinite={infFromBasic} />
        <Days eventId={eventId} />
        <Areas eventId={eventId} />
        <Locations eventId={eventId} />
        <PriceList eventId={eventId} />
        <Activities eventId={eventId} />

        <Section
          title="Objava događaja"
          subtitle="Pregledaj kompletan draft i objavi događaj kada si spreman da ga podeliš sa posetiocima."
          badges={[
            eventId ? { label: `Draft ID ${eventId}`, tone: 'success' } : { label: 'Draft nije kreiran', tone: 'warning' },
            publishState.published ? { label: 'Objavljeno', tone: 'success' } : { label: 'U pripremi', tone: 'info' },
            publishState.loading ? { label: 'Priprema...', tone: 'info' } : null,
          ].filter(Boolean)}
          actions={(
            <button className="publish-btn" onClick={openPublishModal} disabled={!eventId}>
              Objavi događaj
            </button>
          )}
        >
          <p className="publish-hint">Objava je moguća tek nakon što popuniš sve obavezne sekcije i sačuvaš draft.</p>
        </Section>
      </div>

      {publishState.open && (
        <div className="publish-modal__backdrop">
          <div className="publish-modal">
            <div className="publish-modal__head">
              <h3>Pregled događaja</h3>
              <button className="publish-btn-secondary" onClick={closePublishModal}>Zatvori</button>
            </div>
            <div className="publish-modal__body">
              {publishState.loading && <div className="publish-modal__status">Učitavanje podataka…</div>}
              {!publishState.loading && publishState.error && (
                <div className="publish-modal__error">{publishState.error}</div>
              )}
              {!publishState.loading && !publishState.error && publishState.data && (
                <div className="publish-modal__content">
                  <section>
                    <h4>Osnovne informacije</h4>
                    <p><strong>Naziv:</strong> {publishState.data.event?.Naziv || publishState.data.event?.naziv || '—'}</p>
                    <p><strong>Status:</strong> {publishState.data.event?.Status || publishState.data.event?.status || 'u pripremi'}</p>
                    <p><strong>Kapacitet:</strong> {publishState.data.event?.Kapacitet || publishState.data.event?.kapacitet || '—'}</p>
                  </section>
                  <section>
                    <h4>Sažetak</h4>
                    <ul>
                      <li>Karte: {Array.isArray(publishState.data.tickets) ? publishState.data.tickets.length : 0}</li>
                      <li>Dani: {Array.isArray(publishState.data.days) ? publishState.data.days.length : 0}</li>
                      <li>Lokacije: {Array.isArray(publishState.data.locations) ? publishState.data.locations.length : 0}</li>
                      <li>Cenovnici: {Array.isArray(publishState.data.priceLists) ? publishState.data.priceLists.length : 0}</li>
                      <li>Aktivnosti: {Array.isArray(publishState.data.activities) ? publishState.data.activities.length : 0}</li>
                    </ul>
                  </section>
                  <section className="publish-modal__raw">
                    <h4>Detalji (JSON)</h4>
                    <pre>{JSON.stringify(publishState.data, null, 2)}</pre>
                  </section>
                </div>
              )}
            </div>
            <div className="publish-modal__actions">
              <button className="publish-btn" onClick={handlePublish} disabled={publishState.loading || publishState.published}>
                {publishState.published ? 'Objavljeno' : 'Objavi događaj'}
              </button>
              <button className="publish-btn-secondary" onClick={handleFinish}>Završi</button>
              <button className="publish-btn-secondary" onClick={handleGoToEvent}>Idi na događaj</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
