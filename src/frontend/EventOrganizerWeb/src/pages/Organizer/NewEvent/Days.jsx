// src/pages/Organizer/NewEvent/Days.jsx
import React, { useEffect, useState, useRef } from 'react';
import toast from 'react-hot-toast';

import Section from './Section';
import '../../../styles/NewEvent/days.css';
import * as neweventApi from '../../../services/newEventApi';
import * as daysApi from '../../../services/daysApi';

export default function Days({ eventId }){
  const [loading, setLoading] = useState(false);
  const [days, setDays] = useState([]); // {Id?, RedniBroj, Naziv, Opis, DatumOdrzavanja, _locked, localId}
  const [range, setRange] = useState({ start: null, end: null, count: 0 });

  const syncingRef = useRef(false);

  const ensureId = (obj) => obj?.Id || obj?.id || obj?._id || obj;

  // Reset (& recreate) – obriši sve dane za događaj, pa kreiraj iz "nextDays"
  async function resetAndRecreateAllDays(nextDays){
    if (!eventId || syncingRef.current) return;
    syncingRef.current = true;
    try{
      setLoading(true);

      // 1) obrisi sve postojeće dane za događaj (backend ih briše i čisti Dogadjaj.Dani)
      await daysApi.removeAllForEvent(eventId);

      // 2) kreiraj ponovo sve dane po poretku i skupi ID-jeve
      const ensuredIds = [];
      for (let i = 0; i < nextDays.length; i++){
        const d = nextDays[i];
        const payload = {
          Naziv: String(d.Naziv || `Dan ${i+1}`),
          Opis: String(d.Opis || ''),
          DatumOdrzavanja: d.DatumOdrzavanja,
          Dogadjaj: eventId
        };
        const created = await daysApi.create(payload);
        const id = ensureId(created);
        nextDays[i] = { ...d, Id: id, _locked: true, RedniBroj: i+1 };
        ensuredIds.push(id);
      }

      // 3) upiši kompletan niz ID-jeva dana u Dogadjaj
      try{
        await neweventApi.updateDayIds(eventId, ensuredIds);
        window.dispatchEvent(new CustomEvent('ne:days:updated', {
          detail: { eventId, dayIds: ensuredIds }
        }));
      }catch(e){
        console.warn('updateDayIds nije uspeo ili nije definisan:', e);
      }

      // 4) commit lokalnog stanja
      setDays(nextDays.map((d,i)=>({ ...d, Id: ensuredIds[i], _locked: true, RedniBroj: i+1 })));
      setRange(prev => ({ ...prev, count: nextDays.length }));
      toast.success('Dani resetovani i ponovo kreirani.');
    }catch(err){
      console.error(err);
      toast.error('Greška pri resetovanju dana.');
    }finally{
      syncingRef.current = false;
      setLoading(false);
    }
  }



  const disabledAll = !eventId;

  // Helpers 
  function atMidnight(date){
    const d = new Date(date);
    d.setHours(0,0,0,0);
    return d;
  }
  function daysBetweenInclusive(start, end){
    const ms = atMidnight(end).getTime() - atMidnight(start).getTime();
    return Math.floor(ms / 86400000) + 1;
  }
  function addDays(d, n){
    const x = new Date(atMidnight(d));
    x.setDate(x.getDate() + n);
    return x;
  }
  function ymd(date){
    const d = atMidnight(date);
    const yyyy = d.getFullYear();
    const mm = String(d.getMonth()+1).padStart(2,'0');
    const dd = String(d.getDate()).padStart(2,'0');
    return `${yyyy}-${mm}-${dd}`;
  }

  // Učitaj događaj i pripremi dane
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!eventId){
        setDays([]);
        setRange({ start:null, end:null, count:0 });
        return;
      }
      try{
        setLoading(true);
        const ev = await neweventApi.getById(eventId);
        const startRaw = ev?.DatumPocetka ?? ev?.DatumPocetak ?? ev?.Pocetak ?? ev?.StartDate ?? ev?.Start;
        const endRaw   = ev?.Jednodnevni ? startRaw : (ev?.DatumKraja ?? ev?.DatumZavrsetka ?? ev?.Kraj ?? ev?.EndDate ?? startRaw);

        const start = parseDateFlexible(startRaw);
        const end   = parseDateFlexible(endRaw ?? startRaw);
        if(!start){
          //setRange({ start:null, end:null, count:0 });
          //setDays([]);
          return;
        }
        const count = Math.max(1, daysBetweenInclusive(start, end));
        if(!mounted) return;
        setRange({ start, end, count });

        // Preuzmi postojeće dane (ako postoje)
        let existing = [];
        try { existing = await daysApi.getForEvent(eventId); } catch { existing = []; }

        // Ako backend vraća niz ID-jeva, resolve-uj u objekte
        if (Array.isArray(existing) && existing.length && typeof existing[0] === 'string'){
          try {
            const resolved = await Promise.all(existing.map(id => daysApi.getById(id)));
            existing = resolved.filter(Boolean);
          } catch {}
        }

        // Normalizacija i popuna do 'count'
        let next = Array.isArray(existing) ? existing.slice(0, count) : [];
        // Mapiraj u shape koji render očekuje
        next = next.map((d, i) => ({
          localId: d.Id || `day-ex-${i}`,
          Id: d.Id,
          RedniBroj: d.RedniBroj || (i+1),
          Naziv: d.Naziv || `Dan ${i+1}`,
          Opis: d.Opis || '',
          DatumOdrzavanja: d.DatumOdrzavanja ? ymd(d.DatumOdrzavanja) : ymd(addDays(start, i)),
          _locked: true, // postojeći dani kreirani su zaključani
        }));
        // Ako ih je manje od count, dodaj prazne
        if (next.length < count){
          for(let i = next.length; i < count; i++){
            const date = addDays(start, i);
            next.push({
              localId: `day-${i+1}-${date.getTime()}`,
              RedniBroj: i + 1,
              Naziv: `Dan ${i + 1}`,
              Opis: '',
              DatumOdrzavanja: ymd(date),
              _locked: false, // novi nisu zaključani
            });
          }
        }

        setDays(next);
      }catch(err){
        console.error(err);
        toast.error('Greška pri učitavanju dana.');
      }finally{
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [eventId]);

// REPLACE the whole useEffect for 'ne:dates' with this one
  useEffect(() => {
    function onDates(e){
      const d = e?.detail || {};
      if (!eventId) return;

      // 1) Pokupi start/end iz payload-a (razni nazivi polja podržani)
      const start = parseDateFlexible(d.DatumPocetka || d.DatumPocetak || d.Start || d.StartDate);
      const end   = parseDateFlexible(d.DatumKraja || d.DatumZavrsetka || d.Kraj || d.End || d.EndDate) || start;
      if (!start) return;

      // 2) Izračunaj count i upiši range u state (čisto za UI)
      const cnt = Math.max(1, daysBetweenInclusive(start, end));
      setRange({ start, end, count: cnt });

      // 3) Regeneriši lokalni niz "days" uz čuvanje UI izmena:
      //    - prvo pokušaj match po DATUMU (ako novi dan ima isti datum kao neki stari)
      //    - ako ne postoji, fallback po INDEKSU (Dan i -> stari Dan i)
      setDays(prev => {
        const next = Array.from({ length: cnt }, (_, i) => {
          const date = addDays(start, i);
          const dateKey = ymd(date);

          // match po datumu, pa fallback po indeksu
          const byDate = prev.find(x => x?.DatumOdrzavanja === dateKey);
          const keep = byDate || prev[i] || {};

          return {
            ...keep,
            localId: keep.localId || `day-${i+1}-${date.getTime()}`,
            RedniBroj: i + 1,
            Naziv: (keep.Naziv || `Dan ${i + 1}`),
            Opis: (keep.Opis || ''),
            DatumOdrzavanja: dateKey,
            _locked: keep._locked ?? false,
            // Ako si u UI imao ove kolekcije, preserve-uj ih:
            Podrucja: Array.isArray(keep.Podrucja) ? keep.Podrucja : [],
            Aktivnosti: Array.isArray(keep.Aktivnosti) ? keep.Aktivnosti : [],
          };
        });

        // 4) Backend reset & recreate sa snapshot-ovanim vrednostima
        resetAndRecreateAllDays([...next]);

        return next;
      });
    }

    window.addEventListener('ne:dates', onDates);
    return () => window.removeEventListener('ne:dates', onDates);
  }, [eventId]);



    // Prima gotove "days" iz BasicInfo i popunjava podforme (merge-uje Id/_locked ako postoje)
    useEffect(() => {
      function onDays(e){
    if (!eventId) return;
    const payload = e?.detail || {};
    const incoming = Array.isArray(payload.days) ? payload.days : [];
    if (!incoming.length) return;

    // setuj range iz payload-a (ako je poslat)
    setRange(prev => {
      const s = payload.range?.start ? new Date(payload.range.start) : prev.start;
      const en = payload.range?.end ? new Date(payload.range.end) : prev.end;
      const cnt = payload.range?.count || incoming.length;
      return { start: s, end: en, count: cnt };
    });

    // pripremi "next" niz za kreiranje (obično iz BasicInfo stize DatumOdrzavanja i default Naziv/Opis)
    setDays(prev => {
      const next = incoming.map((d, i) => {
        const keep = prev[i] || {};
        return {
          localId: keep.localId || `day-${i+1}-${d.DatumOdrzavanja}`,
          // Id ignorišemo jer svakako pravimo reset & recreate
          _locked: false,
          RedniBroj: i + 1,
          Naziv: keep.Naziv || d.Naziv,
          Opis: keep.Opis || d.Opis,
          DatumOdrzavanja: d.DatumOdrzavanja
        };
      });

      // resetuj sve na back-u i kreiraj ponovo iz next
      resetAndRecreateAllDays([...next]);

      return next;
    });
  }

    window.addEventListener('ne:days', onDays);

    // na mount zatraži trenutne vrednosti (ako BasicInfo već ima unesene datume)
    window.dispatchEvent(new Event('ne:dates:request'));

    return () => window.removeEventListener('ne:days', onDays);
  }, [eventId]);


  function onChange(idx, field, value){
    setDays(prev => prev.map((d,i)=> i===idx ? ({...d, [field]: value}) : d));
  }

  function parseDateFlexible(v){
    if(!v) return null;
    if(v instanceof Date) return new Date(v.getTime());
    if(typeof v === 'number') return new Date(v);
    if(typeof v === 'string'){
      // dd.MM.yyyy ili dd/MM/yyyy ili dd-MM-yyyy
      const m = v.match(/^(\d{1,2})[./-](\d{1,2})[./-](\d{4})$/);
      if(m){
        const dd = parseInt(m[1],10), mm = parseInt(m[2],10)-1, yyyy = parseInt(m[3],10);
        const d = new Date(yyyy, mm, dd); d.setHours(0,0,0,0); return d;
      }
      const iso = new Date(v);
      if(!isNaN(iso)) return iso;
    }
    return null;
  }


  async function onToggle(idx){
    if (!eventId) return;
    const d = days[idx];
    if (!d) return;

    if (d._locked === true){
      // Izmeni -> otključaj
      setDays(prev => prev.map((x,i)=> i===idx ? ({...x, _locked:false}) : x));
      return;
    }

    // Sačuvaj (kreiraj ili azuriraj)
    const payload = {
      Naziv: String(d.Naziv || '').trim() || `Dan ${d.RedniBroj}`,
      Opis: String(d.Opis || '').trim(),
      DatumOdrzavanja: d.DatumOdrzavanja, // YYYY-MM-DD
    };

    try{
      let savedId = d.Id;
      if (!d.Id){
        // Kreiraj
        const created = await daysApi.create({
          ...payload,
          Dogadjaj: eventId,
        });
        savedId = created?.Id || created?.id || created;
        if (!savedId) {
          toast.error('Kreiranje dana nije vratilo ID.');
          return;
        }
      }else{
        // Ažuriraj
        await daysApi.update(d.Id, payload);
      }

      // Zaključa se forma i upiše Id
      setDays(prev => prev.map((x,i)=> i===idx ? ({...x, Id: savedId, _locked:true}) : x));
      toast.success(d.Id ? 'Dan ažuriran.' : 'Dan kreiran.');
    }catch(err){
      console.error(err);
      toast.error('Greška pri čuvanju dana.');
    }
  }

  const lockedCount = days.filter((d) => d._locked).length;
  const headerBadges = [
    loading ? { label: 'Učitavanje...', tone: 'info' } : null,
    !eventId ? { label: 'Draft nije kreiran', tone: 'warning' } : null,
    range.count ? { label: `Planiranih dana: ${range.count}` } : null,
    days.length ? { label: `Zaključano: ${lockedCount}/${days.length}` } : null,
  ].filter(Boolean);

  return (
    <Section
      title="Dani događaja"
      subtitle="Prilagodi raspored i nazive pojedinačnih dana u skladu sa planom događaja."
      badges={headerBadges}
    >
      {!eventId && (
        <div className="dy-note">Kreiraj draft događaja u "Osnovnim informacijama" da bi uređivao dane.</div>
      )}

      {eventId && range.count === 0 && (
        <div className="dy-note">Postavi datume u "Osnovnim informacijama" kako bi se automatski generisali dani.</div>
      )}

      {eventId && range.count > 0 && (
        <div className="dy-main">
          <div className="dy-list">
            {days.map((d, idx) => (
              <div key={d.localId || idx} className={`dy-card ${d._locked ? 'is-locked' : ''}`}>
                <div className="dy-card-head">
                  <div className="dy-title">Dan {d.RedniBroj}</div>
                  <div className="dy-badge">{d.DatumOdrzavanja}</div>
                  <div className="dy-spacer" />
                  <div className="dy-actions">
                    <button className="dy-btn" disabled={!eventId || loading} onClick={()=>onToggle(idx)}>
                      {d._locked ? 'Izmeni' : (d.Id ? 'Sačuvaj izmene' : 'Sačuvaj')}
                    </button>
                  </div>
                </div>

                <div className="dy-sep" />

                <div className="dy-grid">
                  <label className="block">
                    <div className="label mb-1">Naziv</div>
                    <input className="input" value={d.Naziv} onChange={e=>onChange(idx,'Naziv', e.target.value)} disabled={loading || d._locked}/>
                  </label>
                  <label className="block">
                    <div className="label mb-1">Opis</div>
                    <input className="input" value={d.Opis} onChange={e=>onChange(idx,'Opis', e.target.value)} disabled={loading || d._locked}/>
                  </label>
                  <label className="block">
                    <div className="label mb-1">Datum održavanja</div>
                    <input className="input" type="date" value={d.DatumOdrzavanja} readOnly disabled/>
                  </label>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </Section>
  );
}
