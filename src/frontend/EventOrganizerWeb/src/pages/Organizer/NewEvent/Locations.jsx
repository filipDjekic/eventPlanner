// src/pages/Organizer/NewEvent/Locations.jsx
import React, { useEffect, useMemo, useState, useCallback } from 'react';
import toast from 'react-hot-toast';

import '../../../styles/NewEvent/areas.css';
import '../../../styles/NewEvent/locations.css';

import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

import * as areasApi from '../../../services/areasApi';
import * as locationsApi from '../../../services/locationsApi';
import api from '../../../services/api';
import { listAllResources, reserveResource, cancelReservation } from '../../../services/resourcesApi';

const TIP_LOKACIJA = {
  BINA:       { label: 'Bina',       color: '#e11d48' },
  ULAZ:       { label: 'Ulaz',       color: '#1d4ed8' },
  WC:         { label: 'WC',         color: '#16a34a' },
  INFO:       { label: 'Info',       color: '#9333ea' },
  VIP:        { label: 'VIP',        color: '#f59e0b' },
  BAR:        { label: 'Bar',        color: '#0ea5e9' },
  HRANA:      { label: 'Hrana',      color: '#10b981' },
  PARKING:    { label: 'Parking',    color: '#64748b' },
  BEZBEDNOST: { label: 'Bezbednost', color: '#ef4444' },
};

const DEFAULT_COLOR = '#1f6feb';
function isHex(v){ return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v||''); }
function normalizeId(x){ return x?.Id || x?._id || x?.id || null; }

function polygonCentroid(poly){
  if (!Array.isArray(poly) || poly.length < 3) return null;
  let area = 0, cx = 0, cy = 0;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++){
    const [y1, x1] = poly[j]; const [y2, x2] = poly[i];
    const cross = (x1 * y2) - (x2 * y1);
    area += cross; cx += (x1 + x2) * cross; cy += (y1 + y2) * cross;
  }
  area *= 0.5;
  if (Math.abs(area) < 1e-9){
    const avg = poly.reduce((s, p) => [s[0]+p[0], s[1]+p[1]], [0,0]);
    return [avg[0]/poly.length, avg[1]/poly.length];
  }
  return [cy/(6*area), cx/(6*area)];
}
function pointInPolygon([lat, lng], poly){
  let inside = false;
  for (let i = 0, j = poly.length - 1; i < poly.length; j = i++){
    const [y1, x1] = poly[i], [y2, x2] = poly[j];
    const intersect = ((y1 > lat) !== (y2 > lat)) &&
      (lng < (x2 - x1) * (lat - y1) / ((y2 - y1) || 1e-12) + x1);
    if (intersect) inside = !inside;
  }
  return inside;
}

// Custom “kapsula” pin (plava pozadina + sivi krug + naziv)
function makePillIcon({ text, color = '#0ea5e9' } = {}) {
  const safeText = String(text || '').replace(/</g, '&lt;').replace(/>/g, '&gt;');
  const html = `
    <div class="pill-pin" style="
      display:inline-flex;align-items:center;gap:10px;
      background:${color};padding:6px 14px;border-radius:18px;
      box-shadow:0 2px 6px rgba(0,0,0,.15); color:#e5e7eb; font-weight:600;">
      <span style="
        width:18px;height:18px;border-radius:50%;
        background:#bdbdbd;border:3px solid #ffffff;display:inline-block"></span>
      <span style="line-height:1">${safeText || 'Lokacija'}</span>
    </div>`;
  return L.divIcon({
    className: 'pin-divicon',
    html,
    iconSize: [1, 1],
    iconAnchor: [0, 20],
  });
}

function PinPicker({ area, color, name, pin, onChangePin, onClose }){
  let positions = [];
  const raw = area?.Koordinate ?? area?.koordinate ?? [];
  if (Array.isArray(raw)) positions = raw;
  else if (typeof raw === 'string'){ try{ positions = JSON.parse(raw); }catch{} }

  const center = React.useMemo(() => {
    if (positions.length >= 3) return polygonCentroid(positions) || positions[0];
    return positions[0] || [44.8125, 20.4612];
  }, [positions]);

  function ClickCatcher(){
    useMapEvents({
      click(e){
        const { lat, lng } = e.latlng || {};
        if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
        if (!pointInPolygon([lat, lng], positions)) return;
        onChangePin?.([lat, lng]); // čuva se u parent state-u
      }
    });
    return null;
  }

  const icon = useMemo(() => makePillIcon({ text: name, color: color || DEFAULT_COLOR }), [name, color]);

  return (
    <div className="map-wrap" style={{ marginBottom: 16 }}>
      <div className="map-toolbar">
        <button className="ar-btn" onClick={() => onClose?.()}>Zatvori mapu</button>
        <div className="ar-spacer" />
        <span className="label">Klikni unutar izabranog područja da postaviš pin</span>
      </div>
      <div className="map-canvas">
        <MapContainer center={center} zoom={15} style={{ width:'100%', height:'320px', borderRadius:10 }}>
          <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                     attribution="&copy; OpenStreetMap contributors" />
          {positions.length >= 3 && (
            <Polygon positions={positions}
                     pathOptions={{ color:'#777', fillColor:color||'#3b82f6', fillOpacity:0.30, opacity:1 }}
                     interactive={false} />
          )}
          {Array.isArray(pin) && pin.length === 2 && (
            <Marker position={pin} icon={icon} />
          )}
          <ClickCatcher />
        </MapContainer>
      </div>
    </div>
  );
}

export default function Locations({ eventId }){
  const [loading, setLoading] = useState(false);

  const [areas, setAreas] = useState([]);
  const [locations, setLocations] = useState([]);

  const [showEditor, setShowEditor] = useState(false);
  const [lock, setLock] = useState(false);

  const [locId, setLocId] = useState(null);
  const [naziv, setNaziv] = useState('');
  const [opis, setOpis] = useState('');
  const [podrucjeId, setPodrucjeId] = useState('');
  const [tip, setTip] = useState('');
  const [hex, setHex] = useState(DEFAULT_COLOR);
  const [pin, setPin] = useState({ x:null, y:null });
  const [showMap, setShowMap] = useState(false);

  const [suppliers, setSuppliers] = useState([]);
  const [selSupplier, setSelSupplier] = useState('');
  const [resources, setResources] = useState([]);
  const [selResource, setSelResource] = useState('');
  const [qty, setQty] = useState('');
  const [reserved, setReserved] = useState([]);

  const [descModal, setDescModal] = useState({ open:false, title:'', text:'' });

  const openDesc = (r) => setDescModal({ open:true, title: r?.naziv || 'Resurs', text: r?.opis || 'Nema opisa.' });
  const closeDesc = () => setDescModal({ open:false, title:'', text:'' });

  useEffect(() => {
    let mounted = true;
    (async () => {
      if (!eventId) return;
      try{
        setLoading(true);
        const [areasAll, locs, sups, ress] = await Promise.all([
          areasApi.getAll().catch(() => []),
          locationsApi.listByEvent(eventId).catch(() => []),
          api.get('dobavljaci/vrati-sve').then(r => r.data).catch(() => []),
          listAllResources().catch(() => []),
        ]);
        if (!mounted) return;
        setAreas(Array.isArray(areasAll) ? areasAll : []);
        setLocations(Array.isArray(locs) ? locs : []);
        setSuppliers(Array.isArray(sups) ? sups : []);
        setResources(Array.isArray(ress) ? ress : []);
      }catch{
        toast.error('Ne mogu da učitam lokacije/područja ili resurse.');
      }finally{
        if (mounted) setLoading(false);
      }
    })();
    return () => { mounted = false; };
  }, [eventId]);

  const currentArea = useMemo(() => {
    if (!podrucjeId) return null;
    return (areas || []).find(a => String(normalizeId(a)) === String(podrucjeId)) || null;
  }, [areas, podrucjeId]);

  const supplierNameById = (id) => {
    const s = suppliers.find(x => String((x?.Id ?? x?._id ?? x?.id)) === String(id));
    return s?.Naziv || s?.naziv || '';
  };
  const newLocation = useCallback(() => {
    setShowEditor(true);
    setLock(false);
    setLocId(null);
    setNaziv('');
    setOpis('');
    setPodrucjeId('');
    setTip('');
    setHex(DEFAULT_COLOR);
    setPin({ x:null, y:null });
    setSelSupplier(''); setSelResource(''); setQty('');
    setReserved([]);
    setShowMap(false);
  }, []);

  const editLocation = useCallback((loc) => {
    const id = normalizeId(loc);
    setShowEditor(true);
    setLocId(id);
    setNaziv(loc?.Naziv || '');
    setOpis(loc?.Opis || '');
    const areaId = String(loc?.Podrucje || loc?.PodrucjeId || '');
    setPodrucjeId(areaId);
    const t = String(loc?.TipLokacije || '');
    setTip(t);
    setHex(loc?.HEXboja || TIP_LOKACIJA[t]?.color || DEFAULT_COLOR);

    const lat = Array.isArray(loc?.Koordinate) ? loc.Koordinate[0] : (loc?.XKoordinata ?? null);
    const lng = Array.isArray(loc?.Koordinate) ? loc.Koordinate[1] : (loc?.YKoordinata ?? null);
    setPin({ x: Number.isFinite(lat) ? lat : null, y: Number.isFinite(lng) ? lng : null });

    const mapped = Array.isArray(loc?.Resursi)
    ? loc.Resursi.map(r => {
        const rid = normalizeId(r) || r?.ResursId || r?.resursId || null;
        const suppId = r?.DobavljacId ?? r?.dobavljacId ?? null;   // << NOVO
        return {
          id: rid,
          naziv: r?.Naziv || r?.naziv || '',
          tip: r?.Tip || r?.tip || '',
          velicina: r?.Velicina || r?.velicina || r?.Dimenzija || r?.dimenzija || r?.Kapacitet || r?.kapacitet || '', // << VELIČINA fallback
          opis: r?.Opis || r?.opis || '',
          kolicina: Number(r?.Kolicina ?? r?.kolicina ?? 0),
          dobavljacIme: r?.DobavljacIme || r?.dobavljacIme || supplierNameById(suppId), // << IME iz suppliers
          reserved: true,
        };
      })
    : [];
    setReserved(mapped);
    setSelSupplier(''); setSelResource(''); setQty('');
    setLock(true);
    setShowMap(false);
  }, []);

  const deleteLocation = useCallback(async (loc) => {
    const id = normalizeId(loc);
    if (!id) return;
    if (!window.confirm('Obrisati lokaciju?')) return;
    try{
      await locationsApi.remove(id);
      setLocations(prev => prev.filter(x => normalizeId(x) !== id));
      toast.success('Lokacija obrisana.');
    }catch{
      toast.error('Brisanje nije uspelo.');
    }
  }, []);

  const handleTipChange = (v) => {
    const vv = String(v || '');
    setTip(vv);
    if (!hex || !isHex(hex)){
      setHex(TIP_LOKACIJA[vv]?.color || DEFAULT_COLOR);
    }
  };

  const handlePickOnMap = () => {
    if (!podrucjeId){ toast.error('Izaberi područje pre mape.'); return; }
    setShowMap(v => !v);
  };

  const addResource = async () => {
  if (!selSupplier){ toast.error('Izaberi dobavljača.'); return; }
  if (!selResource){ toast.error('Izaberi resurs.'); return; }
  const q = Number(qty);
  if (!Number.isFinite(q) || q <= 0){ toast.error('Unesi količinu.'); return; }

  const res = resources.find(r => String(normalizeId(r)) === String(selResource));
  if (!res){ toast.error('Nepoznat resurs.'); return; }

  const vel = res?.Velicina || res?.velicina || res?.Dimenzija || res?.dimenzija || res?.Kapacitet || res?.kapacitet || ''; // << VELIČINA
  const suppName = supplierNameById(selSupplier); // << IME DOBAVLJAČA

  // lokalni upis
  setReserved(prev => {
    const idx = prev.findIndex(x => String(x.id) === String(selResource));
    if (idx >= 0){
      const copy = prev.slice();
      copy[idx] = {
        ...copy[idx],
        kolicina: (copy[idx].kolicina || 0) + q,
        dobavljacIme: copy[idx].dobavljacIme || suppName, // << upiši ime
        velicina: copy[idx].velicina || vel,               // << upiši veličinu ako fali
      };
      return copy;
    }
    return [...prev, {
      id: normalizeId(res),
      naziv: res?.Naziv || res?.naziv || 'Resurs',
      tip: res?.Tip || res?.tip || '',
      velicina: vel,
      opis: res?.Opis || res?.opis || '',
      kolicina: q,
      dobavljacIme: suppName,
      reserved: false,
    }];
  });
  setQty('');

  // rezervacija odmah ako lokacija postoji
  if (locId){
    try{
      await reserveResource({ LokacijaId: locId, ResursId: selResource, Kolicina: q });
      setReserved(list => list.map(x => String(x.id) === String(selResource) ? { ...x, reserved:true } : x));
      toast.success(`Rezervisano: ${(res?.Naziv || 'Resurs')} × ${q}`);
    }catch{
      // rollback
      setReserved(list => {
        const idx = list.findIndex(x => String(x.id) === String(selResource));
        if (idx === -1) return list;
        const copy = list.slice();
        const it = copy[idx];
        const newQty = (it.kolicina || 0) - q;
        if (newQty <= 0) copy.splice(idx, 1);
        else copy[idx] = { ...it, kolicina: newQty };
        return copy;
      });
      toast.error('Rezervacija nije uspela.');
    }
  }
};


  const removeReservedHandler = async (r) => {
    if (r?.reserved && locId){
      try{
        await cancelReservation({ LokacijaId: locId, ResursId: r.id });
        toast.success('Rezervacija otkazana.');
        setReserved(prev => prev.filter(x => String(x.id) !== String(r.id)));
      }catch{
        toast.error('Otkazivanje nije uspelo.');
      }
    } else {
      setReserved(prev => prev.filter(x => String(x.id) !== String(r.id)));
    }
  };

  async function saveLocation(){
    if (lock){
      setLock(false);
      return;
    }

    if (!naziv.trim()){ toast.error('Unesi naziv.'); return; }
    if (!podrucjeId){ toast.error('Izaberi područje.'); return; }
    if (!tip){ toast.error('Izaberi tip.'); return; }
    if (!isHex(hex)){ toast.error('HEX boja nije validna.'); return; }
    if (pin.x == null || pin.y == null){ toast.error('Postavi pin na mapi.'); return; }

    const base = {
      DogadjajId: eventId,
      Naziv: naziv.trim(),
      Opis: (opis || '').trim(),
      XKoordinata: pin.x,
      YKoordinata: pin.y,
      URLSlikeMape: '',
      CenovnikId: null,
      PodrucjeId: podrucjeId,
      HEXboja: hex,
      TipLokacije: String(tip),
      Resursi: reserved.map(r => r.id).filter(Boolean),
    };

    try{
      setLoading(true);
      if (!locId){
        const created = await locationsApi.create(base);
        const newId = normalizeId(created);
        const ls = await locationsApi.listByEvent(eventId).catch(() => []);
        setLocations(Array.isArray(ls) ? ls : []);
        toast.success('Lokacija kreirana.');
        setLocId(newId || null);
        setLock(true);
      }else{
        await locationsApi.update(locId, base);
        const ls = await locationsApi.listByEvent(eventId).catch(() => []);
        setLocations(Array.isArray(ls) ? ls : []);
        toast.success('Izmene sačuvane.');
        setLock(true);
      }
    }catch{
      toast.error('Greška pri čuvanju lokacije.');
    }finally{
      setLoading(false);
    }
  }

  return (
    <div className="ar-wrap">
      <div className="ar-head">
        <div className="ar-title">Lokacije</div>
        <div className="ar-spacer" />
        <button className="ar-btn" disabled={!eventId || loading} onClick={newLocation}>+ Nova lokacija</button>
      </div>

      <div className="ar-list" style={{ marginTop: 16 }}>
        {(locations || []).map((loc) => {
          const id = normalizeId(loc);
          const areaName = (() => {
            const aid = String(loc?.PodrucjeId ?? loc?.Podrucje ?? '');
            const aObj = areas.find(a => String(normalizeId(a)) === aid);
            return aObj?.Naziv || aObj?.naziv || '-';
          })();
          return (
            <div key={id} className="ar-card">
              <div className="ar-card-head">
                <div className="ar-card-title">{loc?.Naziv || 'Lokacija'}</div>
                <div className="ar-actions">
                  <button className="ar-btn" onClick={() => editLocation(loc)}>Izmeni</button>
                  <button className="ar-btn" onClick={() => deleteLocation(loc)}>Obriši</button>
                </div>
              </div>
              <div className="ar-grid">
                <div>
                  <div className="label">Tip</div>
                  <div>{String(loc?.TipLokacije || '-')}</div>
                </div>
                <div>
                  <div className="label">Područje</div>
                  <div>{areaName}</div>
                </div>
                <div>
                  <div className="label">Koordinate</div>
                  <div>
                    {Number.isFinite(loc?.XKoordinata) && Number.isFinite(loc?.YKoordinata)
                      ? `${loc.XKoordinata}, ${loc.YKoordinata}`
                      : (Array.isArray(loc?.Koordinate) && Number.isFinite(loc.Koordinate[0]) && Number.isFinite(loc.Koordinate[1])
                          ? `${loc.Koordinate[0]}, ${loc.Koordinate[1]}`
                          : '-')}
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {showEditor && (
        <div className={`ar-card ${lock ? 'locked' : ''}`} style={{ marginTop: 18 }}>
          <div className="ar-card-head">
            <div className="ar-card-title">{locId ? 'Izmena lokacije' : 'Nova lokacija'}</div>
            <div className="ar-actions">
              <button className="ar-btn" onClick={saveLocation} disabled={loading}>
                {locId ? (lock ? 'Izmeni' : 'Sačuvaj izmene') : 'Sačuvaj'}
              </button>
            </div>
          </div>

          <div className="ar-grid">
            <div>
              <div className="label">Naziv</div>
              <input className="input" value={naziv} onChange={e=>setNaziv(e.target.value)} disabled={lock}/>
            </div>
            <div>
              <div className="label">Opis</div>
              <input className="input" value={opis} onChange={e=>setOpis(e.target.value)} disabled={lock}/>
            </div>
            <div>
              <div className="label">Područje</div>
              <select className="select" value={podrucjeId} onChange={e=>setPodrucjeId(e.target.value)} disabled={lock}>
                <option value="">-- izaberi --</option>
                {areas.map(a => {
                  const id = String(normalizeId(a));
                  const name = a?.Naziv || a?.naziv || 'Područje';
                  return <option key={id} value={id}>{name}</option>;
                })}
              </select>
            </div>
            <div>
              <div className="label">Tip</div>
              <select className="select" value={tip} onChange={e=>handleTipChange(e.target.value)} disabled={lock}>
                <option value="">-- izaberi --</option>
                {Object.keys(TIP_LOKACIJA).map(k => (<option key={k} value={k}>{TIP_LOKACIJA[k].label}</option>))}
              </select>
            </div>
            <div>
              <div className="label">HEX boja</div>
              <div className="color-row">
                <div className="color-swatch" style={{ background: hex }} />
                <input className="input" value={hex} onChange={e=>setHex(e.target.value)} disabled={lock}/>
                <input type="color" className="input" value={hex} onChange={e=>setHex(e.target.value)} disabled={lock}/>
              </div>
            </div>
            <div>
              <div className="label">Pozicioniranje</div>
              <button className="ar-btn" onClick={handlePickOnMap} disabled={lock}>
                {showMap ? 'Sakrij mapu' : 'Obeleži na mapi'}
              </button>
              {(Number.isFinite(pin.x) && Number.isFinite(pin.y)) && (
                <div className="ar-note" style={{ marginTop: 8 }}>Pin postavljen (čuva se na snimanje)</div>
              )}
            </div>
          </div>

          {showMap && currentArea && (
            <PinPicker
              area={currentArea}
              color={hex}
              name={naziv}
              pin={(Number.isFinite(pin.x) && Number.isFinite(pin.y)) ? [pin.x, pin.y] : null}
              onChangePin={(pos) => setPin({ x: pos[0], y: pos[1] })}
              onClose={() => setShowMap(false)}
            />
          )}

          {/* Raspored: 70% tabela / 30% forma */}
          <div className="loc-res-wrap">
            <div className="loc-res-table">
              <div className="label">Rezervisani resursi</div>
              <table className="loc-table">
                <thead>
                  <tr>
                    <th>Naziv</th>
                    <th>Tip</th>
                    <th className="num">Količina</th>
                    <th>Veličina</th>
                    <th>Opis</th>
                    <th>Dobavljač</th>
                    <th>Akcije</th>
                  </tr>
                </thead>
                <tbody>
                  {reserved.map((r, i) => (
                    <tr key={r.id || i}>
                      <td>{r.naziv}</td>
                      <td>{r.tip}</td>
                      <td className="num">{r.kolicina}</td>
                      <td>{r.velicina || '-'}</td>
                      <td><button className="ar-btn ar-btn-ghost" onClick={() => openDesc(r)}>Opis</button></td>
                      <td>{r.dobavljacIme}</td>
                      <td>
                        <button className="ar-btn" onClick={() => removeReservedHandler(r)}>Ukloni</button>
                      </td>
                    </tr>
                  ))}
                  {(!reserved || reserved.length===0) && (
                    <tr><td colSpan={7} className="muted center">Nema dodatih resursa</td></tr>
                  )}
                </tbody>
              </table>
            </div>

            <div className="loc-res-form">
              <div className="label">Dobavljač</div>
              <select className="select" value={selSupplier} onChange={e=>setSelSupplier(e.target.value)} disabled={lock}>
                <option value="">-- izaberi --</option>
                {suppliers.map(s => {
                  const id = String(normalizeId(s));
                  const name = s?.Naziv || s?.naziv || 'Dobavljač';
                  return <option key={id} value={id}>{name}</option>;
                })}
              </select>

              <div className="label" style={{ marginTop: 8 }}>Resurs</div>
              <select className="select" value={selResource} onChange={e=>setSelResource(e.target.value)} disabled={lock}>
                <option value="">-- izaberi --</option>
                {resources.map(r => {
                  const id = String(normalizeId(r));
                  const name = r?.Naziv || r?.naziv || 'Resurs';
                  const tip = r?.Tip || r?.tip || '';
                  return <option key={id} value={id}>{name} · {tip}</option>;
                })}
              </select>

              <div className="label" style={{ marginTop: 8 }}>Količina</div>
              <input className="input" type="number" value={qty} onChange={e=>setQty(e.target.value)} disabled={lock} />

              <div style={{ marginTop: 10 }}>
                <button className="ar-btn" onClick={addResource} disabled={lock}>Dodaj resurs</button>
              </div>
            </div>
          </div>

          {descModal.open && (
            <div className="modal-backdrop" onClick={closeDesc}>
              <div className="modal" onClick={(e)=>e.stopPropagation()}>
                <div className="modal-head">
                  <div className="modal-title">{descModal.title}</div>
                  <button className="ar-btn ar-btn-ghost" onClick={closeDesc}>Zatvori</button>
                </div>
                <div className="modal-body">
                  {descModal.text}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
