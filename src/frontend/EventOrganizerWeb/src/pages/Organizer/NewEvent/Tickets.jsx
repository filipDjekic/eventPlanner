// src/pages/Organizer/NewEvent/Tickets.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import Section from './Section';
import '../../../styles/NewEvent/tickets.css';
import * as ticketsApi from '../../../services/ticketsApi';
import * as neweventApi from '../../../services/newEventApi';

const TIPOVI = ['besplatna', 'regularna', 'vip', 'više­dnevna', 'early bird', 'ostalo'];

function totalQty(list){
  return (list || []).reduce((acc, t) => acc + (Number(t.BrojKarata || 0) || 0), 0);
}

const AUTO_COLOR_DEBOUNCE = 400;

export default function Tickets({ eventId, initialCapacity, initialInfinite }){
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tickets, setTickets] = useState([]);
  const [capacity, setCapacity] = useState(null);
  const [infinite, setInfinite] = useState(false);

  const ticketsRef = useRef([]);
  const autoColorTimerRef = useRef(null);

  useEffect(() => {
    ticketsRef.current = tickets;
  }, [tickets]);

  useEffect(() => () => {
    if (autoColorTimerRef.current){
      clearTimeout(autoColorTimerRef.current);
    }
  }, []);

  useEffect(() => {
    if (typeof initialCapacity === 'number') {
      setCapacity(Number.isFinite(initialCapacity) && initialCapacity > 0 ? initialCapacity : null);
    }
    if (typeof initialInfinite === 'boolean') {
      setInfinite(initialInfinite === true);
    }
  }, [initialCapacity, initialInfinite]);

  useEffect(() => {
    function onInfo(e){
      const d = e?.detail || {};
      if ('Kapacitet' in d) {
        const n = Number(d.Kapacitet);
        setCapacity(Number.isFinite(n) && n > 0 ? n : null);
      }
      if ('Beskonacno' in d) {
        setInfinite(d.Beskonacno === true);
      }
    }
    window.addEventListener('ne:basicinfo', onInfo);
    return () => window.removeEventListener('ne:basicinfo', onInfo);
  }, []);

  useEffect(() => {
    if(!eventId) return;
    let mounted = true;
    (async () => {
      try{
        setLoading(true);
        const ev = await neweventApi.getById(eventId);
        if (!mounted) return;
        const capFromBE = Number(ev?.Kapacitet);
        setCapacity(Number.isFinite(capFromBE) && capFromBE > 0 ? capFromBE : (initialCapacity ?? null));
        setInfinite(typeof ev?.Beskonacno === 'boolean' ? ev.Beskonacno : (initialInfinite === true));

        let normalized = [];
        try{
          const list = await ticketsApi.fetchTickets(eventId);
          if (!mounted) return;
          normalized = (list || []).map(t => ({
            localId: `${t.Id || t.id || Math.random().toString(36).slice(2)}-srv`,
            Id: t.Id || t.id || null,
            Naziv: t.Naziv || t.naziv || '',
            Tip: t.Tip || t.tip || 'regularna',
            Cena: Number(t.Cena ?? 0),
            BrojKarata: Number(t.BrojKarata ?? 0),
            Boja: t.Boja || t.boja || '#ffffff',
            locked: true,
            __auto: Boolean(ev?.Beskonacno) && (t?.Tip === 'besplatna' || t?.tip === 'besplatna') && Number(t?.Cena ?? t?.cena ?? 0) === 0
          }));
        }catch{ normalized = []; }
        if (!mounted) return;
        setTickets(normalized);
      }catch(err){
        if (mounted) toast.error('Greška pri učitavanju karata.');
      }finally{
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [eventId, initialCapacity, initialInfinite]);

  useEffect(() => {
    if (!eventId || infinite !== true) return;
    let autoAlready = false;
    let draftTicket = null;
    setTickets(prev => {
      const found = prev.find(t => t.__auto);
      if (found){
        autoAlready = true;
        return prev.map(t => t.__auto ? ({ ...t, BrojKarata: resolveAutoQuantity(capacity) }) : t);
      }
      draftTicket = {
        localId: `auto-${Math.random().toString(36).slice(2)}`,
        Naziv: 'Ulaznica',
        Tip: 'besplatna',
        Cena: 0,
        BrojKarata: resolveAutoQuantity(capacity),
        Boja: '#ffffff',
        locked: true,
        __auto: true,
      };
      return [draftTicket, ...prev];
    });

    if (autoAlready || !draftTicket) return;

    (async () => {
      try{
        const created = await ticketsApi.createTicket(eventId, {
          Naziv: draftTicket.Naziv,
          Tip: draftTicket.Tip,
          Cena: 0,
          BrojKarata: draftTicket.BrojKarata,
          Boja: draftTicket.Boja,
          DogadjajId: eventId,
        });
        const tid = created?.Id || created?.id || created;
        if (!tid) return;
        setTickets(prev => prev.map(t => t.localId === draftTicket.localId ? ({ ...t, Id: tid }) : t));
        const currentIds = ticketsRef.current.map(t => t.Id).filter(Boolean);
        await syncTicketIds(eventId, currentIds.concat([tid]));
      }catch{
        toast.error('Greška pri auto-kreiranju ulaznice.');
      }
    })();
  }, [eventId, infinite, capacity]);

  useEffect(() => {
    if (!infinite) return;
    setTickets(prev => prev.map(t => t.__auto ? ({ ...t, BrojKarata: resolveAutoQuantity(capacity) }) : t));
  }, [capacity, infinite]);

  useEffect(() => {
    if (infinite) return;
    const autoTicket = ticketsRef.current.find(t => t.__auto);
    if (!autoTicket) return;
    (async () => {
      try{
        if (autoTicket.Id){
          await ticketsApi.deleteTicket(autoTicket.Id);
        }
      }catch{}
      const remaining = ticketsRef.current.filter(t => !t.__auto);
      setTickets(remaining);
      await syncTicketIds(eventId, remaining.map(t => t.Id).filter(Boolean));
    })();
  }, [infinite, eventId]);

  const manualTotal = useMemo(() => totalQty(tickets.filter(t => !t.__auto)), [tickets]);

  function resolveAutoQuantity(cap){
    if (!Number.isFinite(Number(cap))) return 9999999;
    const num = Number(cap);
    return num > 0 ? num : 9999999;
  }

  async function syncTicketIds(eventIdParam, ids){
    if (!eventIdParam) return;
    const unique = Array.from(new Set(ids.filter(Boolean)));
    try{
      await neweventApi.updateTicketIds(eventIdParam, unique);
    }catch(err){
      console.warn('updateTicketIds nije uspeo:', err);
    }
  }

  function addTicket(){
    if(!eventId || infinite) return;
    setTickets(prev => [
      ...prev,
      {
        localId: `local-${Math.random().toString(36).slice(2)}`,
        Naziv: '',
        Tip: 'regularna',
        Cena: '',
        BrojKarata: '',
        Boja: '#ffffff',
        locked: false
      }
    ]);
  }

  function canSaveWithCapacity(nextTicket, idx){
    if(infinite) return true;
    if(!Number.isFinite(Number(capacity))) return true;
    const others = tickets.filter((_,i)=>i!==idx && !tickets[i]?.__auto);
    const sumOthers = totalQty(others);
    const sum = sumOthers + Number(nextTicket.BrojKarata || 0);
    return sum <= Number(capacity);
  }

  async function saveTicket(idx){
    const t = tickets[idx];
    const payload = {
      Naziv: (t.Naziv || '').trim(),
      Tip: t.Tip || 'regularna',
      Cena: Number(t.Cena || 0),
      BrojKarata: Number(t.BrojKarata || 0),
      Boja: t.Boja || '#ffffff',
      DogadjajId: eventId
    };

    if(!payload.Naziv || !payload.Tip || !(payload.Boja)){
      toast.error('Popuni sva obavezna polja za kartu.');
      return;
    }
    if(!canSaveWithCapacity(payload, idx)){
      const sumOthers = totalQty(tickets.filter((_,i)=>i!==idx));
      const cap = Number(capacity);
      const overBy = Math.max(0, (sumOthers + payload.BrojKarata) - cap);
      toast.error(`Ukupan broj karata premašuje kapacitet (${cap}) za ${overBy}.`);
      return;
    }

    try{
      setSaving(true);
      if(t.Id){
        await ticketsApi.updateTicket(t.Id, payload);
        const next = [...tickets];
        next[idx] = { ...t, ...payload, locked: true };
        setTickets(next);
        await syncTicketIds(eventId, next.filter(x=>x.Id).map(x=>x.Id));
      }else{
        const created = await ticketsApi.createTicket(eventId, payload);
        const id = created?.Id || created?.id || created;
        if(!id){
          toast.error('Greška: nedostaje ID karte iz odgovora.');
          return;
        }
        const next = [...tickets];
        next[idx] = { ...t, ...payload, Id:id, locked: true };
        setTickets(next);
        await syncTicketIds(eventId, next.filter(x=>x.Id).map(x=>x.Id));
      }
      toast.success('Karta sačuvana.');
    }catch(err){
      const msg = err?.response?.data || 'Greška pri čuvanju karte.';
      toast.error(typeof msg === 'string' ? msg : 'Greška pri čuvanju karte.');
    }finally{
      setSaving(false);
    }
  }

  function toggleEdit(idx){
    setTickets(prev => prev.map((t,i)=> i===idx ? ({...t, locked: !t.locked}) : t));
  }

  async function removeTicket(idx){
    const t = tickets[idx];
    if (t?.__auto && infinite) return;
    try{
      setSaving(true);
      if(t.Id){
        await ticketsApi.deleteTicket(t.Id);
      }
      const next = tickets.filter((_,i)=>i!==idx);
      setTickets(next);
      await syncTicketIds(eventId, next.filter(x=>x.Id).map(x=>x.Id));
      toast.success('Karta obrisana.');
    }catch(err){
      const msg = err?.response?.data || 'Greška pri brisanju karte.';
      toast.error(typeof msg === 'string' ? msg : 'Greška pri brisanju karte.');
    }finally{
      setSaving(false);
    }
  }

  function queueAutoColorSave(localId, color){
    if (autoColorTimerRef.current){
      clearTimeout(autoColorTimerRef.current);
    }
    autoColorTimerRef.current = setTimeout(async () => {
      const target = ticketsRef.current.find(x => x.localId === localId);
      if (!target || !target.Id) return;
      try{
        setSaving(true);
        await ticketsApi.updateTicket(target.Id, {
          Naziv: target.Naziv,
          Tip: target.Tip,
          Cena: Number(target.Cena || 0),
          BrojKarata: Number(target.BrojKarata || 0),
          Boja: color,
          DogadjajId: eventId,
        });
        toast.success('Boja karte ažurirana.');
      }catch{
        toast.error('Greška pri ažuriranju boje karte.');
      }finally{
        setSaving(false);
      }
    }, AUTO_COLOR_DEBOUNCE);
  }

  function onChange(idx, field, value){
    if(field === 'Boja'){
      const v = String(value || '').trim();
      const safe = /^#([0-9a-f]{6})$/i.test(v) ? v : '#ffffff';
      setTickets(prev => prev.map((t,i)=> i===idx ? ({...t, Boja: safe}) : t));
      const target = ticketsRef.current[idx];
      if (target && target.__auto && infinite){
        queueAutoColorSave(target.localId, safe);
      }
      return;
    }

    setTickets(prev => prev.map((t,i)=> i===idx ? ({...t, [field]: value}) : t));
  }

  const disabledGlobal = !eventId || loading;
  const disableAdd = disabledGlobal || saving || infinite;

  const headerBadges = [
    loading ? { label: 'Učitavanje...', tone: 'info' } : null,
    saving ? { label: 'Čuvanje...', tone: 'info' } : null,
    infinite
      ? { label: 'Beskonačan kapacitet', tone: 'warning' }
      : (Number.isFinite(Number(capacity))
        ? { label: `Raspoređeno ${manualTotal}/${capacity}` }
        : null),
    { label: `Tipova ulaznica: ${tickets.length || 0}` },
  ].filter(Boolean);

  const addButton = (
    <button className="btn btn-primary tk-add" onClick={addTicket} disabled={disableAdd}>
      Dodaj kartu
    </button>
  );

  return (
    <Section
      title="Karte"
      subtitle="Definiši tipove ulaznica, cene i količine koje posetioci mogu da rezervišu."
      badges={headerBadges}
      actions={addButton}
    >
      {!eventId && (
        <div className="tk-note">Kreiraj draft događaja u "Osnovnim informacijama" pre dodavanja karata.</div>
      )}

      {infinite && (
        <div className="tk-note">Kapacitet je beskonačan – automatski je dodata besplatna karta. Možeš da promeniš samo boju.</div>
      )}

      {!infinite && Number.isFinite(Number(capacity)) && (
        <div className="tk-note">Ukupno raspoređeno karata: {manualTotal}/{capacity}</div>
      )}

      <div className="tk-list">
        {tickets.map((t, idx) => {
          const disableActions = saving || disabledGlobal || infinite;
          const disableFields = saving || disabledGlobal || t.locked || infinite;
          let disableColor = saving || disabledGlobal;
          if (infinite && !t.__auto) disableColor = true;
          if (!infinite && t.locked) disableColor = true;
          if (t.__auto && infinite) disableColor = false;
          const priceLabel = `${Number(t.Cena || 0).toLocaleString('sr-RS', { minimumFractionDigits: 2, maximumFractionDigits: 2 })} RSD`;
          const qtyLabel = t.__auto ? '∞' : Number(t.BrojKarata || 0).toLocaleString('sr-RS');
          return (
            <div key={t.localId} className={`tk-card ${t.locked ? 'tk-locked' : ''}`}>
              {t.locked ? (
                <div className="tk-summary">
                  <div className="tk-summary-row">
                    <div>
                      <div className="tk-summary-title">{t.Naziv || 'Ulaznica'}</div>
                      <div className="tk-summary-type">{t.Tip}</div>
                    </div>
                    <div className="tk-summary-color">
                      <span className="tk-swatch" style={{ backgroundColor: t.Boja || '#ffffff' }} />
                    </div>
                  </div>
                  <div className="tk-summary-meta">
                    <span>{priceLabel}</span>
                    <span>Količina: {qtyLabel}</span>
                  </div>
                </div>
              ) : (
                <div className="tk-grid">
                  <label className="block">
                    <div className="label mb-1">Naziv</div>
                    <input className="input" value={t.Naziv} onChange={e=>onChange(idx,'Naziv',e.target.value)} disabled={disableFields} />
                  </label>

                  <label className="block">
                    <div className="label mb-1">Tip</div>
                    <select className="input" value={t.Tip} onChange={e=>onChange(idx,'Tip',e.target.value)} disabled={disableFields}>
                      {TIPOVI.map(op => <option key={op} value={op}>{op}</option>)}
                    </select>
                  </label>

                  <label className="block">
                    <div className="label mb-1">Cena</div>
                    <input className="input" type="number" min="0" value={t.Cena} onChange={e=>onChange(idx,'Cena',e.target.value)} disabled={disableFields} />
                  </label>

                  <label className="block">
                    <div className="label mb-1">Broj karata</div>
                    <input className="input" type="number" min="0" value={t.BrojKarata} onChange={e=>onChange(idx,'BrojKarata',e.target.value)} disabled={disableFields || t.__auto} />
                  </label>

                  <label className="block tk-color">
                    <div className="label mb-1">Boja</div>
                    <div className="tk-color-row">
                      <input
                        className="input tk-color-input"
                        type="color"
                        value={t.Boja || '#ffffff'}
                        onChange={e=>onChange(idx,'Boja',e.target.value)}
                        disabled={disableColor}
                      />
                      <span className="tk-swatch" style={{ backgroundColor: t.Boja || '#ffffff' }} />
                    </div>
                  </label>
                </div>
              )}

              <div className="tk-actions">
                <button className="btn" onClick={()=> t.locked ? toggleEdit(idx) : saveTicket(idx)} disabled={disableActions}>
                  {t.locked ? 'Izmeni' : (t.Id ? 'Sačuvaj izmene' : 'Sačuvaj')}
                </button>
                <button className="btn" onClick={()=> removeTicket(idx)} disabled={disableActions || (t.__auto && infinite)}>Obriši</button>
              </div>
            </div>
          );
        })}
      </div>
    </Section>
  );
}
