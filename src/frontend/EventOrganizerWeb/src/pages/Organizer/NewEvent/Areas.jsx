// src/pages/Organizer/NewEvent/Areas.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import '../../../styles/NewEvent/areas.css';
import * as areasApi from '../../../services/areasApi';
import * as daysApi from '../../../services/daysApi'; // koristimo za dropdown dana

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
        // 1) Dani za event (ev.Dani -> resolve by id)
        let dayIds = await daysApi.getForEvent(eventId); // može vratiti niz stringova
        if (Array.isArray(dayIds) && dayIds.length && typeof dayIds[0] === 'string'){
          const resolved = await Promise.all(dayIds.map(id => daysApi.getById(id).catch(()=>null)));
          dayIds = resolved.filter(Boolean);
        }
        const dayObjs = (Array.isArray(dayIds)? dayIds:[]).map((d,i)=>({
          Id: d?.Id || d?.id || d?._id,
          Naziv: d?.Naziv || `Dan ${i+1}`,
          DatumOdrzavanja: normalizeDateString(d?.DatumOdrzavanja),
        })).filter(x=>x.Id);
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
    if (!a.Naziv?.trim()){
      toast.error('Unesi naziv područja.');
      return;
    }
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
    if (!a?.Id){ setAreas(prev => prev.filter((_,i)=>i!==idx)); return; }
    try{
      setLoading(true);
      await areasApi.remove(a.Id);
      setAreas(prev => prev.filter((_,i)=>i!==idx));
      toast.success('Područje obrisano.');
    }catch(err){
      console.error(err);
      toast.error('Greška pri brisanju.');
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="ar-wrap">
      <div className="ar-head">
        <div className="ar-title">Područja</div>
        <div className="ar-spacer" />
        {/* Koristim tvoj tekst: "Dodaj porcuje" */}
        <button className="ar-btn" disabled={disabledAll || loading} onClick={addAreaCard}>Dodaj porcuje</button>
      </div>

      {!eventId && <div className="ar-note">Kreiraj draft događaja u "Basic info" da bi uređivao područja.</div>}

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
    </div>
  );
}

function AreaCard({ idx, area, days, disabledAll, onField, onToggleLock, onDelete, allAreas }){
  const [showMap, setShowMap] = useState(!!area._showMap);

  useEffect(()=>{ setShowMap(!!area._showMap); }, [area._showMap]);

  const existingOnSameDay = useMemo(()=>{
    return allAreas.filter(x => x.Id && x.DanId && x.DanId === area.DanId && x.Id !== area.Id);
  }, [allAreas, area.DanId, area.Id]);

  const canSave = useMemo(()=>{
    return !disabledAll && !area._locked
      && area.Naziv?.trim()
      && area.DanId
      && /^#?[0-9a-fA-F]{6}$/.test(area.HEXboja||'')
      && Array.isArray(area.Koordinate) && area.Koordinate.length >= 3;
  }, [disabledAll, area]);

  return (
    <div className={`ar-card ${area._locked ? 'locked' : ''}`}>
      <div className="ar-card-head">
        <div className="ar-card-title">{area.Naziv?.trim() || 'Novo područje'}</div>
        <div className="ar-actions">
          <button className="ar-btn" disabled={disabledAll} onClick={()=>onToggleLock(idx)}>
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
        <MapEditor
          color={fixColor(area.HEXboja||'#00aaff')}
          name={area.Naziv||''}
          points={area.Koordinate||[]}
          setPoints={(pts)=>onField(idx,'Koordinate', pts)}
          locked={disabledAll || area._locked}
          existingPolys={(existingOnSameDay||[]).map(x=>({ color:fixColor(x.HEXboja||'#00aaff'), name:x.Naziv||'', points:x.Koordinate||[] }))}
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

/** SVG "mapa" editor – klik dodaje tačku (0..1 koordinata), Undo/Clear dugmad, poligon + labela na centroidu */
function MapEditor({ color, name, points, setPoints, locked, existingPolys }){
  const svgRef = useRef(null);

  function svgCoords(evt){
    const svg = svgRef.current;
    if (!svg) return [0,0];
    const rect = svg.getBoundingClientRect();
    const x = (evt.clientX - rect.left) / rect.width;
    const y = (evt.clientY - rect.top) / rect.height;
    return [clamp(x,0,1), clamp(y,0,1)];
  }
  function clamp(v,min,max){ return Math.max(min, Math.min(max, v)); }

  function handleClick(e){
    if (locked) return;
    // Ako kliknemo na postojeći poligon (readonly), taj polygon blokira klik (pointer-events), pa neće stići ovamo → “ne može preko njega”
    const [x,y] = svgCoords(e);
    setPoints([...(points||[]), [x,y]]);
  }

  function pathD(pts){
    if (!pts || pts.length === 0) return '';
    const px = pts.map(([x,y]) => `${x*100}%,${y*100}%`).join(' ');
    return px;
  }

  function centroid(pts){
    if (!pts || pts.length === 0) return [0.5,0.5];
    let cx=0, cy=0, A=0;
    for(let i=0;i<pts.length;i++){
      const [x1,y1] = pts[i];
      const [x2,y2] = pts[(i+1)%pts.length];
      const cross = x1*y2 - x2*y1;
      A += cross;
      cx += (x1 + x2) * cross;
      cy += (y1 + y2) * cross;
    }
    A = A/2;
    if (Math.abs(A) < 1e-8) return pts[0];
    cx = cx/(6*A); cy = cy/(6*A);
    return [clamp(cx,0,1), clamp(cy,0,1)];
  }

  const [cx, cy] = centroid(points||[]);
  return (
    <div className="map-wrap">
      <div className="map-toolbar">
        <button className="ar-btn" disabled={locked || (points||[]).length===0} onClick={()=>setPoints([])}>Obriši sve tačke</button>
        <button className="ar-btn" disabled={locked || (points||[]).length===0}
          onClick={()=>setPoints((pts)=>pts.slice(0, -1))}>Vrati unazad</button>
        <button className="ar-btn" disabled>Sačuvaj područje (čuva se gore dugmetom)</button>
      </div>

      <div className="map-canvas" onClick={handleClick}>
        <svg ref={svgRef} className="map-svg" viewBox="0 0 1000 1000" preserveAspectRatio="none">
          {/* Postojeća područja za isti dan – readonly sloj, smanjen opacity + blokira klik (pointer-events:auto) */}
          {(existingPolys||[]).map((p, i) => (
            <g key={`ex-${i}`}>
              <polygon
                className="map-poly-existing"
                points={pathD(p.points).replace(/%/g,'')}
                style={{ fill: p.color, opacity: 0.35 }}
              />
              {p.points?.length>=3 && (
                <text className="map-label" x={centroid(p.points)[0]*1000} y={centroid(p.points)[1]*1000} textAnchor="middle">
                  {p.name || 'Područje'}
                </text>
              )}
            </g>
          ))}

          {/* Naše aktivno područje */}
          {points?.length>=3 && (
            <>
              <polygon className="map-poly" points={pathD(points).replace(/%/g,'')} style={{ fill: color }} />
              <text className="map-label" x={cx*1000} y={cy*1000} textAnchor="middle">{name||'Područje'}</text>
            </>
          )}

          {/* Pinovi (plavi kružići) */}
          {(points||[]).map(([x,y],i)=>(
            <circle key={i} className="map-pin" cx={x*1000} cy={y*1000} r="6" />
          ))}
        </svg>
      </div>
    </div>
  );
}
