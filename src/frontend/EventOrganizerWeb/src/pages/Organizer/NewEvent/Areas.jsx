// src/pages/Organizer/NewEvent/Areas.jsx
import React, { useEffect, useMemo, useState } from 'react';
import toast from 'react-hot-toast';

import Section from './Section';
import '../../../styles/NewEvent/areas.css';
import * as areasApi from '../../../services/areasApi';
import * as daysApi from '../../../services/daysApi'; // koristimo za dropdown dana
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Polygon, CircleMarker, Tooltip, useMapEvents } from 'react-leaflet';

export default function Areas({ eventId }){
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]); // { Id?, Naziv, HEXboja, DanId, DogadjajId, Koordinate:[[x,y],...], Lokacije:[], _locked, _showMap, _localId }
  const [days, setDays] = useState([]);   // { Id, Naziv, DatumOdrzavanja }

  const disabledAll = !eventId;

  // Učitaj dane (za dropdown) i postojeća područja za event
  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!eventId){ setAreas([]); setDays([]); return; }
      try{
        setLoading(true);
        // 1) DANI — novi endpoint, pa fallback
        let rawDays = [];

        // 1) direktno sa bekenda po eventId
        try {
          rawDays = await daysApi.listForEventApi(eventId); // dani/vrati-sve-za-dogadjaj/{eventId}
        } catch {}

        // 2) fallback: vrati-sve → filtriraj po Dogadjaj === eventId
        if (!Array.isArray(rawDays) || rawDays.length === 0) {
          try {
            const all = await daysApi.listAll();
            rawDays = (all || []).filter(d => (d?.Dogadjaj ?? d?.dogadjaj) === eventId);
          } catch {}
        }

        // 3) poslednja opcija: iz područja izvuci jedinstvene DanId, pa resolve-uj
        if (!Array.isArray(rawDays) || rawDays.length === 0) {
          try {
            const allAreas = await areasApi.getAll(); // podrucja/vrati-sve
            const dayIds = [...new Set(
              (allAreas || [])
                .filter(a => (a?.DogadjajId ?? a?.dogadjajId) === eventId)
                .map(a => a?.DanId ?? a?.danId)
            )].filter(Boolean);

            const resolved = await Promise.all(dayIds.map(id => daysApi.getById(id).catch(() => null)));
            rawDays = resolved.filter(Boolean);
          } catch {}
        }

        // mapiranje u shape za dropdown
        const dayObjs = (rawDays || []).map((d,i) => ({
          Id: d?.Id ?? d?._id ?? d?.id ?? d?.ID ?? d?._id?.$oid,
          Naziv: d?.Naziv ?? d?.naziv ?? `Dan ${i+1}`,
          DatumOdrzavanja: normalizeDateString(d?.DatumOdrzavanja ?? d?.datumOdrzavanja ?? d?.datum),
        })).filter(x => !!x.Id);

        if (mounted){
          setDays(sortDays(dayObjs));
        }

        // 2) Postojeća područja
        const existing = await areasApi.getForEvent(eventId);
        const mapped = (existing||[]).map((a, idx) => ({
          _localId: a.Id || `area-${idx}`,
          _locked: true,
          _showMap: false,
          Id: a.Id,
          DogadjajId: a.DogadjajId || eventId,
          DanId: a.DanId || null,
          Naziv: a.Naziv || '',
          HEXboja: a.HEXboja || '#00aaff',
          Lokacije: Array.isArray(a.Lokacije) ? a.Lokacije : [],
          Koordinate: Array.isArray(a.Koordinate) ? a.Koordinate : [],
        }));

        if (mounted){
          setDays(sortDays(dayObjs));
          setAreas(mapped);
        }
      }catch(err){
        console.error(err);
        toast.error('Greška pri učitavanju područja.');
      }finally{
        setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [eventId]);

  // ADD: auto-refresh DANI dropdown kada Days.jsx rekreira dane
  useEffect(() => {
    async function refreshDaysOnly(){
      if (!eventId) { setDays([]); return; }

      try{
        // 1) probaj direktan endpoint za dane po eventu
        let rawDays = [];
        try { rawDays = await daysApi.listForEventApi(eventId); } catch {}

        // 2) fallback: vrati-sve pa filtriraj po Dogadjaj === eventId
        if (!Array.isArray(rawDays) || rawDays.length === 0){
          try {
            const all = await daysApi.listAll();
            rawDays = (all || []).filter(d => (d?.Dogadjaj ?? d?.dogadjaj) === eventId);
          } catch {}
        }

        // mapiraj u shape koji dropdown koristi
        const dayObjs = (rawDays || []).map((d,i) => ({
          Id: d?.Id ?? d?._id ?? d?.id ?? d?.ID ?? d?._id?.$oid,
          Naziv: d?.Naziv ?? d?.naziv ?? `Dan ${i+1}`,
          DatumOdrzavanja: normalizeDateString(d?.DatumOdrzavanja ?? d?.datumOdrzavanja ?? d?.datum),
        })).filter(x => !!x.Id);

        setDays(sortDays(dayObjs));
      }catch(err){
        console.error(err);
      }
    }

    function onDaysUpdated(e){
      // ako je event za neki drugi dogadjaj, ignoriši
      if (!eventId) return;
      const targetId = e?.detail?.eventId;
      if (targetId && targetId !== eventId) return;

      // povuci sveže dane iz baze
      refreshDaysOnly();
    }

    window.addEventListener('ne:days:updated', onDaysUpdated);
    return () => window.removeEventListener('ne:days:updated', onDaysUpdated);
  }, [eventId]);


  function sortDays(arr){
    return [...arr].sort((a,b)=>{
      const ta = Date.parse(a.DatumOdrzavanja||'') || 0;
      const tb = Date.parse(b.DatumOdrzavanja||'') || 0;
      return ta - tb;
    });
  }
  function normalizeDateString(v){
    if(!v) return '';
    if (typeof v === 'string') return v.slice(0,10);
    const d = new Date(v); if (isNaN(d)) return '';
    const y=d.getFullYear(), m=String(d.getMonth()+1).padStart(2,'0'), dd=String(d.getDate()).padStart(2,'0');
    return `${y}-${m}-${dd}`;
  }

  function addAreaCard(){
    if (!eventId){ toast.error('Kreiraj draft događaja pre uređivanja područja.'); return; }
    setAreas(prev => [
      ...prev,
      {
        _localId: `area-new-${Date.now()}`,
        _locked: false,
        _showMap: false,
        Id: null,
        DogadjajId: eventId,
        DanId: days[0]?.Id || null,
        Naziv: '',
        HEXboja: '#00aaff',
        Lokacije: [],
        Koordinate: [],
      }
    ]);
  }

  function onField(idx, field, value){
    setAreas(prev => prev.map((a,i)=> i===idx ? ({...a, [field]: value}) : a));
  }

  async function onToggleLock(idx){
    const a = areas[idx];
    if (!a) return;
    if (a._locked === true){
      setAreas(prev => prev.map((x,i)=> i===idx? ({...x, _locked:false}) : x));
      return;
    }
    // Sačuvaj (create/update)
    if (!a.DanId){
      toast.error('Izaberi dan.');
      return;
    }
    if (!/^#?[0-9a-fA-F]{6}$/.test(a.HEXboja)){
      toast.error('HEX boja mora biti u formatu #RRGGBB.');
      return;
    }
    if (!a.Koordinate || a.Koordinate.length < 3){
      toast.error('Dodaj bar 3 tačke poligona u mapi.');
      return;
    }

    try{
      setLoading(true);
      if (!a.Id){
        const created = await areasApi.create({
          DogadjajId: a.DogadjajId || eventId,
          DanId: a.DanId,
          Naziv: a.Naziv.trim(),
          HEXboja: normalizeHex(a.HEXboja),
          Koordinate: a.Koordinate,
          Lokacije: Array.isArray(a.Lokacije) ? a.Lokacije : [],
        });
        const newId = created?.Id || created?.id || created?._id || created;
        if (!newId) throw new Error('Kreiranje područja nije vratilo Id.');
        setAreas(prev => prev.map((x,i)=> i===idx ? ({...x, Id:newId, _locked:true}) : x));
        toast.success('Područje kreirano.');

        window.dispatchEvent(new CustomEvent('ne:areas:updated', {
          detail: { eventId, areaId: newId, action: 'create' }
        }));

      }else{
        await areasApi.update(a.Id, {
          DogadjajId: a.DogadjajId || eventId,
          DanId: a.DanId,
          Naziv: a.Naziv.trim(),
          HEXboja: normalizeHex(a.HEXboja),
          Koordinate: a.Koordinate,
          Lokacije: Array.isArray(a.Lokacije) ? a.Lokacije : [],
        });
        setAreas(prev => prev.map((x,i)=> i===idx ? ({...x, _locked:true}) : x));
        toast.success('Područje ažurirano.');
        window.dispatchEvent(new CustomEvent('ne:areas:updated', {
          detail: { eventId, areaId: a.Id, action: 'update' }
        }));

      }
    }catch(err){
      console.error(err);
      toast.error('Greška pri čuvanju područja.');
    }finally{
      setLoading(false);
    }
  }

  function normalizeHex(hx){
    let v = (hx||'').trim();
    if (!v.startsWith('#')) v = '#'+v;
    return v.slice(0,7);
  }

  async function onDelete(idx){
    const a = areas[idx];
    if (Array.isArray(a?.Lokacije) && a.Lokacije.length){
      toast.error('Područje sadrži lokacije. Najpre odkačite lokacije ili koristite „Obriši i odkači“.');
      return;
    }
    if (!a?.Id){ setAreas(prev => prev.filter((_,i)=>i!==idx)); return; }
    try{
      setLoading(true);
      await areasApi.remove(a.Id);
      setAreas(prev => prev.filter((_,i)=>i!==idx));
      toast.success('Područje obrisano.');
      window.dispatchEvent(new CustomEvent('ne:areas:updated', {
        detail: { eventId, areaId: a.Id, action: 'delete' }
      }));
    }catch(err){
      console.error(err);
      toast.error('Greška pri brisanju.');
    }finally{
      setLoading(false);
    }
  }


  const headerBadges = [
    loading ? { label: 'Učitavanje...', tone: 'info' } : null,
    !eventId ? { label: 'Draft nije kreiran', tone: 'warning' } : null,
    { label: `Područja: ${areas.length || 0}` },
  ].filter(Boolean);

  const addAreaButton = (
    <button className="ar-btn" disabled={disabledAll || loading} onClick={addAreaCard}>
      Dodaj područje
    </button>
  );

  return (
    <Section
      title="Područja"
      subtitle="Obeleži segmente događaja i poveži ih sa lokacijama i resursima."
      badges={headerBadges}
      actions={addAreaButton}
    >
      {!eventId && <div className="ar-note">Kreiraj draft događaja u "Osnovnim informacijama" da bi uređivao područja.</div>}

      {eventId && (
        <div className="ar-list">
          {areas.map((a, idx) => (
            <AreaCard
              key={a._localId || a.Id || idx}
              idx={idx}
              area={a}
              days={days}
              disabledAll={disabledAll || loading}
              onField={onField}
              onToggleLock={onToggleLock}
              onDelete={onDelete}
              allAreas={areas}
            />
          ))}
        </div>
      )}
    </Section>
  );
}

function AreaCard({ idx, area, days, disabledAll, onField, onToggleLock, onDelete, allAreas }){
  const [showMap, setShowMap] = useState(!!area._showMap);

  useEffect(()=>{ setShowMap(!!area._showMap); }, [area._showMap]);

  const existingOnSameDay = useMemo(()=>{
    return allAreas.filter(x => x.Id && x.DanId && x.DanId === area.DanId && x.Id !== area.Id);
  }, [allAreas, area.DanId, area.Id]);

  const dayLabel = useMemo(() => {
    const match = days.find((d) => String(d.Id) === String(area.DanId));
    return match?.Naziv || match?.naziv || (match?.RedniBroj ? `Dan ${match.RedniBroj}` : 'Dan nije dodeljen');
  }, [days, area.DanId]);

  const canSave = useMemo(()=>{
    return !disabledAll && !area._locked
      && area.Naziv?.trim()
      && area.DanId
      && /^#?[0-9a-fA-F]{6}$/.test(area.HEXboja||'')
      && Array.isArray(area.Koordinate) && area.Koordinate.length >= 3;
  }, [disabledAll, area]);

  if (area._locked){
    return (
      <div className={`ar-card locked`}>
        <div className="ar-card-head">
          <div className="ar-card-title">{area.Naziv?.trim() || 'Novo područje'}</div>
          <div className="ar-actions">
            <button className="ar-btn" disabled={disabledAll} onClick={()=>onToggleLock(idx)}>Izmeni</button>
            <button className="ar-btn" disabled={disabledAll} onClick={()=>onDelete(idx)}>Obriši</button>
          </div>
        </div>
        <div className="ar-summary">
          <div className="ar-summary-top">
            <div>
              <div className="ar-summary-title">{area.Naziv?.trim() || 'Područje'}</div>
              <div className="ar-summary-day">{dayLabel}</div>
            </div>
            <div className="ar-summary-color" style={{ background: fixColor(area.HEXboja || '#00aaff') }} />
          </div>
          <div className="ar-summary-meta">
            <span>Tačaka: {Array.isArray(area.Koordinate) ? area.Koordinate.length : 0}</span>
            <span>{existingOnSameDay.length ? `Deljeno sa ${existingOnSameDay.length} područja` : 'Samostalno područje'}</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className={`ar-card ${area._locked ? 'locked' : ''}`}>
      <div className="ar-card-head">
        <div className="ar-card-title">{area.Naziv?.trim() || 'Novo područje'}</div>
        <div className="ar-actions">
          <button
            className="ar-btn"
            disabled={disabledAll || (!area._locked && !canSave)}
            onClick={()=>onToggleLock(idx)}
          >
            {area._locked ? 'Izmeni' : (area.Id ? 'Sačuvaj izmene' : 'Sačuvaj')}
          </button>
          <button className="ar-btn" disabled={disabledAll} onClick={()=>onDelete(idx)}>Obriši</button>
        </div>
      </div>

      <div className="ar-grid">
        <label className="block">
          <div className="label">Naziv</div>
          <input className="input" value={area.Naziv||''} disabled={disabledAll || area._locked}
                 onChange={(e)=>onField(idx,'Naziv', e.target.value)} />
        </label>

        <label className="block">
          <div className="label">Dan</div>
          <select className="select" value={area.DanId||''} disabled={disabledAll || area._locked}
                  onChange={(e)=>onField(idx,'DanId', e.target.value)}>
            <option value="" disabled>— izaberi dan —</option>
            {days.map(d => (
              <option key={d.Id} value={d.Id}>
                {d.Naziv} ({d.DatumOdrzavanja})
              </option>
            ))}
          </select>
        </label>

        <label className="block">
          <div className="label">HEX boja</div>
          <div className="color-row">
            <input className="input" placeholder="#RRGGBB" value={area.HEXboja||''}
                   disabled={disabledAll || area._locked}
                   onChange={(e)=>onField(idx,'HEXboja', e.target.value)} />
            <input type="color" className="input" value={fixColor(area.HEXboja||'#00aaff')}
                   disabled={disabledAll || area._locked}
                   onChange={(e)=>onField(idx,'HEXboja', e.target.value)} />
            <div className="color-swatch" style={{ background: fixColor(area.HEXboja||'#00aaff') }} />
          </div>
        </label>
      </div>

      <div className="map-toggle">
        <button className="ar-btn" disabled={disabledAll || area._locked} onClick={()=>setShowMap(v=>!v)}>
          {showMap ? 'Sakrij mapu' : 'Uredi mapu'}
        </button>
        {!area._locked && <span style={{color:'#aaa', fontSize:12, alignSelf:'center'}}>Dodajte bar 3 tačke.</span>}
      </div>

      {showMap && (
        <MapEditorLeaflet
          color={fixColor(area.HEXboja||'#00aaff')}
          name={area.Naziv||''}
          initialPoints={Array.isArray(area.Koordinate) ? area.Koordinate : []} // lokalni draft ulaz
          locked={disabledAll || area._locked}
          existingPolys={(allAreas||[])
            .filter(x => x.Id && x.DanId === area.DanId && x.Id !== area.Id)
            .map(x => ({
              color: fixColor(x.HEXboja||'#00aaff'),
              name: x.Naziv || '',
              points: Array.isArray(x.Koordinate) ? x.Koordinate : []
            }))
          }
          onSave={(pts)=>{
            onField(idx,'Koordinate', Array.isArray(pts)? pts : []);
            setShowMap(false);
            toast.success('Mapa sačuvana.');
          }}
        />
      )}
    </div>
  );
}

function fixColor(hx){
  let v = (hx||'').trim();
  if (!v) v = '#00aaff';
  if (!v.startsWith('#')) v = '#'+v;
  if (v.length > 7) v = v.slice(0,7);
  return v;
}

function MapEditorLeaflet({ color, name, initialPoints, locked, existingPolys, onSave }){
  const [draft, setDraft] = React.useState(Array.isArray(initialPoints) ? initialPoints : []);

  React.useEffect(()=>{ 
    setDraft(Array.isArray(initialPoints) ? initialPoints : []); 
  }, [initialPoints]);

  const center = React.useMemo(() => {
    if (draft?.length >= 1){
      const [lat,lng] = draft[0] || [];
      if (Number.isFinite(lat) && Number.isFinite(lng)) return [lat,lng];
    }
    return [44.8125, 20.4612]; // Beograd default
  }, [draft]);

  function ClickCatcher(){
    useMapEvents({
      click(e){
        if (locked) return;
        const { lat, lng } = e.latlng || {};
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;

        // zabrani dodavanje unutar postojećih poligona istog dana
        for (const p of (existingPolys||[])){
          if (Array.isArray(p.points) && p.points.length >= 3){
            if (pointInPolygon([lat, lng], p.points)) return;
          }
        }
        setDraft(prev => [...prev, [lat,lng]]);
      }
    });
    return null;
  }

  const hasPoly = Array.isArray(draft) && draft.length >= 3;

  return (
    <div className="map-wrap">
      <div className="map-toolbar">
        <button className="ar-btn" disabled={locked || draft.length===0} onClick={()=>setDraft([])}>
          Obriši sve tačke
        </button>
        <button className="ar-btn" disabled={locked || draft.length===0} onClick={()=>setDraft(d=>d.slice(0,-1))}>
          Vrati unazad
        </button>
        <button className="ar-btn" disabled={locked || !hasPoly} onClick={()=>onSave?.(draft)}>
          Sačuvaj mapu
        </button>
      </div>

      <div className="map-canvas">
        <MapContainer center={center} zoom={13} style={{ width:'100%', height:'100%', borderRadius:10 }}>
          <TileLayer
            url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
            attribution='&copy; OpenStreetMap contributors'
          />

          {/* Postojeći poligoni (readonly, prozirnije) */}
          {(existingPolys||[]).map((p, i) => (
            Array.isArray(p.points) && p.points.length >= 3 ? (
              <Polygon
                key={`ex-${i}`}
                pathOptions={{ color:'#777', fillColor:p.color, fillOpacity:0.3, opacity:0.9 }}
                positions={p.points}
                interactive={false}
              >
                <Tooltip permanent direction="center">{p.name || 'Područje'}</Tooltip>
              </Polygon>
            ) : null
          ))}

          {/* Naš draft poligon */}
          {hasPoly && (
            <Polygon
              pathOptions={{ color:'#888', fillColor:color, fillOpacity:0.45, opacity:1 }}
              positions={draft}
            >
              <Tooltip permanent direction="center">{name || 'Područje'}</Tooltip>
            </Polygon>
          )}

          {/* PINOVI — isti “plavi kružić” kao i pre (radius 6) */}
          {draft.map(([lat,lng],i)=>(
            <CircleMarker key={i} center={[lat,lng]} radius={6}
              pathOptions={{ color:'#3b82f6', fillColor:'#3b82f6', fillOpacity:1 }} />
          ))}

          <ClickCatcher />
        </MapContainer>
      </div>
    </div>
  );
}

function pointInPolygon([lat, lng], poly){
  let inside = false;
  for (let i=0, j=poly.length-1; i<poly.length; j=i++){
    const [y1, x1] = poly[i];
    const [y2, x2] = poly[j];
    const intersect = ((y1 > lat) !== (y2 > lat)) &&
                      (lng < (x2 - x1) * (lat - y1) / ((y2 - y1) || 1e-12) + x1);
    if (intersect) inside = !inside;
  }
  return inside;
}
