// src/pages/Organizer/NewEvent/BasicInfo.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import '../../../styles/NewEvent/basicinfo.css';
import toast from 'react-hot-toast';
import { getAuth } from '../../../utils/auth';
import * as basicinfoApi from '../../../services/basicinfoapi';
import * as neweventApi from '../../../services/newEventApi';

const KATEGORIJE = ['utakmica', 'protest', 'vašar', 'žurka', 'festival', 'ostalo'];

export default function BasicInfo({ eventId, onEventId }){
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
  const debounceRef = useRef(null);
  // Derived min for end time in 'Jednodnevni' mode
  const endTimeMin = React.useMemo(() => {
    if(!form.DatumPocetka) return '';
    const d = new Date(form.DatumPocetka);
    const hh = String(d.getHours()).padStart(2,'0');
    const mm = String(d.getMinutes()).padStart(2,'0');
    return `${hh}:${mm}`;
  }, [form.DatumPocetka]);
  const shownRef = useRef(false);

  function extractId(obj){
    if(!obj) return null;
    const cand = [
      obj.id, obj.Id, obj._id, obj.eventId, obj.dogadjajId,
      obj.value?.id, obj.value?.Id, obj.value?._id, obj?._id?.$oid
    ];
    for(const v of cand){
      if(typeof v === 'string' && v) return v;
    }
    return null;
  }

  // Hidden file input
  const fileInputRef = useRef(null);

  function localISO(date){
    if(!date) return '';
    const d = new Date(date);
    const tzOffset = d.getTimezoneOffset();
    const local = new Date(d.getTime() - tzOffset*60000);
    return local.toISOString().slice(0,16);
  }

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
      if(name === 'Beskonacno'){
        next.Kapacitet = checked ? '9999999' : '';
      }
      if(name === 'Jednodnevni'){
        next.KrajVreme = '';
      }
      return next;
    });
  }

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
    if(debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      if(!auth?.id) return;
      if(!hasMinimum()) return;

      const payload = buildPayload();
      try{
        setBusy(true);
        if(!eventId){
          const created = await basicinfoApi.createDraft(payload);
          const id = extractId(created);
          if(id){
            onEventId?.(id);
            if(!shownRef.current){ toast.success('Draft događaja je kreiran.'); shownRef.current = true; }
          } else {
            if(!shownRef.current){ toast.success('Draft događaja je kreiran.'); shownRef.current = true; }
          }
        }else{
          await basicinfoApi.updateDraft(eventId, payload);
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
    const f = e.target.files?.[0];
    setImgFile(f || null);
    if(f){
      const url = URL.createObjectURL(f);
      setImgPreview(url);
    }else{
      setImgPreview(null);
    }
  }

  async function ensureDraftId(){
    if(eventId) return eventId;
    if(!hasMinimum()){
      toast.error('Popuni osnovne podatke pre dodavanja slike.');
      return null;
    }
    try{
      setBusy(true);
      const created = await basicinfoApi.createDraft(buildPayload());
      const id = extractId(created);
      if(id){
        onEventId?.(id);
        if(!shownRef.current){ toast.success('Draft događaja je kreiran.'); shownRef.current = true; }
        return id;
      } else {
        if(!shownRef.current){ toast.success('Draft događaja je kreiran.'); shownRef.current = true; }
        return null;
      }
    }catch(err){
      const msg = err?.response?.data || 'Greška pri čuvanju drafta.';
      toast.error(typeof msg === 'string' ? msg : 'Greška pri čuvanju drafta.');
      return null;
    }finally{
      setBusy(false);
    }
    return null;
  }

  async function uploadImage(){
    if(!imgFile){ toast.error('Izaberite sliku.'); return; }
    const id = await ensureDraftId();
    if(!id) return;
    try{
      setBusy(true);
      await neweventApi.uploadImage(id, imgFile, '');
      toast.success('Slika je sačuvana.');
    }catch(err){
      const msg = err?.response?.data || 'Greška pri uploadu slike.';
      toast.error(typeof msg === 'string' ? msg : 'Greška pri uploadu slike.');
    }finally{
      setBusy(false);
    }
  }

  function onUploadClick(){
    if(!imgFile){
      fileInputRef.current?.click();
    }else{
      uploadImage();
    }
  }

  return (
    <div className="mx-auto max-w-5xl"> {/* malo šire */}
      <div className="form-card space-y-5">
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
              <input type="time" className="input" name="KrajVreme" value={form.KrajVreme} onChange={onChange}
              min={endTimeMin || undefined} disabled={!form.DatumPocetka} />
            ) : (
              <input type="datetime-local" className="input" name="DatumKraja" value={form.DatumKraja} onChange={onChange}
              min={form.DatumPocetka ? form.DatumPocetka : undefined} disabled={!form.DatumPocetka} />
            )}
          </label>
        </div>

        {/* Kapacitet / Kategorija */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <div className="label mb-1">Kapacitet {form.Beskonacno ? '(beskonačno)' : '*'}</div>
            <div className="flex items-center gap-3">
              <input type="number" className="input bi-capacity" name="Kapacitet" min="0" disabled={form.Beskonacno} value={form.Kapacitet} onChange={onChange} placeholder="npr. 1000" />
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

        {/* Slika: sakriven file input + jedno dugme (izaberi/otpremi) */}
        <div className="space-y-2">
          <div className="label">Slika događaja</div>

          <input
            ref={fileInputRef}
            type="file"
            accept="image/*"
            onChange={onFileChange}
            className="bi-file"
          />

          <div className="flex items-center gap-3">
            <button className="btn bi-upload-btn" onClick={onUploadClick} disabled={busy}>
              {busy ? 'Radim…' : (imgFile ? 'Otpremi sliku' : 'Izaberi sliku')}
            </button>
            {imgFile && <span className="text-sm opacity-80 truncate max-w-[220px]">{imgFile.name}</span>}
          </div>

          {imgPreview && (
            <img className="img-thumb" src={imgPreview} alt="preview" />
          )}
        </div>
      </div>
    </div>
  );
}
