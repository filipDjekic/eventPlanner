// src/pages/Organizer/NewEvent/Tickets.jsx
import React, { useEffect, useState } from 'react';
import '../../../styles/NewEvent/tickets.css';
import toast from 'react-hot-toast';
import * as ticketsApi from '../../../services/ticketsApi';
import * as neweventApi from '../../../services/newEventApi';

/** Tipovi karata dostupni u dropdown-u */
const TIPOVI = ['besplatna', 'regularna', 'vip', 'više­dnevna', 'early bird', 'ostalo'];

/** Helper: sabira količine iz niza karata (broj karata) */
function totalQty(list){
  return (list || []).reduce((acc, t) => acc + (Number(t.BrojKarata || 0) || 0), 0);
}

export default function Tickets({ eventId }){
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [tickets, setTickets] = useState([]); // {localId, Id?, Naziv, Tip, Cena, BrojKarata, Boja, locked}
  const [capacity, setCapacity] = useState(null);
  const [infinite, setInfinite] = useState(false);
  // Sync sa BasicInfo preko custom eventa (bez localStorage fallback-a)
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


  // Učitaj podatke o događaju i postojeće karte kada imamo eventId
  useEffect(() => {
    if(!eventId) return;
    (async () => {
      try{
        setLoading(true);
        // koristimo postojeći newEventApi sloj (ne direktne rute)
        const ev = await neweventApi.getById(eventId);
        setCapacity(Number(ev?.Kapacitet ?? 0));
        setInfinite(Boolean(ev?.Beskonacno));

        // Učitaj karte ako backend podržava listing
        let normalized = [];
        try{
          const list = await ticketsApi.fetchTickets(eventId);
          normalized = (list || []).map(t => ({
            localId: `${t.Id || t.id || Math.random().toString(36).slice(2)}-srv`,
            Id: t.Id || t.id || null,
            Naziv: t.Naziv || t.naziv || '',
            Tip: t.Tip || t.tip || 'regularna',
            Cena: Number(t.Cena ?? 0),
            BrojKarata: Number(t.BrojKarata ?? 0),
            Boja: t.Boja || t.boja || '#ffffff',
            locked: true,
          }));
        }catch{ /* listing rute možda nema — preskačemo */ }
        setTickets(normalized);

        // Ako je beskonačno i nema karata — automatski kreiraj default
        if(Boolean(ev?.Beskonacno) && normalized.length === 0){
          const def = {
            Naziv: 'Ulaznica',
            Tip: 'besplatna',
            Cena: 0,
            BrojKarata: Number(ev?.Kapacitet ?? 9999999),
            Boja: '#ffffff'
          };
          try{
            const created = await ticketsApi.createTicket(eventId, def);
            const tid = created?.Id || created?.id || created;
            if(tid){
              const newList = [ { ...def, Id: tid, localId: `${tid}`, locked:true } ];
              setTickets(newList);
              // upiši na događaj niz ID-jeva kroz newEventApi helper
              await neweventApi.updateTicketIds(eventId, newList.map(x => x.Id));
            }
          }catch(err){
            toast.error('Greška pri auto-kreiranju ulaznice.');
          }
        }
      }catch(err){
        toast.error('Greška pri učitavanju karata.');
      }finally{
        setLoading(false);
      }
    })();
  }, [eventId]);

  // Dodaj praznu podformu (editable)
  function addTicket(){
    if(!eventId) return;
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

  // Validacija kapaciteta: novu/izmenjenu kartu ne dozvoli ako prelazi kapacitet
  function canSaveWithCapacity(nextTicket, idx){
    if(infinite) return true; // kada je beskonačno, ručno dodavanje je onemogućeno; ali guard
    if(!Number.isFinite(Number(capacity))) return true; // ako nemamo kapacitet, pusti (ili blokiraj po želji)
    const others = tickets.filter((_,i)=>i!==idx);
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

    // Validacija obaveznih i kapaciteta
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
        // UPDATE
        await ticketsApi.updateTicket(t.Id, payload);
        const next = [...tickets];
        next[idx] = { ...t, ...payload, locked: true };
        setTickets(next);
        // ažuriraj dogadjaj sa listom ID-jeva
        const ids = next.filter(x=>x.Id).map(x=>x.Id);
        await neweventApi.updateTicketIds(eventId, ids);
      }else{
        // CREATE
        const created = await ticketsApi.createTicket(eventId, payload);
        const id = created?.Id || created?.id || created;
        if(!id){
          toast.error('Greška: nedostaje ID karte iz odgovora.');
          return;
        }
        const next = [...tickets];
        next[idx] = { ...t, ...payload, Id:id, locked: true };
        setTickets(next);
        // ažuriraj dogadjaj sa listom ID-jeva
        const ids = next.filter(x=>x.Id).map(x=>x.Id);
        await neweventApi.updateTicketIds(eventId, ids);
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
    try{
      setSaving(true);
      if(t.Id){
        await ticketsApi.deleteTicket(t.Id);
      }
      const next = tickets.filter((_,i)=>i!==idx);
      setTickets(next);
      // ažuriraj listu ID-jeva na dogadjaju
      const ids = next.filter(x=>x.Id).map(x=>x.Id);
      await neweventApi.updateTicketIds(eventId, ids);
      toast.success('Karta obrisana.');
    }catch(err){
      const msg = err?.response?.data || 'Greška pri brisanju karte.';
      toast.error(typeof msg === 'string' ? msg : 'Greška pri brisanju karte.');
    }finally{
      setSaving(false);
    }
  }

  function onChange(idx, field, value){
    setTickets(prev => prev.map((t,i)=> i===idx ? ({...t, [field]: value}) : t));
  }

  useEffect(() => {
    function onBasicInfo(e){
      const d = e?.detail || {};
      if (typeof d.Kapacitet === 'number') setCapacity(d.Kapacitet);
      if (typeof d.Beskonacno === 'boolean') setInfinite(d.Beskonacno);
    }
    window.addEventListener('ne:basicinfo', onBasicInfo);
    return () => window.removeEventListener('ne:basicinfo', onBasicInfo);
  }, []);


  // AUTO karta: samo kada postoji eventId i Beskonacno === true
  useEffect(() => {
    if (!eventId || infinite !== true) return;
    const hasAuto = tickets.some(t => t.__auto);
    const hasUserTickets = tickets.some(t => !t.__auto);
    if (hasAuto || hasUserTickets) return;

    const def = {
      localId: `auto-${Math.random().toString(36).slice(2)}`,
      Naziv: 'Ulaznica',
      Tip: 'besplatna',
      Cena: 0,
      BrojKarata: (typeof capacity === 'number' && capacity > 0) ? capacity : 9999999,
      Boja: '#ffffff',
      locked: true,
      __auto: true
    };
    setTickets(prev => [def, ...prev]);

    (async () => {
      try{
        const created = await ticketsApi.createTicket(eventId, {
          Naziv: def.Naziv, Tip: def.Tip, Cena: 0, BrojKarata: def.BrojKarata, Boja: def.Boja, DogadjajId: eventId
        });
        const tid = created?.Id || created?.id || created;
        if (tid){
          setTickets(curr => curr.map(t => t.localId === def.localId ? { ...t, Id: tid } : t));
          const ids = (tickets || []).filter(x=>x.Id).map(x=>x.Id);
          await neweventApi.updateTicketIds(eventId, ids.concat([tid]));
        }
      }catch{}
    })();
  }, [eventId, infinite, capacity, tickets]);

  // Kada Beskonacno postane false → ukloni auto kartu
  useEffect(() => {
    if (infinite === false) {
      const idx = tickets.findIndex(t => t.__auto);
      if (idx >= 0) {
        (async () => {
          const t = tickets[idx];
          try{
            if(t.Id){ await ticketsApi.deleteTicket(t.Id); }
            const next = tickets.filter((_,i)=>i!==idx);
            setTickets(next);
            if(eventId){
              const ids = next.filter(x=>x.Id).map(x=>x.Id);
              await neweventApi.updateTicketIds(eventId, ids);
            }
          }catch{}
        })();
      }
    }
  }, [infinite]);

  const disabledAll = !eventId || infinite;

  return (
    <div className="form-card tk-wrap">
      <div className="tk-head">
        <div className="label">Karte</div>
        <div className="grow" />
        <button className="btn tk-add" onClick={addTicket} disabled={disabledAll || loading || saving}>
          Dodaj kartu
        </button>
      </div>

      {!eventId && (
        <div className="tk-note">Kreiraj draft događaja u "Basic info" da bi dodavao karte.</div>
      )}

      {infinite && (
        <div className="tk-note">Kapacitet je beskonačan – ručno dodavanje/izmena karata je onemogućeno.</div>
      )}

      <div className="tk-list">
        {tickets.map((t, idx) => (
          <div key={t.localId} className={`tk-card ${t.locked ? 'tk-locked' : ''}`}>
            <div className="tk-grid">
              <label className="block">
                <div className="label mb-1">Naziv</div>
                <input className="input" value={t.Naziv} onChange={e=>onChange(idx,'Naziv',e.target.value)} disabled={disabledAll || t.locked} />
              </label>

              <label className="block">
                <div className="label mb-1">Tip</div>
                <select className="input" value={t.Tip} onChange={e=>onChange(idx,'Tip',e.target.value)} disabled={disabledAll || t.locked}>
                  {TIPOVI.map(op => <option key={op} value={op}>{op}</option>)}
                </select>
              </label>

              <label className="block">
                <div className="label mb-1">Cena</div>
                <input className="input" type="number" min="0" value={t.Cena} onChange={e=>onChange(idx,'Cena',e.target.value)} disabled={disabledAll || t.locked} />
              </label>

              <label className="block">
                <div className="label mb-1">Broj karata</div>
                <input className="input" type="number" min="0" value={t.BrojKarata} onChange={e=>onChange(idx,'BrojKarata',e.target.value)} disabled={disabledAll || t.locked} />
              </label>

              <label className="block tk-color">
                <div className="label mb-1">Boja</div>
                <div className="tk-color-row">
                  <input className="input tk-color-input" type="color" value={t.Boja} onChange={e=>onChange(idx,'Boja',e.target.value)} disabled={disabledAll || t.locked} />
                  <span className="tk-swatch" style={{ backgroundColor: t.Boja }} />
                </div>
              </label>
            </div>

            <div className="tk-actions">
              <button className="btn" onClick={()=> t.locked ? toggleEdit(idx) : saveTicket(idx)} disabled={disabledAll || saving}>
                {t.locked ? 'Izmeni' : (t.Id ? 'Sačuvaj izmene' : 'Sačuvaj')}
              </button>
              <button className="btn" onClick={()=> removeTicket(idx)} disabled={saving || (t.__auto && infinite)}>Obriši</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
