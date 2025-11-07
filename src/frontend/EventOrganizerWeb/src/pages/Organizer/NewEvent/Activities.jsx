// src/pages/Organizer/NewEvent/Activities.jsx
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Section from './Section';
import '../../../styles/NewEvent/activities.css';

import * as daysApi from '../../../services/daysApi';
import * as locationsApi from '../../../services/locationsApi';
import * as activitiesApi from '../../../services/activitiesApi';
import * as schedulesApi from '../../../services/schedulesApi';
import * as neweventApi from '../../../services/newEventApi';

const TIPOVI_AKTIVNOSTI = ['Koncert', 'Predavanje', 'Igrica', 'Izlozba', 'Radionica', 'Druzenje', 'Ostalo'];

const TIP_LOKACIJA_COLORS = {
  BINA: '#e11d48',
  ULAZ: '#1d4ed8',
  WC: '#16a34a',
  INFO: '#9333ea',
  VIP: '#f59e0b',
  BAR: '#0ea5e9',
  HRANA: '#10b981',
  PARKING: '#64748b',
  BEZBEDNOST: '#ef4444',
};

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
  const rawType = String(raw?.TipLokacije || raw?.tipLokacije || raw?.Tip || raw?.tip || '').toUpperCase();
  return {
    Id: id,
    Naziv: raw?.Naziv || raw?.naziv || 'Lokacija',
    Tip: raw?.TipLokacije || raw?.tipLokacije || raw?.Tip || raw?.tip || '',
    Color: TIP_LOKACIJA_COLORS[rawType] || raw?.HEXboja || raw?.hexBoja || raw?.Boja || '#1f6feb',
  };
}

function normalizeSchedule(raw, index = 0){
  const id = schedulesApi.normalizeId(raw);
  if (!id) return null;
  const dogadjajId = raw?.DogadjajId || raw?.dogadjajId || raw?.Dogadjaj || raw?.dogadjaj || '';
  return {
    Id: id,
    Naziv: raw?.Naziv || raw?.naziv || `Raspored ${index + 1}`,
    Opis: raw?.Opis || raw?.opis || '',
    Lokacija: raw?.Lokacija || raw?.lokacija || '',
    Dan: raw?.Dan || raw?.dan || '',
    DogadjajId: dogadjajId,
    Aktivnosti: Array.isArray(raw?.Aktivnosti || raw?.aktivnosti) ? (raw.Aktivnosti || raw.aktivnosti) : [],
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
    RasporedId: raw?.RasporedId || raw?.rasporedId || raw?.Raspored || raw?.raspored || '',
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

const EMPTY_SCHEDULE_FORM = {
  Naziv: '',
  Opis: '',
  Dan: '',
  Lokacija: '',
};

const EMPTY_FORM = {
  Naziv: '',
  Opis: '',
  Dan: '',
  Lokacija: '',
  Tip: 'Ostalo',
  start: '',
  end: '',
  Raspored: '',
};

export default function Activities({ eventId }){
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [scheduleSaving, setScheduleSaving] = useState(false);

  const [days, setDays] = useState([]);
  const [locations, setLocations] = useState([]);
  const [schedules, setSchedules] = useState([]);
  const [activities, setActivities] = useState([]);

  const [form, setForm] = useState({ ...EMPTY_FORM });
  const [editingId, setEditingId] = useState(null);
  const [scheduleForm, setScheduleForm] = useState({ ...EMPTY_SCHEDULE_FORM });
  const [scheduleFormMode, setScheduleFormMode] = useState('hidden');
  const [selectedScheduleId, setSelectedScheduleId] = useState('');
  const [lastSelectedScheduleId, setLastSelectedScheduleId] = useState('');

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

  const fetchSchedules = useCallback(async () => {
    if (!eventId){
      setSchedules([]);
      setSelectedScheduleId('');
      return;
    }
    try{
      const list = await schedulesApi.listByEvent(eventId).catch(() => []);
      const normalized = (list || []).map(normalizeSchedule).filter(Boolean);
      normalized.sort((a, b) => a.Naziv.localeCompare(b.Naziv || ''));
      setSchedules(normalized);
      setSelectedScheduleId(prev => {
        if (prev && normalized.some(item => String(item.Id) === String(prev))){
          return prev;
        }
        return normalized[0]?.Id || '';
      });
      const scheduleIds = normalized.map(item => item.Id).filter(Boolean);
      try {
        await neweventApi.updateScheduleIds(eventId, scheduleIds);
      } catch (err) {
        console.warn('Ne mogu da sinhronizujem rasporede sa događajem:', err);
      }
    }catch(err){
      console.warn('Greška pri učitavanju rasporeda:', err);
      toast.error('Ne mogu da osvežim rasporede.');
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
      const ids = normalized.map((a) => a.Id).filter(Boolean);
      try {
        await neweventApi.updateActivityIds(eventId, ids);
      } catch {}
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
      setSchedules([]);
      setScheduleForm({ ...EMPTY_SCHEDULE_FORM });
      setScheduleFormMode('hidden');
      setSelectedScheduleId('');
      setLastSelectedScheduleId('');
      return;
    }
    let alive = true;
    (async () => {
      try{
        setLoading(true);
        await Promise.all([fetchDays(), fetchLocations(), fetchSchedules(), refreshActivities()]);
      }finally{
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [eventId, fetchDays, fetchLocations, fetchSchedules, refreshActivities]);

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
    function onSchedulesUpdated(e){
      if (!eventId) return;
      const detailId = e?.detail?.eventId;
      if (detailId && String(detailId) !== String(eventId)) return;
      fetchSchedules();
      refreshActivities();
    }
    window.addEventListener('ne:schedules:updated', onSchedulesUpdated);
    return () => window.removeEventListener('ne:schedules:updated', onSchedulesUpdated);
  }, [eventId, fetchSchedules, refreshActivities]);

  useEffect(() => {
    if (editingId) return;
    setForm(prev => ({
      ...prev,
      Dan: prev.Dan || days[0]?.Id || '',
      Lokacija: prev.Lokacija || locations[0]?.Id || '',
      Raspored: selectedScheduleId || '',
    }));
  }, [days, locations, editingId, selectedScheduleId]);

  useEffect(() => {
    if (scheduleFormMode !== 'create') return;
    setScheduleForm(prev => {
      const hasDay = prev.Dan && days.some(day => String(day.Id) === String(prev.Dan));
      const hasLocation = prev.Lokacija && locations.some(loc => String(loc.Id) === String(prev.Lokacija));
      const nextDay = hasDay ? prev.Dan : (days[0]?.Id || '');
      const nextLocation = hasLocation ? prev.Lokacija : (locations[0]?.Id || '');
      if (nextDay === prev.Dan && nextLocation === prev.Lokacija){
        return prev;
      }
      return {
        ...prev,
        Dan: nextDay,
        Lokacija: nextLocation,
      };
    });
  }, [days, locations, scheduleFormMode]);

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

  const scheduleById = useMemo(() => {
    const map = new Map();
    schedules.forEach(s => { if (s?.Id) map.set(String(s.Id), s); });
    return map;
  }, [schedules]);

  useEffect(() => {
    if (scheduleFormMode === 'create' || scheduleFormMode === 'edit') return;

    if (!selectedScheduleId){
      if (scheduleFormMode !== 'hidden'){
        setScheduleFormMode('hidden');
      }
      setScheduleForm({ ...EMPTY_SCHEDULE_FORM });
      return;
    }

    const schedule = scheduleById.get(String(selectedScheduleId));
    if (!schedule) return;

    setScheduleForm({
      Naziv: schedule.Naziv || '',
      Opis: schedule.Opis || '',
      Dan: schedule.Dan || '',
      Lokacija: schedule.Lokacija || '',
    });

    if (scheduleFormMode !== 'view'){
      setScheduleFormMode('view');
    }
  }, [scheduleById, scheduleFormMode, selectedScheduleId]);

  const restoreSelectedSchedule = useCallback(() => {
    if (!selectedScheduleId){
      setScheduleForm({ ...EMPTY_SCHEDULE_FORM });
      setScheduleFormMode('hidden');
      return;
    }
    const schedule = scheduleById.get(String(selectedScheduleId));
    if (!schedule){
      setScheduleForm({ ...EMPTY_SCHEDULE_FORM });
      setScheduleFormMode('hidden');
      return;
    }
    setScheduleForm({
      Naziv: schedule.Naziv || '',
      Opis: schedule.Opis || '',
      Dan: schedule.Dan || '',
      Lokacija: schedule.Lokacija || '',
    });
    setScheduleFormMode('view');
  }, [scheduleById, selectedScheduleId]);

  const startScheduleCreate = useCallback(() => {
    setLastSelectedScheduleId(selectedScheduleId || '');
    setSelectedScheduleId('');
    setScheduleForm({
      ...EMPTY_SCHEDULE_FORM,
      Dan: days[0]?.Id || '',
      Lokacija: locations[0]?.Id || '',
    });
    setScheduleFormMode('create');
  }, [days, locations, selectedScheduleId]);

  const cancelScheduleEdit = useCallback(() => {
    restoreSelectedSchedule();
  }, [restoreSelectedSchedule]);

  const cancelScheduleCreate = useCallback(() => {
    if (lastSelectedScheduleId){
      const schedule = scheduleById.get(String(lastSelectedScheduleId));
      setSelectedScheduleId(String(lastSelectedScheduleId));
      if (schedule){
        setScheduleForm({
          Naziv: schedule.Naziv || '',
          Opis: schedule.Opis || '',
          Dan: schedule.Dan || '',
          Lokacija: schedule.Lokacija || '',
        });
        setScheduleFormMode('view');
      }else{
        setScheduleForm({ ...EMPTY_SCHEDULE_FORM });
        setScheduleFormMode('hidden');
      }
    }else{
      setSelectedScheduleId('');
      setScheduleForm({ ...EMPTY_SCHEDULE_FORM });
      setScheduleFormMode('hidden');
    }
    setLastSelectedScheduleId('');
  }, [lastSelectedScheduleId, scheduleById]);

  const handleScheduleSelect = useCallback((scheduleId) => {
    if (!scheduleId) return;
    setLastSelectedScheduleId('');
    setSelectedScheduleId(String(scheduleId));
    setScheduleFormMode('view');
  }, []);

  const scheduleRows = useMemo(() => {
    if (!selectedScheduleId) return [];
    return activities
      .filter(act => String(act.RasporedId || '') === String(selectedScheduleId))
      .map(act => {
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
  }, [activities, dayById, locationById, selectedScheduleId]);

  const selectedSchedule = useMemo(() => {
    if (!selectedScheduleId) return null;
    return scheduleById.get(String(selectedScheduleId)) || null;
  }, [scheduleById, selectedScheduleId]);

  const selectedDay = selectedSchedule ? dayById.get(String(selectedSchedule.Dan || '')) : null;
  const selectedLocation = selectedSchedule ? locationById.get(String(selectedSchedule.Lokacija || '')) : null;

  const totalScheduleEntries = scheduleRows.length;

  const onField = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }));
  };

  const resetForm = () => {
    setForm({
      ...EMPTY_FORM,
      Dan: days[0]?.Id || '',
      Lokacija: locations[0]?.Id || '',
      Raspored: selectedScheduleId || '',
    });
    setEditingId(null);
  };

  const onScheduleField = (field, value) => {
    setScheduleForm(prev => ({ ...prev, [field]: value }));
  };

  const validateSchedule = () => {
    if (!hasEvent){
      toast.error('Sačuvaj osnovne informacije o događaju.');
      return false;
    }
    if (!scheduleForm.Naziv.trim()){
      toast.error('Unesi naziv rasporeda.');
      return false;
    }
    if (!scheduleForm.Dan){
      toast.error('Izaberi dan za raspored.');
      return false;
    }
    if (!scheduleForm.Lokacija){
      toast.error('Izaberi lokaciju za raspored.');
      return false;
    }
    return true;
  };

  const handleScheduleSubmit = async (e) => {
    e?.preventDefault();

    if (scheduleFormMode === 'view'){
      setScheduleFormMode('edit');
      return;
    }

    if (!validateSchedule()) return;

    const payload = {
      Naziv: scheduleForm.Naziv.trim(),
      Opis: scheduleForm.Opis.trim(),
      Dan: scheduleForm.Dan,
      Lokacija: scheduleForm.Lokacija,
      DogadjajId: eventId,
    };

    try{
      setScheduleSaving(true);
      if (scheduleFormMode === 'edit' && selectedScheduleId){
        await schedulesApi.update(selectedScheduleId, { Id: selectedScheduleId, ...payload });
        toast.success('Raspored je ažuriran.');
      }else if (scheduleFormMode === 'create'){
        const created = await schedulesApi.create(payload);
        toast.success('Raspored je kreiran.');
        const createdId = created?.Id || created?._id || created?.id;
        if (createdId){
          setSelectedScheduleId(String(createdId));
        }
      }
      await fetchSchedules();
      await refreshActivities();
      setLastSelectedScheduleId('');
      setScheduleFormMode('view');
      window.dispatchEvent(new CustomEvent('ne:schedules:updated', { detail: { eventId } }));
    }catch(err){
      console.error('Čuvanje rasporeda nije uspelo:', err);
      toast.error('Greška pri čuvanju rasporeda.');
    }finally{
      setScheduleSaving(false);
    }
  };

  const handleScheduleEdit = (schedule) => {
    if (!schedule?.Id) return;
    setSelectedScheduleId(String(schedule.Id));
    setLastSelectedScheduleId('');
    setScheduleForm({
      Naziv: schedule.Naziv || '',
      Opis: schedule.Opis || '',
      Dan: schedule.Dan || '',
      Lokacija: schedule.Lokacija || '',
    });
    setScheduleFormMode('edit');
  };

  const handleScheduleDelete = async (schedule) => {
    if (!schedule?.Id) return;
    if (!window.confirm('Obrisati ovaj raspored?')) return;
    try{
      setScheduleSaving(true);
      const isSelected = String(selectedScheduleId) === String(schedule.Id);
      if (isSelected){
        setSelectedScheduleId('');
        setScheduleForm({ ...EMPTY_SCHEDULE_FORM });
        setScheduleFormMode('hidden');
        setLastSelectedScheduleId('');
      }else if (String(lastSelectedScheduleId) === String(schedule.Id)){
        setLastSelectedScheduleId('');
      }
      await schedulesApi.remove(schedule.Id);
      toast.success('Raspored obrisan.');
      await fetchSchedules();
      await refreshActivities();
      window.dispatchEvent(new CustomEvent('ne:schedules:updated', { detail: { eventId } }));
    }catch(err){
      console.error('Brisanje rasporeda nije uspelo:', err);
      toast.error('Greška pri brisanju rasporeda.');
    }finally{
      setScheduleSaving(false);
    }
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
    const scheduleId = form.Raspored || selectedScheduleId;
    if (!scheduleId){
      toast.error('Izaberi raspored kojem aktivnost pripada.');
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
    return { start, end, scheduleId };
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
      RasporedId: times.scheduleId,
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
    if (activity.RasporedId){
      setSelectedScheduleId(String(activity.RasporedId));
    }
    setForm({
      Naziv: activity.Naziv || '',
      Opis: activity.Opis || '',
      Dan: activity.Dan || '',
      Lokacija: activity.Lokacija || '',
      Tip: activity.Tip || 'Ostalo',
      start: toInputValue(activity.Start),
      end: toInputValue(activity.End),
      Raspored: activity.RasporedId || '',
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

  const scheduleInputsDisabled = !hasEvent || scheduleSaving || scheduleFormMode === 'hidden' || scheduleFormMode === 'view';
  const scheduleSubmitDisabled = !hasEvent || scheduleSaving;
  const isScheduleCreating = scheduleFormMode === 'create';
  const isScheduleEditing = scheduleFormMode === 'edit';
  const isScheduleView = scheduleFormMode === 'view';
  const scheduleFormTitle = isScheduleCreating
    ? 'Novi raspored'
    : isScheduleEditing
      ? 'Izmena rasporeda'
      : selectedSchedule
        ? selectedSchedule.Naziv || 'Pregled rasporeda'
        : 'Raspored';
  const disableActivityForm = !hasEvent || saving || !selectedScheduleId || scheduleSaving;

  return (
    <Section
      title="Rasporedi i aktivnosti"
      subtitle="Kreiraj rasporede po danima i lokacijama, a zatim im pridruži aktivnosti sa preciznim terminima."
      badges={[
        loading ? { label: 'Učitavanje...', tone: 'info' } : null,
        scheduleSaving ? { label: 'Čuvanje rasporeda...', tone: 'info' } : null,
        saving ? { label: 'Čuvanje aktivnosti...', tone: 'info' } : null,
        !hasEvent ? { label: 'Draft nije kreiran', tone: 'warning' } : null,
        { label: `Rasporedi: ${schedules.length || 0}` },
        { label: `Aktivnosti ukupno: ${activities.length || 0}` },
        { label: `U rasporedu: ${totalScheduleEntries}` },
      ].filter(Boolean)}
    >
      {!hasEvent && (
        <div className="act-note">Sačuvaj osnovne informacije o događaju da bi dodavao aktivnosti.</div>
      )}

      <div className="act-grid">
        <div className="act-left">
          <div className="act-form act-form--schedule">
            <div className="act-form__header">
              <h3>{scheduleFormTitle}</h3>
              <button
                type="button"
                className="act-btn act-secondary"
                onClick={startScheduleCreate}
                disabled={scheduleSubmitDisabled || isScheduleCreating || isScheduleEditing}
              >
                Dodaj raspored
              </button>
            </div>

            {scheduleFormMode === 'hidden' ? (
              <div className="act-note act-note--inline">Dodaj raspored kako bi planirao aktivnosti.</div>
            ) : (
              <form className="act-form__body" onSubmit={handleScheduleSubmit}>
                <label className="act-field">
                  <span>Naziv rasporeda</span>
                  <input
                    className="act-input"
                    value={scheduleForm.Naziv}
                    onChange={(e) => onScheduleField('Naziv', e.target.value)}
                    placeholder="npr. Jutarnji blok"
                    disabled={scheduleInputsDisabled}
                  />
                </label>

                <label className="act-field">
                  <span>Opis (opciono)</span>
                  <textarea
                    className="act-textarea"
                    rows={3}
                    value={scheduleForm.Opis}
                    onChange={(e) => onScheduleField('Opis', e.target.value)}
                    placeholder="Kratak opis rasporeda, ciljne grupe..."
                    disabled={scheduleInputsDisabled}
                  />
                </label>

                <div className="act-two-col">
                  <label className="act-field">
                    <span>Dan</span>
                    <select
                      className="act-input"
                      value={scheduleForm.Dan}
                      onChange={(e) => onScheduleField('Dan', e.target.value)}
                      disabled={scheduleInputsDisabled || days.length === 0}
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
                      value={scheduleForm.Lokacija}
                      onChange={(e) => onScheduleField('Lokacija', e.target.value)}
                      disabled={scheduleInputsDisabled || locations.length === 0}
                    >
                      <option value="">-- izaberi --</option>
                      {locations.map(loc => (
                        <option key={loc.Id} value={loc.Id}>{loc.Naziv}{loc.Tip ? ` · ${loc.Tip}` : ''}</option>
                      ))}
                    </select>
                  </label>
                </div>

                <div className="act-actions">
                  {isScheduleView ? (
                    <button
                      className="act-btn"
                      type="button"
                      onClick={() => setScheduleFormMode('edit')}
                      disabled={scheduleSubmitDisabled || !selectedScheduleId}
                    >
                      Izmeni
                    </button>
                  ) : (
                    <button className="act-btn" type="submit" disabled={scheduleSubmitDisabled}>
                      {isScheduleEditing ? 'Sačuvaj izmene' : 'Sačuvaj raspored'}
                    </button>
                  )}
                  {(isScheduleEditing || isScheduleCreating) && (
                    <button
                      className="act-btn act-secondary"
                      type="button"
                      onClick={isScheduleEditing ? cancelScheduleEdit : cancelScheduleCreate}
                      disabled={scheduleSaving}
                    >
                      Otkaži
                    </button>
                  )}
                </div>
              </form>
            )}
          </div>

          <div className="schedule-list">
            <div className="schedule-list__header">
              <h4>Postojeći rasporedi</h4>
              <span className="schedule-list__counter">{schedules.length}</span>
            </div>
            {schedules.length === 0 ? (
              <div className="schedule-list__empty">Dodaj raspored kako bi planirao aktivnosti.</div>
            ) : (
              <ul className="schedule-list__items">
                {schedules.map(schedule => {
                  const day = dayById.get(String(schedule.Dan || ''));
                  const loc = locationById.get(String(schedule.Lokacija || ''));
                  const isActive = String(schedule.Id) === String(selectedScheduleId);
                  return (
                    <li
                      key={schedule.Id}
                      className={`schedule-list__item${isActive ? ' schedule-list__item--active' : ''}`}
                    >
                      <button
                        type="button"
                        className="schedule-list__select"
                        onClick={() => handleScheduleSelect(schedule.Id)}
                        disabled={scheduleSaving}
                      >
                        <span className="schedule-list__name">{schedule.Naziv}</span>
                        <span className="schedule-list__meta">
                          {(day?.Naziv || 'Dan')}{day?.DatumLabel ? ` · ${day.DatumLabel}` : ''} · {(loc?.Naziv || 'Lokacija')}
                        </span>
                      </button>
                      <div className="schedule-list__actions">
                        <button
                          type="button"
                          className="act-btn act-secondary schedule-list__action"
                          onClick={() => handleScheduleEdit(schedule)}
                          disabled={scheduleSaving}
                        >
                          Uredi
                        </button>
                        <button
                          type="button"
                          className="act-btn act-danger schedule-list__action"
                          onClick={() => handleScheduleDelete(schedule)}
                          disabled={scheduleSaving}
                        >
                          Obriši
                        </button>
                      </div>
                    </li>
                  );
                })}
              </ul>
            )}
          </div>

          <form className="act-form act-form--activity" onSubmit={handleSubmit}>
            <h3>{editingId ? 'Izmena aktivnosti' : 'Dodaj novu aktivnost'}</h3>

            <label className="act-field">
              <span>Raspored</span>
              <select
                className="act-input"
                value={form.Raspored || selectedScheduleId}
                onChange={(e) => {
                  const value = e.target.value;
                  onField('Raspored', value);
                  setSelectedScheduleId(value);
                }}
                disabled={disableActivityForm || schedules.length === 0}
              >
                <option value="">-- izaberi --</option>
                {schedules.map(schedule => (
                  <option key={schedule.Id} value={schedule.Id}>{schedule.Naziv}</option>
                ))}
              </select>
            </label>

            <label className="act-field">
              <span>Naziv aktivnosti</span>
              <input
                className="act-input"
                value={form.Naziv}
                onChange={(e) => onField('Naziv', e.target.value)}
                placeholder="npr. Otvaranje festivala"
                disabled={disableActivityForm}
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
                disabled={disableActivityForm}
              />
            </label>

            <div className="act-two-col">
              <label className="act-field">
                <span>Dan</span>
                <select
                  className="act-input"
                  value={form.Dan}
                  onChange={(e) => onField('Dan', e.target.value)}
                  disabled={disableActivityForm || days.length === 0}
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
                  disabled={disableActivityForm || locations.length === 0}
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
                disabled={disableActivityForm}
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
                  disabled={disableActivityForm}
                />
              </label>
              <label className="act-field">
                <span>Kraj</span>
                <input
                  className="act-input"
                  type="datetime-local"
                  value={form.end}
                  onChange={(e) => onField('end', e.target.value)}
                  disabled={disableActivityForm}
                />
              </label>
            </div>

            <div className="act-actions">
              <button className="act-btn" type="submit" disabled={disableActivityForm}>
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

            {schedules.length === 0 && (
              <div className="act-note act-note--inline">
                Kreiraj raspored iznad kako bi dodavao aktivnosti.
              </div>
            )}
          </form>
        </div>

        <div className="act-schedule" aria-label="Pregled rasporeda aktivnosti">
          <fieldset className="act-schedule-fieldset">
            <legend>Raspored</legend>
            <div className="act-schedule-meta">
              {selectedSchedule ? (
                <>
                  <h4>{selectedSchedule.Naziv}</h4>
                  <p>{selectedSchedule.Opis || 'Bez opisa'}</p>
                  <div className="act-schedule-tags">
                    <span>{selectedDay ? `${selectedDay.Naziv}${selectedDay.DatumLabel ? ` · ${selectedDay.DatumLabel}` : ''}` : 'Dan nije definisan'}</span>
                    <span>{selectedLocation ? selectedLocation.Naziv : 'Lokacija nije definisana'}</span>
                  </div>
                </>
              ) : (
                <p className="act-empty">Izaberi raspored sa leve strane da bi prikazao aktivnosti.</p>
              )}
            </div>
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
                {!selectedScheduleId && (
                  <tr>
                    <td colSpan={6} className="act-empty">Izaberi raspored da bi prikazao aktivnosti.</td>
                  </tr>
                )}
                {selectedScheduleId && scheduleRows.length === 0 && (
                  <tr>
                    <td colSpan={6} className="act-empty">Još uvek nema unetih aktivnosti.</td>
                  </tr>
                )}
                {selectedScheduleId && scheduleRows.map(row => (
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
          </fieldset>
        </div>
      </div>
    </Section>
  );
}
