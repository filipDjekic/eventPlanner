// src/pages/Organizer/NewEvent/BasicInfo.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';

import Section from './Section';
import '../../../styles/NewEvent/basicinfo.css';
import { getAuth } from '../../../utils/auth';
import * as basicInfoApi from '../../../services/basicinfoapi';
import * as neweventApi from '../../../services/newEventApi';

const KATEGORIJE = ['utakmica', 'protest', 'vašar', 'žurka', 'festival', 'ostalo'];

export default function BasicInfo({ eventId, onEventId, onBasicInfoChange }){
  const auth = useMemo(() => getAuth?.() ?? {}, []);

  const [form, setForm] = useState({
    Naziv: '',
    Lokacija: '',
    Jednodnevni: false,
    DatumPocetka: '',
    DatumKraja: '',
    KrajVreme: '',
    Kapacitet: '',
    Beskonacno: false,
    Kategorija: '',
    OpisHtml: '',
  });

  const [busy, setBusy] = useState(false);
  const [imgFile, setImgFile] = useState(null);
  const [imgPreview, setImgPreview] = useState(null);

  // RTE
  const opisRef = useRef(null);
  const [rtState, setRtState] = useState({ b:false, i:false, u:false, ul:false });
  const [deferredUpload, setDeferredUpload] = useState(false);
  const debounceRef = useRef(null);
  const fileInputRef = useRef(null);

  function nowLocalISO(){
    const d = new Date();
    const tzOffset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOffset*60000);
    return local.toISOString().slice(0,16);
  }

  function onChange(e){
    const { name, type, checked, value } = e.target;
    setForm(prev => {
      const next = { ...prev, [name]: type === 'checkbox' ? checked : value };
      if (name === 'Beskonacno') {
        next.Kapacitet = checked ? '9999999' : next.Kapacitet;
      }
      if (name === 'Jednodnevni') {
        next.KrajVreme = '';
      }
      return next;
    });
  }
  useEffect(() => {
    try {
      window.dispatchEvent(new CustomEvent('ne:basicinfo', {
        detail: {
          Kapacitet: Number(form?.Beskonacno === true ? 9999999 : (form?.Kapacitet || 0)),
          Beskonacno: form?.Beskonacno === true,
        }
      }));
      try { onBasicInfoChange?.({ capacity: Number(form?.Beskonacno === true ? 9999999 : (form?.Kapacitet || 0)), infinite: form?.Beskonacno === true }); } catch {}
    } catch {}
  }, [form?.Kapacitet, form?.Beskonacno]);

  function buildPayload(){
    const start = form.DatumPocetka ? new Date(form.DatumPocetka) : null;
    let end = null;
    if(form.Jednodnevni && start && form.KrajVreme){
      const [hh,mm] = String(form.KrajVreme).split(':');
      const stitched = new Date(start);
      stitched.setHours(parseInt(hh||'0',10), parseInt(mm||'0',10), 0, 0);
      end = stitched;
    }else if(form.DatumKraja){
      end = new Date(form.DatumKraja);
    }

    return {
      Id: (eventId || null),
      Beskonacno: !!form.Beskonacno,
      Naziv: form.Naziv.trim(),
      Lokacija: form.Lokacija.trim(),
      DatumPocetka: start ? start.toISOString() : null,
      DatumKraja: end ? end.toISOString() : null,
      Opis: (opisRef.current?.innerText || '').trim().length ? form.OpisHtml : '',
      Kapacitet: Number(form.Beskonacno ? 9999999 : (form.Kapacitet||0)),
      Tagovi: [],
      Kategorija: form.Kategorija || 'ostalo',
      Status: 'u pripremi',
      OrganizatorId: auth?.id ?? null,
    };
  }

  const endTimeMin = React.useMemo(() => {
    if(!form.DatumPocetka) return '';
    const d = new Date(form.DatumPocetka);
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    return `${hh}:${mm}`;
  }, [form.DatumPocetka]);

  function hasMinimum(){
    if(!form.Naziv?.trim()) return false;
    if(!form.Lokacija?.trim()) return false;
    if(!form.DatumPocetka) return false;
    if(form.Jednodnevni){
      if(!form.KrajVreme) return false;
    }else{
      if(!form.DatumKraja) return false;
    }
    if(!form.Beskonacno){
      if(String(form.Kapacitet).trim()==='' || !Number.isFinite(Number(form.Kapacitet))) return false;
    }
    if(!form.Kategorija) return false;
    if(!(opisRef.current?.innerText || '').trim().length) return false;

    const now = new Date();
    const start = new Date(form.DatumPocetka);
    if(start < now) return false;

    let end = null;
    if(form.Jednodnevni){
      const [hh,mm] = String(form.KrajVreme).split(':');
      const stitched = new Date(start);
      stitched.setHours(parseInt(hh||'0',10), parseInt(mm||'0',10), 0, 0);
      end = stitched;
    }else{
      end = new Date(form.DatumKraja);
    }
    if(end < start) return false;

    return true;
  }

  useEffect(() => {
    if (deferredUpload && eventId && imgFile && !busy){
      setDeferredUpload(false);
      uploadImage(imgFile);
    }
  }, [deferredUpload, eventId, imgFile, busy]);

  // Šalje RANGE na svaku promenu datuma,
  // i čim postoji i kraj → šalje gotove "dane" (array) ka Days
  useEffect(() => {
    try {
      const startISO = form?.DatumPocetka || null;
      const endISO = form?.Jednodnevni
        ? (startISO && form?.KrajVreme ? `${startISO.slice(0,10)}T${form.KrajVreme}` : startISO)
        : (form?.DatumKraja || null);

      // 1) Uvek pošalji range (da Days reaguje i na parcijalne izmene)
      window.dispatchEvent(new CustomEvent('ne:dates', {
        detail: {
          DatumPocetka: startISO,
          DatumKraja: endISO,
          Jednodnevni: !!form?.Jednodnevni,
        }
      }));

      // 2) Ako imamo i početak i kraj → izračunaj i pošalji "dane"
      if (startISO && (endISO || form?.Jednodnevni)) {
        const atMidnight = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
        const ymd = (d)=>{ const x=atMidnight(d); const y=x.getFullYear(); const m=String(x.getMonth()+1).padStart(2,'0'); const dd=String(x.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; };
        const addDays = (d,n)=>{ const x=atMidnight(d); x.setDate(x.getDate()+n); return x; };

        const start = new Date(startISO);
        const end = new Date(endISO || startISO);
        if (!isNaN(start) && !isNaN(end)) {
          const total = Math.floor((atMidnight(end) - atMidnight(start))/86400000) + 1;
          const count = Math.max(1, total);
          const days = [];
          for (let i=0;i<count;i++){
            const date = addDays(start, i);
            days.push({
              RedniBroj: i+1,
              Naziv: `Dan ${i+1}`,
              Opis: '',
              DatumOdrzavanja: ymd(date),
            });
          }
          window.dispatchEvent(new CustomEvent('ne:days', {
            detail: {
              days,
              range: { start: startISO, end: (endISO || startISO), count }
            }
          }));
        }
      }
    } catch {}
  }, [form?.DatumPocetka, form?.DatumKraja, form?.KrajVreme, form?.Jednodnevni]);

  // Ako Days zatraži (na mount), odmah re-emituj datume i dane
  useEffect(() => {
    function onDatesRequest(){
      try {
        const startISO = form?.DatumPocetka || null;
        const endISO = form?.Jednodnevni
          ? (startISO && form?.KrajVreme ? `${startISO.slice(0,10)}T${form.KrajVreme}` : startISO)
          : (form?.DatumKraja || null);

        window.dispatchEvent(new CustomEvent('ne:dates', {
          detail: { DatumPocetka: startISO, DatumKraja: endISO, Jednodnevni: !!form?.Jednodnevni }
        }));

        if (startISO && (endISO || form?.Jednodnevni)) {
          const atMidnight = (d) => { const x = new Date(d); x.setHours(0,0,0,0); return x; };
          const ymd = (d)=>{ const x=atMidnight(d); const y=x.getFullYear(); const m=String(x.getMonth()+1).padStart(2,'0'); const dd=String(x.getDate()).padStart(2,'0'); return `${y}-${m}-${dd}`; };
          const addDays = (d,n)=>{ const x=atMidnight(d); x.setDate(x.getDate()+n); return x; };
          const start = new Date(startISO);
          const end = new Date(endISO || startISO);
          if (!isNaN(start) && !isNaN(end)) {
            const total = Math.floor((atMidnight(end) - atMidnight(start))/86400000) + 1;
            const count = Math.max(1, total);
            const days = Array.from({length: count}, (_,i)=>({
              RedniBroj: i+1, Naziv: `Dan ${i+1}`, Opis: '', DatumOdrzavanja: ymd(addDays(start,i))
            }));
            window.dispatchEvent(new CustomEvent('ne:days', { detail: { days, range: { start: startISO, end: (endISO || startISO), count } } }));
          }
        }
      } catch {}
    }
    window.addEventListener('ne:dates:request', onDatesRequest);
    return () => window.removeEventListener('ne:dates:request', onDatesRequest);
  }, [form?.DatumPocetka, form?.DatumKraja, form?.KrajVreme, form?.Jednodnevni]);



  useEffect(() => {
    if(debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if(!auth?.id) return;
      if(!hasMinimum()) return;

      const payload = buildPayload();
      try{
        setBusy(true);
        if(!eventId){
          const created = await basicInfoApi.createDraft(payload);
          const id = created?.id || created?.Id || created;
          if(id){
            onEventId?.(id);
            toast.success('Draft događaja je kreiran.');
          }
        }else{
          await basicInfoApi.updateDraft(eventId, payload);
        }
      }catch(err){
        const msg = err?.response?.data || 'Greška pri automatskom čuvanju.';
        toast.error(typeof msg === 'string' ? msg : 'Greška pri automatskom čuvanju.');
      }finally{
        setBusy(false);
      }
    }, 600);

    return () => clearTimeout(debounceRef.current);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [form.Naziv, form.Lokacija, form.DatumPocetka, form.DatumKraja, form.KrajVreme, form.Jednodnevni, form.Kapacitet, form.Beskonacno, form.Kategorija, form.OpisHtml]);

  // RTE helpers
  function cmd(action){
    if(opisRef.current){
      opisRef.current.focus();
      document.execCommand(action, false, null);
      syncRtState();
      setForm(prev => ({ ...prev, OpisHtml: opisRef.current.innerHTML }));
    }
  }
  function opisOnInput(){
    setForm(prev => ({ ...prev, OpisHtml: opisRef.current?.innerHTML || '' }));
    syncRtState();
  }
  function syncRtState(){
    try{
      const b = document.queryCommandState('bold');
      const i = document.queryCommandState('italic');
      const u = document.queryCommandState('underline');
      const ul = document.queryCommandState('insertUnorderedList');
      setRtState({ b, i, u, ul });
    }catch{}
  }
  useEffect(() => {
    const onSel = () => syncRtState();
    document.addEventListener('selectionchange', onSel);
    return () => document.removeEventListener('selectionchange', onSel);
  }, []);

  function onFileChange(e){
    const f = e.target.files?.[0] || null;
    setImgFile(f);
    setImgPreview(f ? URL.createObjectURL(f) : null);
    if (!f) return;

    if (eventId){
      uploadImage(f);
    }else{
      setDeferredUpload(true);
    }
    e.target.value = '';
  }

  async function uploadImage(fileArg){
    const fileToUpload = fileArg || imgFile;
    if (!fileToUpload){ toast.error('Izaberite sliku.'); return; }

    const id = eventId;
    if (!id){
      return;
    }

    try{
      setBusy(true);
      await neweventApi.uploadImage(id, fileToUpload, '');
      toast.success('Slika je sačuvana.');
    }catch(err){
      const msg = err?.response?.data || 'Greška pri uploadu slike.';
      toast.error(typeof msg === 'string' ? msg : 'Greška pri uploadu slike.');
    }finally{
      setBusy(false);
    }
  }

  const headerBadges = [
    busy ? { label: 'Sačuvaj u toku', tone: 'info' } : null,
    eventId
      ? { label: `Draft ID ${eventId}`, tone: 'success' }
      : { label: 'Draft nije kreiran', tone: 'warning' }
  ].filter(Boolean);

  return (
    <Section
      title="Osnovne informacije"
      subtitle="Popuni ključne detalje o događaju. Kada ispuniš obavezna polja automatski kreiramo draft koji koriste ostale sekcije."
      badges={headerBadges}
    >
      <div className="space-y-6">
      {/* Naziv / Lokacija */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <label className="block">
          <div className="label mb-1">Naziv *</div>
          <input className="input" name="Naziv" value={form.Naziv} onChange={onChange} placeholder="npr. Summer Fest 2026" />
        </label>
        <label className="block">
          <div className="label mb-1">Lokacija *</div>
          <input className="input" name="Lokacija" value={form.Lokacija} onChange={onChange} placeholder="npr. Rim, Italija" />
        </label>
      </div>

      {/* Datumi u istom redu; checkbox ispod početka */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <label className="block">
            <div className="label mb-1">Datum početka *</div>
            <input type="datetime-local" className="input" name="DatumPocetka" min={nowLocalISO()} value={form.DatumPocetka} onChange={onChange} />
          </label>
          <label className="label mt-2 flex items-center gap-2">
            <input type="checkbox" name="Jednodnevni" checked={form.Jednodnevni} onChange={onChange} />
            Jednodnevni
          </label>
        </div>
        <label className="block">
          <div className="label mb-1">{form.Jednodnevni ? 'Vreme završetka *' : 'Datum kraja *'}</div>
          {form.Jednodnevni ? (
            <input
              type="time"
              className="input"
              name="KrajVreme"
              value={form.KrajVreme}
              onChange={onChange}
              disabled={!form.DatumPocetka}           // 🔒 ne može dok nema početka
              min={endTimeMin || undefined}           // ⛳ ne može pre vremena početka
            />
          ) : (
            <input
              type="datetime-local"
              className="input"
              name="DatumKraja"
              value={form.DatumKraja}
              onChange={onChange}
              disabled={!form.DatumPocetka}           // 🔒 ne može dok nema početka
              min={form.DatumPocetka || undefined}    // ⛳ ne može pre početka
            />
          )}
        </label>
      </div>

      {/* Kapacitet / Kategorija */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div>
          <div className="label mb-1">Kapacitet {form.Beskonacno ? '(beskonačno)' : '*'}</div>
          <div className="flex items-center gap-3">
            <input
              type="number"
              className="input bi-capacity"
              name="Kapacitet"
              min="0"
              disabled={form.Beskonacno}    // 🔒 zaključan kada je “beskonačno”
              value={form.Kapacitet}
              onChange={onChange}
              placeholder='npr. 1000'
            />
            <label className="flex items-center gap-2 text-sm">
              <input type="checkbox" name="Beskonacno" checked={form.Beskonacno} onChange={onChange} />
              beskonačno
            </label>
          </div>
        </div>
        <label className="block">
          <div className="label mb-1">Kategorija *</div>
          <select className="input" name="Kategorija" value={form.Kategorija} onChange={onChange}>
            <option value="">— izaberi —</option>
            {KATEGORIJE.map(k => <option key={k} value={k}>{k}</option>)}
          </select>
        </label>
      </div>

      {/* Opis (RTE) */}
      <div className="space-y-2">
        <div className="label">Opis *</div>
        <div className="rt-toolbar">
          <button type="button" className={rtState.b ? 'active' : ''} onClick={() => cmd('bold')}><b>B</b></button>
          <button type="button" className={rtState.i ? 'active' : ''} onClick={() => cmd('italic')}><i>I</i></button>
          <button type="button" className={rtState.u ? 'active' : ''} onClick={() => cmd('underline')}><u>U</u></button>
          <button type="button" className={rtState.ul ? 'active' : ''} onClick={() => cmd('insertUnorderedList')}>• lista</button>
        </div>
        <div
          ref={opisRef}
          className="input min-h-[140px] rt-editor"
          contentEditable
          onInput={opisOnInput}
          data-placeholder="Kratak opis događaja…"
        />
      </div>

      {/* Slika DOLE ispod opisa, thumbnail prikaz */}
      <div className="space-y-2">
        <div className="label">Slika događaja</div>

        {/* Skriveni input — otvaramo ga klikom na dugme */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={onFileChange}
          className="bi-file"        // sakriveno
          disabled={busy}
        />

        {/* Jedino vidljivo dugme */}
        <button
          type="button"
          className="btn bi-upload-btn"
          onClick={() => fileInputRef.current?.click()}
          disabled={busy}
        >
          {busy ? 'Otpremam…' : 'Otpremi sliku'}
        </button>

        {imgPreview && (
          <img className="img-thumb" src={imgPreview} alt="preview" />
        )}
      </div>
      </div>
    </Section>
  );
}
