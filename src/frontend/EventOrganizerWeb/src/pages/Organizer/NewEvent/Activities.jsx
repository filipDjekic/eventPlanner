// src/pages/Organizer/NewEvent/Activities.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Section from './Section';
import '../../../styles/NewEvent/activities.css';

import * as daysApi from '../../../services/daysApi';
import * as locationsApi from '../../../services/locationsApi';
import * as activitiesApi from '../../../services/activitiesApi';

const TIPOVI_AKTIVNOSTI = ['Koncert', 'Predavanje', 'Igrica', 'Izlozba', 'Radionica', 'Druzenje', 'Ostalo'];

function normalizeDay(raw, index = 0){
  const id = raw?.Id || raw?._id || raw?.id || raw?.ID || raw?._id?.$oid;
  if (!id) return null;
  const name = raw?.Naziv || raw?.naziv || `Dan ${index + 1}`;
  const dateRaw = raw?.DatumOdrzavanja || raw?.datumOdrzavanja || raw?.Datum || raw?.datum;
  const date = dateRaw ? new Date(dateRaw) : null;
  const timestamp = date && !Number.isNaN(date.getTime()) ? date.getTime() : null;
  return {
    Id: id,
    Naziv: name,
    Datum: date,
    DatumLabel: timestamp ? formatDate(date) : '',
    timestamp,
  };
}

function normalizeLocation(raw){
  const id = locationsApi.normalizeId(raw);
  if (!id) return null;
  return {
    Id: id,
    Naziv: raw?.Naziv || raw?.naziv || 'Lokacija',
    Tip: raw?.TipLokacije || raw?.tipLokacije || raw?.Tip || raw?.tip || '',
    Color: raw?.HEXboja || raw?.hexBoja || raw?.Boja || '#1f6feb',
  };
}

function normalizeActivity(raw){
  const id = activitiesApi.normalizeId(raw);
  if (!id) return null;
  const startRaw = raw?.DatumVremePocetka || raw?.datumVremePocetka || raw?.DatumStart || raw?.start;
  const endRaw = raw?.DatumVremeKraja || raw?.datumVremeKraja || raw?.DatumEnd || raw?.end;
  const start = startRaw ? new Date(startRaw) : null;
  const end = endRaw ? new Date(endRaw) : null;
  return {
    Id: id,
    Naziv: raw?.Naziv || raw?.naziv || '',
    Opis: raw?.Opis || raw?.opis || '',
    Lokacija: raw?.Lokacija || raw?.lokacija || '',
    Dan: raw?.Dan || raw?.dan || '',
    Dogadjaj: raw?.Dogadjaj || raw?.dogadjaj || '',
    Tip: raw?.Tip || raw?.tip || 'Ostalo',
    Start: start,
    End: end,
  };
}

function formatDate(date){
  if (!date || Number.isNaN(date.getTime())) return '';
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function formatTime(date){
  if (!date || Number.isNaN(date.getTime())) return '';
  const hh = String(date.getHours()).padStart(2, '0');
  const mm = String(date.getMinutes()).padStart(2, '0');
  return `${hh}:${mm}`;
}

function toInputValue(date){
  if (!date || Number.isNaN(date.getTime())) return '';
  const local = new Date(date.getTime() - date.getTimezoneOffset() * 60000);
  return local.toISOString().slice(0, 16);
}

const EMPTY_FORM = {
  Naziv: '',
  Opis: '',
  Dan: '',
  Lokacija: '',
  Tip: 'Ostalo',
  start: '',
  end: '',
};

export default function Activities({ eventId }){
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [days, setDays] = useState([]);
  const [locations, setLocations] = useState([]);
  const [activities, setActivities] = useState([]);

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);

  const hasEvent = Boolean(eventId);

  const fetchDays = useCallback(async () => {
    if (!eventId){
      setDays([]);
      return;
    }
    try{
      let raw = await daysApi.listForEventApi(eventId).catch(() => []);
      if (!Array.isArray(raw) || raw.length === 0){
        const all = await daysApi.listAll().catch(() => []);
        raw = (all || []).filter(d => String(d?.Dogadjaj ?? d?.dogadjaj) === String(eventId));
      }
      const normalized = (raw || [])
        .map((item, index) => normalizeDay(item, index))
        .filter(Boolean)
        .sort((a, b) => (a.timestamp ?? 0) - (b.timestamp ?? 0));
      setDays(normalized);
    }catch(err){
      console.warn('Greška pri učitavanju dana za aktivnosti:', err);
      toast.error('Ne mogu da osvežim dane za aktivnosti.');
    }
  }, [eventId]);

  const fetchLocations = useCallback(async () => {
    if (!eventId){
      setLocations([]);
      return;
    }
    try{
      const list = await locationsApi.listByEvent(eventId).catch(() => []);
      const normalized = (list || []).map(normalizeLocation).filter(Boolean);
      setLocations(normalized);
    }catch(err){
      console.warn('Greška pri učitavanju lokacija za aktivnosti:', err);
      toast.error('Ne mogu da osvežim lokacije.');
    }
  }, [eventId]);

  const refreshActivities = useCallback(async () => {
    if (!eventId){
      setActivities([]);
      return;
    }
    try{
      const list = await activitiesApi.listByEvent(eventId).catch(() => []);
      const normalized = (list || []).map(normalizeActivity).filter(Boolean);
      normalized.sort((a, b) => {
        const dayA = a.Dan || '';
        const dayB = b.Dan || '';
        if (dayA !== dayB) return dayA < dayB ? -1 : 1;
        const sa = a.Start && !Number.isNaN(a.Start.getTime()) ? a.Start.getTime() : 0;
        const sb = b.Start && !Number.isNaN(b.Start.getTime()) ? b.Start.getTime() : 0;
        return sa - sb;
      });
      setActivities(normalized);
    }catch(err){
      console.warn('Greška pri učitavanju aktivnosti:', err);
      toast.error('Ne mogu da osvežim aktivnosti.');
    }
  }, [eventId]);

  useEffect(() => {
    if (!eventId){
      setForm({ ...EMPTY_FORM });
      setEditingId(null);
      setActivities([]);
      setDays([]);
      setLocations([]);
      return;
    }
    let alive = true;
    (async () => {
      try{
        setLoading(true);
        await Promise.all([fetchDays(), fetchLocations(), refreshActivities()]);
      }finally{
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [eventId, fetchDays, fetchLocations, refreshActivities]);

  useEffect(() => {
    function onDaysUpdated(e){
      if (!eventId) return;
      const detailId = e?.detail?.eventId;
      if (detailId && String(detailId) !== String(eventId)) return;
      fetchDays();
      refreshActivities();
    }
    window.addEventListener('ne:days:updated', onDaysUpdated);
    return () => window.removeEventListener('ne:days:updated', onDaysUpdated);
  }, [eventId, fetchDays, refreshActivities]);

  useEffect(() => {
    function onLocationsUpdated(e){
      if (!eventId) return;
      const detailId = e?.detail?.eventId;
      if (detailId && String(detailId) !== String(eventId)) return;
      fetchLocations();
    }
    window.addEventListener('ne:locations:updated', onLocationsUpdated);
    return () => window.removeEventListener('ne:locations:updated', onLocationsUpdated);
  }, [eventId, fetchLocations]);

  useEffect(() => {
    if (editingId) return;
    setForm(prev => ({
      ...prev,
      Dan: prev.Dan || days[0]?.Id || '',
      Lokacija: prev.Lokacija || locations[0]?.Id || '',
    }));
  }, [days, locations, editingId]);

  const dayById = useMemo(() => {
    const map = new Map();
    days.forEach(d => { if (d?.Id) map.set(String(d.Id), d); });
    return map;
  }, [days]);

  const locationById = useMemo(() => {
    const map = new Map();
    locations.forEach(l => { if (l?.Id) map.set(String(l.Id), l); });
    return map;
  }, [locations]);

  const scheduleRows = useMemo(() => {
    return activities.map(act => {
      const day = dayById.get(String(act.Dan || ''));
      const loc = locationById.get(String(act.Lokacija || ''));
      const dayStamp = day?.timestamp ?? 0;
      const start = act.Start && !Number.isNaN(act.Start.getTime()) ? act.Start : null;
      const end = act.End && !Number.isNaN(act.End.getTime()) ? act.End : null;
      return {
        ...act,
        DayName: day?.Naziv || 'Nedefinisano',
        DayLabel: day?.DatumLabel || '',
        LocationName: loc?.Naziv || 'Lokacija',
        LocationTip: loc?.Tip || '',
        StartLabel: formatTime(start),
        EndLabel: formatTime(end),
        SortKey: dayStamp,
        StartSort: start ? start.getTime() : 0,
      };
    }).sort((a, b) => {
      if (a.SortKey !== b.SortKey) return a.SortKey - b.SortKey;
      if (a.StartSort !== b.StartSort) return a.StartSort - b.StartSort;
      return a.Naziv.localeCompare(b.Naziv || '');
    });
  }, [activities, dayById, locationById]);

  const onField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({ ...EMPTY_FORM, Dan: days[0]?.Id || '', Lokacija: locations[0]?.Id || '' });
    setEditingId(null);
  };

  const validate = () => {
    if (!hasEvent){
      toast.error('Sačuvaj osnovne informacije o događaju.');
      return null;
    }
    if (!form.Naziv.trim()){
      toast.error('Unesi naziv aktivnosti.');
      return null;
    }
    if (!form.Dan){
      toast.error('Izaberi dan.');
      return null;
    }
    if (!form.Lokacija){
      toast.error('Izaberi lokaciju.');
      return null;
    }
    if (!form.start || !form.end){
      toast.error('Postavi vreme početka i kraja.');
      return null;
    }
    const start = new Date(form.start);
    const end = new Date(form.end);
    if (Number.isNaN(start.getTime()) || Number.isNaN(end.getTime())){
      toast.error('Format vremena nije validan.');
      return null;
    }
    if (start >= end){
      toast.error('Vreme kraja mora biti nakon početka.');
      return null;
    }
    return { start, end };
  };

  const handleSubmit = async (e) => {
    e?.preventDefault();
    const times = validate();
    if (!times) return;

    const payload = {
      Naziv: form.Naziv.trim(),
      Opis: form.Opis.trim(),
      Dan: form.Dan,
      Lokacija: form.Lokacija,
      Dogadjaj: eventId,
      Tip: form.Tip || 'Ostalo',
      DatumVremePocetka: times.start.toISOString(),
      DatumVremeKraja: times.end.toISOString(),
    };

    try{
      setSaving(true);
      if (editingId){
        await activitiesApi.update(editingId, { Id: editingId, ...payload });
        toast.success('Aktivnost je ažurirana.');
      }else{
        await activitiesApi.create(payload);
        toast.success('Aktivnost je dodata.');
      }
      await refreshActivities();
      resetForm();
    }catch(err){
      console.error('Čuvanje aktivnosti nije uspelo:', err);
      toast.error('Greška pri čuvanju aktivnosti.');
    }finally{
      setSaving(false);
    }
  };

  const handleEdit = (activity) => {
    setEditingId(activity.Id);
    setForm({
      Naziv: activity.Naziv || '',
      Opis: activity.Opis || '',
      Dan: activity.Dan || '',
      Lokacija: activity.Lokacija || '',
      Tip: activity.Tip || 'Ostalo',
      start: toInputValue(activity.Start),
      end: toInputValue(activity.End),
    });
  };

  const handleDelete = async (activity) => {
    if (!activity?.Id) return;
    if (!window.confirm('Obrisati ovu aktivnost?')) return;
    try{
      setSaving(true);
      await activitiesApi.remove(activity.Id);
      toast.success('Aktivnost obrisana.');
      await refreshActivities();
      if (editingId === activity.Id){
        resetForm();
      }
    }catch(err){
      console.error('Brisanje aktivnosti nije uspelo:', err);
      toast.error('Greška pri brisanju aktivnosti.');
    }finally{
      setSaving(false);
    }
  };

  const disableForm = !hasEvent || saving;

  return (
    <Section
      title="Aktivnosti i raspored"
      subtitle="Planiraj program događaja kroz aktivnosti, njihove lokacije i termine."
      badges={[
        loading ? { label: 'Učitavanje...', tone: 'info' } : null,
        saving ? { label: 'Čuvanje...', tone: 'info' } : null,
        !hasEvent ? { label: 'Draft nije kreiran', tone: 'warning' } : null,
        { label: `Aktivnosti: ${activities.length || 0}` },
      ].filter(Boolean)}
    >
      {!hasEvent && (
        <div className="act-note">Sačuvaj osnovne informacije o događaju da bi dodavao aktivnosti.</div>
      )}

      <div className="act-grid">
        <form className="act-form" onSubmit={handleSubmit}>
          <h3>{editingId ? 'Izmena aktivnosti' : 'Dodaj novu aktivnost'}</h3>

          <label className="act-field">
            <span>Naziv aktivnosti</span>
            <input
              className="act-input"
              value={form.Naziv}
              onChange={(e) => onField('Naziv', e.target.value)}
              placeholder="npr. Otvaranje festivala"
              disabled={disableForm}
            />
          </label>

          <label className="act-field">
            <span>Opis (opciono)</span>
            <textarea
              className="act-textarea"
              rows={3}
              value={form.Opis}
              onChange={(e) => onField('Opis', e.target.value)}
              placeholder="Detalji, govornici, napomene..."
              disabled={disableForm}
            />
          </label>

          <div className="act-two-col">
            <label className="act-field">
              <span>Dan</span>
              <select
                className="act-input"
                value={form.Dan}
                onChange={(e) => onField('Dan', e.target.value)}
                disabled={disableForm || days.length === 0}
              >
                <option value="">-- izaberi --</option>
                {days.map(day => (
                  <option key={day.Id} value={day.Id}>
                    {day.Naziv}{day.DatumLabel ? ` · ${day.DatumLabel}` : ''}
                  </option>
                ))}
              </select>
            </label>

            <label className="act-field">
              <span>Lokacija</span>
              <select
                className="act-input"
                value={form.Lokacija}
                onChange={(e) => onField('Lokacija', e.target.value)}
                disabled={disableForm || locations.length === 0}
              >
                <option value="">-- izaberi --</option>
                {locations.map(loc => (
                  <option key={loc.Id} value={loc.Id}>{loc.Naziv}{loc.Tip ? ` · ${loc.Tip}` : ''}</option>
                ))}
              </select>
            </label>
          </div>

          <label className="act-field">
            <span>Tip aktivnosti</span>
            <select
              className="act-input"
              value={form.Tip}
              onChange={(e) => onField('Tip', e.target.value)}
              disabled={disableForm}
            >
              {TIPOVI_AKTIVNOSTI.map(t => (
                <option key={t} value={t}>{t}</option>
              ))}
            </select>
          </label>

          <div className="act-two-col">
            <label className="act-field">
              <span>Početak</span>
              <input
                className="act-input"
                type="datetime-local"
                value={form.start}
                onChange={(e) => onField('start', e.target.value)}
                disabled={disableForm}
              />
            </label>
            <label className="act-field">
              <span>Kraj</span>
              <input
                className="act-input"
                type="datetime-local"
                value={form.end}
                onChange={(e) => onField('end', e.target.value)}
                disabled={disableForm}
              />
            </label>
          </div>

          <div className="act-actions">
            <button className="act-btn" type="submit" disabled={disableForm}>
              {editingId ? 'Sačuvaj izmene' : 'Dodaj aktivnost'}
            </button>
            {editingId && (
              <button
                className="act-btn act-secondary"
                type="button"
                onClick={resetForm}
                disabled={saving}
              >
                Otkaži izmenu
              </button>
            )}
          </div>
        </form>

        <div className="act-schedule">
          <h3>Raspored</h3>
          <table className="act-table">
            <thead>
              <tr>
                <th>Dan</th>
                <th>Lokacija</th>
                <th>Aktivnost</th>
                <th>Vreme</th>
                <th>Tip</th>
                <th>Akcije</th>
              </tr>
            </thead>
            <tbody>
              {scheduleRows.length === 0 && (
                <tr>
                  <td colSpan={6} className="act-empty">Još uvek nema unetih aktivnosti.</td>
                </tr>
              )}
              {scheduleRows.map(row => (
                <tr key={row.Id}>
                  <td>
                    <div className="act-cell-main">{row.DayName}</div>
                    <div className="act-cell-sub">{row.DayLabel}</div>
                  </td>
                  <td>
                    <div className="act-cell-main">{row.LocationName}</div>
                    <div className="act-cell-sub">{row.LocationTip}</div>
                  </td>
                  <td>
                    <div className="act-cell-main">{row.Naziv}</div>
                    <div className="act-cell-sub">{row.Opis || 'Bez opisa'}</div>
                  </td>
                  <td>
                    <div className="act-cell-main">{row.StartLabel} – {row.EndLabel}</div>
                  </td>
                  <td>{row.Tip}</td>
                  <td>
                    <div className="act-row-actions">
                      <button className="act-btn act-secondary" type="button" onClick={() => handleEdit(row)} disabled={saving}>Uredi</button>
                      <button className="act-btn act-danger" type="button" onClick={() => handleDelete(row)} disabled={saving}>Obriši</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </Section>
  );
}
