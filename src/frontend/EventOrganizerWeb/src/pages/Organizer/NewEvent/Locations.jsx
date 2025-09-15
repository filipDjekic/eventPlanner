// src/pages/Organizer/NewEvent/Locations.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import toast from 'react-hot-toast';
import '../../../styles/NewEvent/areas.css';
import '../../../styles/NewEvent/locations.css';
import * as areasApi from '../../../services/areasApi';
import * as locationsApi from '../../../services/locationsApi';
import 'leaflet/dist/leaflet.css';
import { MapContainer, TileLayer, Polygon, Marker, useMapEvents } from 'react-leaflet';
import L from 'leaflet';

/** Mapiranje tipova lokacija na HEX boje (možeš slobodno menjati) */
const TIP_LOKACIJA = {
  'Bina': '#e11d48',
  'Ulaz': '#10b981',
  'Izlaz': '#0ea5e9',
  'Stand': '#f59e0b',
  'Gift shop': '#a78bfa',
  'Info pult': '#22c55e',
  'Toalet': '#60a5fa',
  'Hrana i piće': '#f97316',
  'Radionica': '#84cc16',
  'Parking': '#94a3b8'
};

const DEFAULT_COLOR = '#8888ff';

function ymd(d){ return new Date(d).toISOString().slice(0,10); }
function isHex(v){ return /^#([0-9a-f]{3}|[0-9a-f]{6})$/i.test(v||''); }

/** Ray-cast point-in-polygon za [lat,lng] */
function pointInPolygon(point, polygon){
  if (!Array.isArray(polygon) || polygon.length < 3) return false;
  const [x, y] = point; // x=lat, y=lng
  let inside = false;
  for (let i=0, j=polygon.length-1; i<polygon.length; j=i++){
    const xi = polygon[i][0], yi = polygon[i][1];
    const xj = polygon[j][0], yj = polygon[j][1];
    const intersect = ((yi>y) !== (yj>y)) && (x < (xj - xi) * (y - yi) / ((yj - yi) || 1e-9) + xi);
    if (intersect) inside = !inside;
  }
  return inside;
}

export default function Locations({ eventId }){
  const [loading, setLoading] = useState(false);
  const [areas, setAreas] = useState([]);              // [{Id, Naziv, Koordinate:[[lat,lng]..], Lokacije:[id,..]}]
  const [locations, setLocations] = useState([]);      // [{Id, Naziv, ...}]
  const [showEditor, setShowEditor] = useState(false);

  // editor state
  const [locId, setLocId] = useState(null);            // ako je null => create; inače update
  const [naziv, setNaziv] = useState('');
  const [opis, setOpis] = useState('');
  const [podrucjeId, setPodrucjeId] = useState('');
  const [tip, setTip] = useState('');
  const [hex, setHex] = useState(DEFAULT_COLOR);
  const [pin, setPin] = useState({ x:null, y:null });  // x=lat, y=lng
  const [lock, setLock] = useState(false);             // zaključavanje forme posle "Sačuvaj"

  // resursi
  const [suppliers, setSuppliers] = useState([]);
  const [selSupplier, setSelSupplier] = useState('');
  const [typesForSupplier, setTypesForSupplier] = useState([]); // string[]
  const [selType, setSelType] = useState('');
  const [resources, setResources] = useState([]);      // resursi izabranog dobavljača+tipa
  const [selResource, setSelResource] = useState('');
  const [qty, setQty] = useState('');
  const [reserved, setReserved] = useState([]);        // [{id, naziv, tip, kolicina, dobavljacIme}]

  // map modal
  const [showMap, setShowMap] = useState(false);

  const getAreaId = (a) => String(a?.Id ?? a?._id ?? a?.id ?? '');

  const selectedArea = useMemo(
    () => areas.find(a => getAreaId(a) === String(podrucjeId || '')),
    [areas, podrucjeId]
  );

  // --- LOADERS ---
  async function loadAreas(){
    try{
      let list = await areasApi.listAll();
      // filtriraj po eventId ako polje postoji
      if (Array.isArray(list)) list = list.filter(x => (x?.DogadjajId ?? x?.dogadjajId) === eventId);
      setAreas(list || []);
    }catch(err){ console.error(err); }
  }
  async function loadLocations(){
    try{
      let list = await locationsApi.listForEvent(eventId);
      setLocations(Array.isArray(list) ? list : []);
    }catch(err){ console.error(err); }
  }
  async function loadSuppliers(){
    try{
      const s = await locationsApi.listSuppliers();
      setSuppliers(Array.isArray(s) ? s : []);
    }catch(err){ console.error(err); }
  }

  useEffect(() => {
    if (!eventId) return;
    loadAreas();
    loadLocations();
    loadSuppliers();
  }, [eventId]);

  // React to AREAS updates (create/update/delete)
  useEffect(() => {
    function onAreasUpdated(e){
      const targetId = e?.detail?.eventId;
      if (targetId && targetId !== eventId) return;
      loadAreas();
      // Ako editor prikazuje mapu, osveži i poligon
    }
    window.addEventListener('ne:areas:updated', onAreasUpdated);
    return () => window.removeEventListener('ne:areas:updated', onAreasUpdated);
  }, [eventId]);

  // React to LOCATIONS updates (from elsewhere)
  useEffect(() => {
    function onLocationsUpdated(e){
      const targetId = e?.detail?.eventId;
      if (targetId && targetId !== eventId) return;
      loadLocations();
    }
    window.addEventListener('ne:locations:updated', onLocationsUpdated);
    return () => window.removeEventListener('ne:locations:updated', onLocationsUpdated);
  }, [eventId]);

  // Helpers
  function makePinIcon(name, color){
    const safeName = (name || 'Lokacija').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const c = color || '#8888ff';
    return L.divIcon({
      className: 'pin-divicon',
      html: `
        <div class="pin-wrap">
          <div class="pin-label" style="background:${c}">${safeName}</div>
          <div class="pin-tail" style="border-top-color:${c}"></div>
        </div>
      `,
      iconSize: [1, 1],
      iconAnchor: [10, 24] // približno dno "repa" na koordinati
    });
  }

  function pointInPolygonLatLng([lat, lng], poly){
    // poly: [[lat,lng], ...]
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
  function makePinIcon(name, color){
    const safeName = (name || 'Lokacija').replace(/</g,'&lt;').replace(/>/g,'&gt;');
    const c = color || '#8888ff';
    return L.divIcon({
      className: 'pin-divicon',
      html: `
        <div class="pin-wrap">
          <div class="pin-label" style="background:${c}">${safeName}</div>
          <div class="pin-tail" style="border-top-color:${c}"></div>
        </div>
      `,
      iconSize: [1, 1],
      iconAnchor: [10, 24] // približno dno "repa" na koordinati
    });
  }

  function PinPickerLeaflet({ area, color, name, pin, onChangePin, onClose, onSave }){
    const positions = Array.isArray(area?.Koordinate) ? area.Koordinate : [];
    const center = positions[0] || [44.8125, 20.4612];

    function ClickCatcher(){
      useMapEvents({
        click(e){
          const { lat, lng } = e.latlng || {};
          if (!Number.isFinite(lat) || !Number.isFinite(lng)) return;
          if (!pointInPolygonLatLng([lat, lng], positions)) return;
          onChangePin?.({ x: lat, y: lng });
        }
      });
      return null;
    }

    return (
      <div className="map-wrap">
        <div className="map-toolbar">
          <button className="ar-btn" onClick={()=> onSave?.()}>Sačuvaj pin</button>
          <button className="ar-btn" onClick={()=> onClose?.()}>Zatvori</button>
          <div className="ar-spacer" />
          <span className="label">Klikni unutar izabranog područja da postaviš pin</span>
        </div>

        <div className="map-canvas">
          <MapContainer center={center} zoom={15} style={{ width:'100%', height:'100%', borderRadius:10 }}>
            <TileLayer url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
                      attribution="&copy; OpenStreetMap contributors" />

            {positions.length >= 3 && (
              <Polygon
                pathOptions={{ color:'#777', fillColor: color || '#3b82f6', fillOpacity:0.30, opacity:1 }}
                positions={positions}
                interactive={false}
              />
            )}

            {(pin?.x!=null && pin?.y!=null) && (
              <Marker position={[pin.x, pin.y]} icon={makePinIcon(name, color)} />
            )}

            <ClickCatcher />
          </MapContainer>
        </div>
      </div>
    );
  }


  function pointInPolygonLatLng([lat, lng], poly){
    // poly: [[lat,lng], ...]
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



  function resetEditor(){
    setLocId(null);
    setNaziv('');
    setOpis('');
    setPodrucjeId('');
    setTip('');
    setHex(DEFAULT_COLOR);
    setPin({x:null,y:null});
    setSelSupplier('');
    setTypesForSupplier([]);
    setSelType('');
    setResources([]);
    setSelResource('');
    setQty('');
    setReserved([]);
    setLock(false);
    setShowMap(false);
  }

  function beginCreate(){ resetEditor(); setShowEditor(true); }
  function beginEdit(loc){
    setPodrucjeId(String(loc?.Podrucje || loc?.PodrucjeId || ''));
    resetEditor();
    setShowEditor(true);
    setLocId(loc?.Id || loc?._id || loc?.id);
    setNaziv(loc?.Naziv || '');
    setOpis(loc?.Opis || '');
    setPodrucjeId(loc?.Podrucje || loc?.PodrucjeId || '');
    setTip(loc?.TipLokacije || '');
    setHex(isHex(loc?.HEXboja) ? loc.HEXboja : (TIP_LOKACIJA[loc?.TipLokacije] || DEFAULT_COLOR));
    setPin({ x: loc?.XKoordinata ?? null, y: loc?.YKoordinata ?? null });
    setReserved(Array.isArray(loc?.ResursiEx) ? loc.ResursiEx : []); // ako backend vraća proširene resurse
    setLock(true); // po zahtevu: nakon "Sačuvaj" dugme je "Izmeni", pa forma locked
  }

  // Supplier/Type/Resource chain
  useEffect(() => {
    async function computeTypes(){
      if (!selSupplier){ setTypesForSupplier([]); setSelType(''); setResources([]); setSelResource(''); return; }
      try{
        const resAll = await locationsApi.listResourcesForSupplier(selSupplier);
        const types = Array.from(new Set((resAll||[]).map(r => r?.Tip || r?.tip || r?.Type || r?.type).filter(Boolean)));
        setTypesForSupplier(types);
        setSelType('');
        setResources([]);
        setSelResource('');
      }catch(err){ console.error(err); }
    }
    computeTypes();
  }, [selSupplier]);

  useEffect(() => {
    async function filterResources(){
      if (!selSupplier || !selType){ setResources([]); setSelResource(''); return; }
      try{
        // filtriraj klijentski ili preko API-a (oba su podržana u locationsApi)
        const list = await locationsApi.listResourcesBySupplierAndType(selSupplier, selType);
        setResources(list || []);
        setSelResource('');
      }catch(err){ console.error(err); }
    }
    filterResources();
  }, [selSupplier, selType]);

  function availableQty(res){
    const total = Number(res?.Ukupno || res?.ukupno || res?.Kolicina || res?.kolicina || 0);
    const reserved = Number(res?.Rezervisano || res?.rezervisano || 0);
    const free = Math.max(0, total - reserved);
    return isFinite(free) ? free : 0;
  }

  async function addResource(){
    if (!selSupplier || !selType || !selResource){
      toast.error('Izaberi dobavljača, tip i resurs.');
      return;
    }
    const r = resources.find(x => (x?.Id||x?._id||x?.id) === selResource);
    if (!r){ toast.error('Nepoznat resurs.'); return; }
    const max = availableQty(r);
    const k = Number(qty);
    if (!k || k < 1){ toast.error('Unesi validnu količinu.'); return; }
    if (k > max){
      toast.error(`Nema dovoljno: max ${max}.`);
      return;
    }

    try{
      // pokušaj rezervaciju; ako backend nema endpoint, API će baciti grešku koju hvata-mo i prikažemo poruku
      await locationsApi.reserveResource(selResource, k, { eventId, locationId: locId || '(pending)' });
      toast.success('Resurs rezervisan.');
    }catch(err){
      console.warn('reserveResource fallback:', err?.message || err);
      // fallback: dozvoli dodavanje i bez hard lock-a na serveru
      toast('Dodato u lokaciju (rezervacija će biti potvrđena pri snimanju).');
    }

    setReserved(prev => ([
      ...prev,
      {
        id: (r?.Id||r?._id||r?.id),
        naziv: r?.Naziv || r?.naziv || 'Resurs',
        tip: r?.Tip || r?.tip || selType,
        kolicina: k,
        dobavljacIme: (suppliers.find(s=> (s?.Id||s?._id||s?.id)===selSupplier)?.ImePrezime) || 'Dobavljač'
      }
    ]));
    // reset selekcije
    setSelSupplier('');
    setTypesForSupplier([]);
    setSelType('');
    setResources([]);
    setSelResource('');
    setQty('');
  }

  async function saveLocation(){
    if (lock){
      // trenutno je "Izmeni" mod -> otključaj i pređi u "Sačuvaj izmene"
      setLock(false);
      return;
    }

    if (!naziv.trim()){ toast.error('Unesi naziv.'); return; }
    if (!podrucjeId){ toast.error('Izaberi područje.'); return; }
    if (!tip){ toast.error('Izaberi tip.'); return; }
    if (!isHex(hex)){ toast.error('HEX boja nije validna.'); return; }
    if (pin.x == null || pin.y == null){ toast.error('Postavi pin na mapi.'); return; }

    const resursIds = reserved.map(r => r.id).filter(Boolean);

    const dto = {
      DogadjajId: eventId,
      Naziv: naziv,
      Opis: opis || '',
      XKoordinata: pin.x,
      YKoordinata: pin.y,
      URLSlikeMape: '',
      CenovnikId: '', // po potrebi
      PodrucjeId: podrucjeId,
      HEXboja: hex,
      TipLokacije: tip,          // STRING, ne enum
      Resursi: resursIds
    };

    try{
      setLoading(true);
      if (!locId){
        const created = await locationsApi.create(dto); // vrati objekat
        const newId = created?.Id || created?._id || created?.id || created;
        setLocId(newId || null);

        // ubaci u Područje
        await locationsApi.attachToArea(podrucjeId, newId);

        // refresh liste
        await loadLocations();

        // emit global event da se drugi osveže
        window.dispatchEvent(new CustomEvent('ne:locations:updated', {
          detail: { eventId, locationId: newId, action: 'create' }
        }));

        toast.success('Lokacija kreirana.');
        setLock(true); // posle snimanja – zaključaj i prikaži "Izmeni"
      }else{
        await locationsApi.update(locId, { ...dto, Id: locId });
        await loadLocations();

        window.dispatchEvent(new CustomEvent('ne:locations:updated', {
          detail: { eventId, locationId: locId, action: 'update' }
        }));

        toast.success('Izmene sačuvane.');
        setLock(true); // posle snimanja izmene – ponovo zaključaj
      }
    }catch(err){
      console.error(err);
      toast.error('Greška pri čuvanju lokacije.');
    }finally{
      setLoading(false);
    }
  }

  async function deleteLocation(loc){
    const id = loc?.Id || loc?._id || loc?.id;
    if (!id) return;

    try{
      setLoading(true);
      await locationsApi.remove(id);

      // skini je iz njenog područja
      const areaId = (loc?.Podrucje || loc?.PodrucjeId || podrucjeId);
      if (areaId) await locationsApi.detachFromArea(areaId, id);

      await loadLocations();

      window.dispatchEvent(new CustomEvent('ne:locations:updated', {
        detail: { eventId, locationId: id, action: 'delete' }
      }));

      toast.success('Lokacija obrisana.');
      if (id === locId) resetEditor();
    }catch(err){
      console.error(err);
      toast.error('Greška pri brisanju lokacije.');
    }finally{
      setLoading(false);
    }
  }

  function handleTipChange(val){
    setTip(val);
    if (!lock){
      const color = TIP_LOKACIJA[val] || DEFAULT_COLOR;
      setHex(color);
    }
  }

  // --- MAPA (jedan pin unutar izabranog područja) ---
  const mapRef = useRef(null);
  function onMapClick(e){
    if (!selectedArea){
      toast.error('Prvo izaberi područje.');
      return;
    }
    const rect = mapRef.current?.getBoundingClientRect();
    if (!rect) return;

    // simulacija geo sistema (pretpostavimo da radimo sa lat/lng iz poligona već u odnosu na viewport)
    // U praksi bi ovde koristio leaflet; radi jednostavno: klik je srednji "lat/lng" unutar SVG viewBoxa.
    // Da ostanemo konzistentni sa poligonom (koji je već u lat/lng), dozvolićemo pin isključivo po hit-testu poligona.
    // Ovde ćemo pročitati "data-lat" i "data-lng" iz targeta ako postoji (npr. klik na poligon), ili fallback na centroid.

    // Pošto radimo bez pravog GIS skaliranja, napravićemo trik: klik na poligon postavlja centroid poligona,
    // a klik bilo gde drugde odbijamo (da zadržimo pravilo "samo unutar područja").
    const poly = selectedArea?.Koordinate || [];
    if (!Array.isArray(poly) || poly.length < 3){
      toast.error('Poligon područja nije validan.');
      return;
    }

    // centroid
    const cx = poly.reduce((s,p)=>s+p[0],0)/poly.length;
    const cy = poly.reduce((s,p)=>s+p[1],0)/poly.length;

    // Ako baš želiš tačan klik, morao bi pravi projekcioni sistem; za sada: dozvoli centroid.
    if (!pointInPolygon([cx, cy], poly)){
      toast.error('Pin mora biti unutar izabranog područja.');
      return;
    }
    setPin({ x: cx, y: cy });
  }

  function savePin(){
    if (pin.x == null || pin.y == null){
      toast.error('Postavi pin pre čuvanja.');
      return;
    }
    toast.success('Pin sačuvan.');
    setShowMap(false);
  }

  // --- RENDER ---
  return (
    <div className="ar-wrap">
      <div className="ar-head">
        <div className="ar-title">Lokacije</div>
        <div className="ar-spacer" />
        <button className="ar-btn" disabled={!eventId || loading} onClick={beginCreate}>
          Dodaj lokaciju
        </button>
      </div>

      {/* Lista lokacija */}
      <div className="ar-list" style={{ marginTop: 16 }}>
        {(locations||[]).map((loc) => (
          <div key={loc?.Id || loc?._id} className={`ar-card ${lock ? 'locked' : ''}`}>
            <div className="ar-card-head">
              <div className="ar-card-title">{loc?.Naziv || 'Lokacija'}</div>
              <div className="ar-actions">
                <button className="ar-btn" onClick={()=>beginEdit(loc)}>Otvori</button>
                <button className="ar-btn" onClick={()=>deleteLocation(loc)}>Obriši</button>
              </div>
            </div>
            <div className="ar-grid">
              <div>
                <div className="label">Tip</div>
                <div>{loc?.TipLokacije || '-'}</div>
              </div>
              <div>
                <div className="label">Područje</div>
                <div>{loc?.PodrucjeNaziv || loc?.Podrucje || '-'}</div>
              </div>
              <div>
                <div className="label">Koordinate</div>
                <div>{(loc?.XKoordinata!=null && loc?.YKoordinata!=null) ? `${loc.XKoordinata.toFixed?.(6)||loc.XKoordinata}, ${loc.YKoordinata.toFixed?.(6)||loc.YKoordinata}` : '-'}</div>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Editor */}
      {showEditor && (
        <div className={`ar-card ${lock ? 'locked' : ''}`} style={{ marginTop: 18 }}>
          <div className="ar-card-head">
            <div className="ar-card-title">{locId ? 'Izmena lokacije' : 'Nova lokacija'}</div>
            <div className="ar-actions">
              {locId && (
                <button
                  className="ar-btn"
                  onClick={()=> setLock(l => !l)}
                  disabled={loading}
                  title={lock ? 'Omogući izmene' : 'Zaključaćemo nakon čuvanja'}
                >
                  {lock ? 'Izmeni' : 'Sačuvaj izmene'}
                </button>
              )}
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
                  {(areas||[]).map(a => (
                    <option key={getAreaId(a)} value={getAreaId(a)}>
                      {a?.Naziv || 'Područje'}
                    </option>
                  ))}
                </select>
            </div>

            <div>
              <div className="label">Tip</div>
              <select className="select" value={tip} onChange={e=>handleTipChange(e.target.value)} disabled={lock}>
                <option value="">-- izaberi --</option>
                {Object.keys(TIP_LOKACIJA).map(k => (<option key={k} value={k}>{k}</option>))}
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
              <div className="map-toggle">
                <button className="ar-btn" onClick={()=>setShowMap(true)} disabled={!podrucjeId}>
                  Obeleži na mapi
                </button>
              </div>
              {(pin.x!=null && pin.y!=null) && (
                <div className="ar-note" style={{ marginTop:8 }}>
                  Sačuvani pin: {pin.x}, {pin.y}
                </div>
              )}
            </div>
          </div>

          {/* MAP SUBFORM (Leaflet pin picker) */}
          {showMap && (
            selectedArea ? (
              <PinPickerLeaflet
                area={selectedArea}
                color={hex}
                name={naziv || 'Lokacija'}
                pin={pin}
                onChangePin={(p)=> setPin(p)}
                onSave={()=>{
                  if (pin.x == null || pin.y == null) { toast.error('Postavi pin pre čuvanja.'); return; }
                  toast.success('Pin sačuvan.');
                  setShowMap(false);
                }}
                onClose={()=> setShowMap(false)}
              />
            ) : (
              <div className="map-wrap">
                <div className="map-toolbar">
                  <div className="ar-spacer" />
                  <span className="label">Izaberi područje da bi postavio pin.</span>
                </div>
                <div className="map-canvas" />
              </div>
            )
          )}



          {/* RESURSI: tabela (70%) + unos (30%) */}
          <div className="loc-res-wrap">
            <div className="loc-res-table">
              <div className="label">Resursi za lokaciju</div>
              <table className="loc-table">
                <thead>
                  <tr>
                    <th>Naziv</th>
                    <th>Tip</th>
                    <th>Rezervisano</th>
                    <th>Dobavljač</th>
                  </tr>
                </thead>
                <tbody>
                  {(reserved||[]).map((r,idx)=>(
                    <tr key={idx}>
                      <td>{r.naziv}</td>
                      <td>{r.tip}</td>
                      <td>{r.kolicina}</td>
                      <td>{r.dobavljacIme}</td>
                    </tr>
                  ))}
                  {(!reserved || reserved.length===0) && (
                    <tr><td colSpan={4} style={{ textAlign:'center', color:'#888' }}>Nema dodatih resursa</td></tr>
                  )}
                </tbody>
              </table>
            </div>
            <div className="loc-res-form">
              <div className="label">Dobavljač</div>
              <select className="select" value={selSupplier} onChange={e=>setSelSupplier(e.target.value)} disabled={lock}>
                <option value="">-- izaberi --</option>
                {(suppliers||[]).map(s=>(
                  <option key={s?.Id||s?._id} value={s?.Id||s?._id}>{s?.ImePrezime || s?.Naziv || 'Dobavljač'}</option>
                ))}
              </select>

              <div className="label" style={{ marginTop:10 }}>Tip resursa</div>
              <select className="select" value={selType} onChange={e=>setSelType(e.target.value)} disabled={lock || !selSupplier}>
                <option value="">-- izaberi --</option>
                {(typesForSupplier||[]).map(t=>(
                  <option key={t} value={t}>{t}</option>
                ))}
              </select>

              <div className="label" style={{ marginTop:10 }}>Resurs</div>
              <select className="select" value={selResource} onChange={e=>setSelResource(e.target.value)} disabled={lock || !selSupplier || !selType}>
                <option value="">-- izaberi --</option>
                {(resources||[]).map(r=>{
                  const free = availableQty(r);
                  const name = r?.Naziv || r?.naziv || 'Resurs';
                  const id = r?.Id||r?._id||r?.id;
                  return <option key={id} value={id}>{`${name} (${free})`}</option>;
                })}
              </select>

              <div className="label" style={{ marginTop:10 }}>Količina</div>
              <input className="input" value={qty} onChange={e=>setQty(e.target.value)} disabled={lock || !selResource} />

              <div style={{ marginTop:10 }}>
                <button className="ar-btn" onClick={addResource} disabled={lock}>Dodaj resurs</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
