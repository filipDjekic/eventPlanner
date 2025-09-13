// src/pages/Organizer/Events.jsx
import React, { useEffect, useMemo, useState } from 'react';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import { getAuth } from '../../utils/auth';
import toast from 'react-hot-toast';

function fmtDate(d) {
  try {
    const dt = new Date(d);
    if (Number.isNaN(dt.getTime())) return '';
    const y = dt.getFullYear();
    const m = String(dt.getMonth()+1).padStart(2,'0');
    const da = String(dt.getDate()).padStart(2,'0');
    const hh = String(dt.getHours()).padStart(2,'0');
    const mm = String(dt.getMinutes()).padStart(2,'0');
    return `${y}-${m}-${da} ${hh}:${mm}`;
  } catch { return ''; }
}
// case/diacritics-insensitive compare
function norm(s){ return String(s||'').normalize('NFD').replace(/\p{Diacritic}/gu,'').toLowerCase().trim(); }
function extractEnumNames(resp){
  // Supports: { values:[{name,value}...] } or direct array of strings
  const v = resp?.Values ?? resp?.values ?? resp;
  if (Array.isArray(v)) return v.map(x => x?.Name ?? x?.name ?? String(x));
  return [];
}
const TAGS = ['Muzika','Sport','Tehnologija','Umetnost','Porodicni','Poslovni'];

function parseYMD(dateStr){
  // Accepts 'YYYY-MM-DD' -> Date at local 00:00
  if(!dateStr) return null;
  try{
    const [y,m,d] = String(dateStr).split('-').map(Number);
    if(!y||!m||!d) return null;
    return new Date(y, m-1, d);
  }catch{ return null; }
}

export default function Events(){
  const { id: userId } = getAuth();
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  // UI filters
  const [q, setQ] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tagFilter, setTagFilter] = useState('');
  const [selectedTags, setSelectedTags] = useState([]);

  const LOCAL_TAGOVI = [
    "Muzika",
    "Sport",
    "Tehnologija",
    "Umetnost",
    "Porodicni",
    "Poslovni",
    "Utakmica",
    "Vasar"
  ];

  const [categoryFilter, setCategoryFilter] = useState('');// array of strings
  const [dateFrom, setDateFrom] = useState(''); // YYYY-MM-DD
  const [dateTo, setDateTo] = useState('');   // YYYY-MM-DD

  // Enum options from backend
  const [statusEnum, setStatusEnum] = useState([]);
  const [categoryEnum, setCategoryEnum] = useState([]);
  

  // load enums once
  useEffect(()=>{
    let alive = true;
    (async ()=>{
      try{
        const [stRes, tgRes] = await Promise.all([
          api.get('enums/TipStatus'),
          api.get('enums/TipTagova'),
        ]);
        const statusNames = extractEnumNames(stRes.data);
        const tagNames = extractEnumNames(tgRes.data);
        if (alive) {
          setStatusEnum(statusNames);
          setCategoryEnum(tagNames);
        }
      }catch(e){
        // fallback: leave empty, UI will fallback to detected values
        console.warn('[Events] enums load failed', e);
      }
    })();
    return ()=>{ alive = false; };
  }, []);

  useEffect(()=>{
    let alive = true;
    async function load() {
      setLoading(true);
      try {
        const res = await api.get('dogadjaj/vrati-sve');
        let list = Array.isArray(res.data) ? res.data : [];

        if (userId) {
          list = list.filter(x => {
            const org = x?.Organizator ?? x?.organizator ?? x?.OrganizatorId ?? x?.organizatorId ?? null;
            return org && String(org) === String(userId);
          });
        }

        const mapped = list.map(x => ({
          id: x?.Id ?? x?.id ?? null,
          Naziv: x?.Naziv ?? x?.naziv ?? '',
          Tip: x?.Kategorija ?? x?.Status ?? x?.tip ?? '',
          DatumPocetka: fmtDate(x?.DatumPocetka ?? x?.datumPocetka),
          DatumKraja: fmtDate(x?.DatumKraja ?? x?.datumKraja),
          Lokacija: x?.Lokacija ?? x?.lokacija ?? '',
          BrojPrijavljenih: Array.isArray(x?.Prijavljeni ?? x?.prijavljeni) ? (x?.Prijavljeni ?? x?.prijavljeni).length : 0,
          _raw: x,
        }));

        if (alive){
          setRows(mapped);
          setError(null);
        }
      } catch (e) {
        if (alive){
          console.error('[Events] load error:', e);
          setError('Greška pri učitavanju događaja');
        }
      } finally {
        alive && setLoading(false);
      }
    }
    load();
    return () => { alive = false; };
  }, [userId]);

  // derive options from data (fallbacks)
  const statusDetected = useMemo(()=> {
    const set = new Set(rows.map(r => String(r?._raw?.Status ?? r?._raw?.status ?? '')).filter(Boolean));
    return Array.from(set);
  }, [rows]);

  const categoryDetected = useMemo(()=> {
    const set = new Set();
    for (const r of rows) {
      const cat = String(r?._raw?.Kategorija ?? r?._raw?.kategorija ?? '').trim();
      if (cat) set.add(cat);
      const tags = Array.isArray(r?._raw?.Tagovi) ? r._raw.Tagovi : [];
      for (const t of tags) if (t) set.add(String(t));
    }
    return Array.from(set);
  }, [rows]);

  const statusOptions = statusEnum.length ? statusEnum : statusDetected;
  const categoryOptions = categoryEnum.length ? categoryEnum : categoryDetected;
  const tagsDetected = useMemo(()=> {
    const all = rows.flatMap(r => Array.isArray(r?._raw?.Tagovi) ? r._raw.Tagovi : []);
    const set = new Set(all.map(String).filter(Boolean));
    return Array.from(set);
  }, [rows]);  const filtered = useMemo(()=>{
    const qq = norm(q);
    const from = parseYMD(dateFrom);
    const to = parseYMD(dateTo);
    return rows.filter(r => {
      const raw = r?._raw ?? {};
      const byQ = !qq || norm(r.Naziv).includes(qq);
      const byS = !statusFilter || String(raw?.Status ?? '').toLowerCase() === String(statusFilter).toLowerCase();
      const eventTags = Array.isArray(raw?.Tagovi) ? raw.Tagovi.map(v=>String(v).toLowerCase()) : [];
      const byTag = !tagFilter || eventTags.includes(String(tagFilter).toLowerCase());
      const catVal = String(raw?.Kategorija ?? '').toLowerCase();
      const tagArr = Array.isArray(raw?.Tagovi) ? raw.Tagovi.map(v=>String(v).toLowerCase()) : [];
      const byC = !categoryFilter || catVal === String(categoryFilter).toLowerCase() || tagArr.includes(String(categoryFilter).toLowerCase());
      let byD = true;
      if (from || to) {
        const startRaw = raw?.DatumPocetka ?? raw?.datumPocetka;
        const start = startRaw ? new Date(startRaw) : null;
        if (start && !Number.isNaN(start.getTime())) {
          if (from && start < from) byD = false;
          if (to) {
            // Add one day to include the whole 'to' day
            const toEnd = new Date(to);
            toEnd.setDate(toEnd.getDate()+1);
            if (start >= toEnd) byD = false;
          }
        } else {
          byD = false; // no date -> exclude when date filter active
        }
      }
      return byQ && byS && byTag && byC && byD;
    });
  }, [rows, q, statusFilter,  dateFrom, dateTo]);

  const columns = useMemo(()=>[
    { key: 'Naziv', header: 'Naziv' },
    { key: 'Tip', header: 'Tip' },
    { key: 'DatumPocetka', header: 'Datum početka' },
    { key: 'DatumKraja', header: 'Datum kraja' },
    { key: 'Lokacija', header: 'Lokacija' },
    { key: 'BrojPrijavljenih', header: 'Broj prijavljenih' },
  ], []);

  return (
    <div className="p-4">
      <h1 className="text-xl font-semibold mb-3">Moji događaji</h1>

      
      {/* Search & Filters bar */}
      <div className="flex flex-wrap items-center gap-3 w-full mb-4">
        <input
          value={q}
          onChange={e=> setQ(e.target.value)}
          placeholder="Pretraži po nazivu…"
          className="flex-grow px-3 py-2 rounded-lg bg-white/5 border border-white/10 focus:outline-none focus:ring-2 focus:ring-white/20"
        />
        <select
          value={statusFilter}
          onChange={e=> setStatusFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
        >
          <option value="">Status: svi</option>
          {statusOptions.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <select
          value={tagFilter}
          onChange={e=> setTagFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
        >
          <option value="">Tagovi: svi</option>
          {TAGS.map(t => <option key={t} value={t}>{t}</option>)}
        </select>
        <select
          value={categoryFilter}
          onChange={e=> setCategoryFilter(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
        >
          <option value="">Kategorija: sve</option>
          {categoryOptions.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <input
          type="date"
          value={dateFrom}
          onChange={e=> setDateFrom(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          title="Od datuma"
        />
        <input
          type="date"
          value={dateTo}
          onChange={e=> setDateTo(e.target.value)}
          className="px-3 py-2 rounded-lg bg-white/5 border border-white/10"
          title="Do datuma"
        />
      </div>

      {error && <div className="text-rose-400">{error}</div>}
      {!loading && !error && (
        filtered.length ? (
          <DataTable
            columns={columns}
            rows={filtered}
            actions={(row)=> (
              <button
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/15"
                onClick={()=> toast(`Izmena događaja: ${row.Naziv}`)}
                type="button"
              >
                ⋯
              </button>
            )}
          />
        ) : (
          <div className="text-white/70">Nema događaja za zadate filtere.</div>
        )
      )}
    </div>
  );
}