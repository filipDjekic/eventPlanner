// src/pages/Organizer/EventDetails.jsx
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';

import '../styles/eventDetails.css';

import * as neweventApi from '../../services/newEventApi';
import * as ticketsApi from '../../services/ticketsApi';
import * as daysApi from '../../services/daysApi';
import * as locationsApi from '../../services/locationsApi';
import * as priceListApi from '../../services/priceListApi';
import * as activitiesApi from '../../services/activitiesApi';

export default function EventDetails(){
  const { id } = useParams();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(true);
  const [data, setData] = useState(null);

  useEffect(() => {
    if (!id) return;
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        const [event, tickets, days, locations, priceLists, activities] = await Promise.all([
          neweventApi.getById(id).catch(() => null),
          ticketsApi.fetchTickets(id).catch(() => []),
          daysApi.listForEventApi(id).catch(() => []),
          locationsApi.listByEvent(id).catch(() => []),
          priceListApi.listAll().catch(() => []),
          activitiesApi.listByEvent(id).catch(() => []),
        ]);
        if (!alive) return;
        const locationIds = new Set((locations || []).map((loc) => String(locationsApi.normalizeId(loc) || '')));
        const filteredPriceLists = (priceLists || []).filter((pl) => locationIds.size === 0 || locationIds.has(String(pl?.LokacijaId || pl?.lokacijaId || '')));
        setData({ event, tickets, days, locations, priceLists: filteredPriceLists, activities });
      } catch (err) {
        console.error('Event details load failed:', err);
        toast.error('Ne mogu da učitam detalje događaja.');
      } finally {
        alive && setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [id]);

  if (!id) {
    return (
      <div className="event-details">
        <h1>Detalji događaja</h1>
        <p>Nedostaje identifikator događaja.</p>
        <button className="event-btn" onClick={() => navigate('/events')}>Nazad na listu događaja</button>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="event-details">
        <h1>Detalji događaja</h1>
        <p>Učitavanje...</p>
      </div>
    );
  }

  if (!data || !data.event) {
    return (
      <div className="event-details">
        <h1>Detalji događaja</h1>
        <p>Podaci nisu dostupni.</p>
        <button className="event-btn" onClick={() => navigate('/events')}>Nazad na listu događaja</button>
      </div>
    );
  }

  const { event, tickets, days, locations, priceLists, activities } = data;

  return (
    <div className="event-details">
      <h1>{event?.Naziv || event?.naziv || 'Događaj'}</h1>
      <p className="event-sub">Status: {event?.Status || event?.status || 'u pripremi'}</p>

      <section>
        <h2>Osnovne informacije</h2>
        <ul>
          <li><strong>Lokacija:</strong> {event?.Lokacija || event?.lokacija || '—'}</li>
          <li><strong>Kapacitet:</strong> {event?.Kapacitet || event?.kapacitet || '—'}</li>
          <li><strong>Početak:</strong> {event?.DatumPocetka || event?.datumPocetka || '—'}</li>
          <li><strong>Kraj:</strong> {event?.DatumKraja || event?.datumKraja || '—'}</li>
        </ul>
      </section>

      <section>
        <h2>Sažetak</h2>
        <div className="event-grid">
          <div className="event-card">
            <span className="event-count">{tickets?.length || 0}</span>
            <span className="event-label">Karte</span>
          </div>
          <div className="event-card">
            <span className="event-count">{days?.length || 0}</span>
            <span className="event-label">Dani</span>
          </div>
          <div className="event-card">
            <span className="event-count">{locations?.length || 0}</span>
            <span className="event-label">Lokacije</span>
          </div>
          <div className="event-card">
            <span className="event-count">{priceLists?.length || 0}</span>
            <span className="event-label">Cenovnici</span>
          </div>
          <div className="event-card">
            <span className="event-count">{activities?.length || 0}</span>
            <span className="event-label">Aktivnosti</span>
          </div>
        </div>
      </section>

      <section>
        <h2>Opis (JSON)</h2>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </section>

      <button className="event-btn" onClick={() => navigate('/events')}>Nazad na događaje</button>
    </div>
  );
}
