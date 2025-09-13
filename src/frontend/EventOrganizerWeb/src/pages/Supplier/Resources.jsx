// src/pages/Supplier/Resources.jsx
import React, { useEffect, useMemo, useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../../services/api';
import DataTable from '../../components/DataTable';
import toast from 'react-hot-toast';

const TIP_RESURSA = ["Osoblje","Oprema","Hrana","Tehnika","Scena","Drugo"];

/** isti način kao kod kreiranja resursa */
function getUserId() {
  try {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    if (user?.id) return String(user.id);
  } catch {}
  try {
    const token = localStorage.getItem('token') || '';
    if (token.includes('.')) {
      const [, b64] = token.split('.');
      const json = atob(b64);
      const payload = JSON.parse(json);
      if (payload?.nameid) return String(payload.nameid);
    }
  } catch {}
  return null;
}

// helpers
const S = (v) => (v == null ? '' : String(v));
const num = (v, d=0) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : d;
};
const anyId = (r) => S(r?.Id ?? r?.id ?? r?._id ?? r?.ID ?? '');
const normId = (v) => (typeof v === 'object' ? anyId(v) : S(v));

/** Pretvori svaku stavku iz back-a u kanonski oblik koji koristi UI */
function toCanon(r){
  const id = anyId(r);
  const Naziv = r?.Naziv ?? r?.naziv ?? '';
  const Opis = r?.Opis ?? r?.opis ?? '';
  const Tip = r?.Tip ?? r?.tip;
  const UkupnoKolicina = r?.UkupnoKolicina ?? r?.ukupnoKolicina ?? r?.Kolicina ?? r?.kolicina ?? 0;
  const RezervisanoKolicina = r?.RezervisanoKolicina ?? r?.rezervisanoKolicina ?? 0;
  const Dobavljac = r?.Dobavljac ?? r?.dobavljac ?? r?.DobavljacId ?? r?.dobavljacId ?? '';

  return { id, Id: id, Naziv, Opis, Tip, UkupnoKolicina: num(UkupnoKolicina, 0), RezervisanoKolicina: num(RezervisanoKolicina, 0), Dobavljac };
}

export default function Resources() {
  const navigate = useNavigate();

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [error, setError] = useState(null);

  const [supplierResourceIds, setSupplierResourceIds] = useState([]);

  // search by name
  const [q, setQ] = useState('');

  // floating meni (fixed pored tačkica) — levo od trigera
  const [menuOpenId, setMenuOpenId] = useState(null);
  const [menuPos, setMenuPos] = useState({ x: 0, y: 0 });
  const menuRef = useRef(null);

  // modal za potvrdu brisanja
  const [confirmRow, setConfirmRow] = useState(null);

  useEffect(() => {
    let alive = true;

    (async () => {
      const userId = getUserId();
      try {
        setLoading(true);
        if (!userId) throw new Error('Nije pronađen ID ulogovanog korisnika.');

        // 1) Dobavljač — /api/dobavljaci/vrati-po-id/{id}
        try {
          const supRes = await api.get(`dobavljaci/vrati-po-id/${userId}`);
          const resursiIds = supRes?.data?.Resursi ?? supRes?.data?.resursi ?? [];
          const norm = Array.isArray(resursiIds) ? resursiIds.map(normId).filter(Boolean) : [];
          if (alive) setSupplierResourceIds(norm);
        } catch (e) {
          if (alive) setSupplierResourceIds([]); // fallback
        }

        // 2) Resursi — /api/resursi/vrati-sve
        const res = await api.get('resursi/vrati-sve');
        const list = Array.isArray(res?.data) ? res.data : [];
        if (!alive) return;
        setRows(list.map(toCanon));
        setError(null);
      } catch (e) {
        if (!alive) return;
        setError('Greška pri učitavanju resursa');
      } finally {
        if (alive) setLoading(false);
      }
    })();

    return () => { alive = false; };
  }, []);

  // filtriraj samo moje resurse (preko liste ID-eva ili preko vlasnika Dobavljac === userId)
  const myRows = useMemo(() => {
    const userId = getUserId();
    const ids = new Set((supplierResourceIds || []).map(String));

    const filtered = (rows || []).filter(r => {
      const rid = r?.Id ?? r?.id;
      const owner = r?.Dobavljac ? S(r.Dobavljac) : '';
      const inList = rid && ids.has(String(rid));
      const byOwner = owner && userId && owner === String(userId);
      return inList || byOwner;
    });

    const base = filtered.length > 0 ? filtered : (rows || []);

    // search by Naziv
    const needle = S(q).trim().toLowerCase();
    if (!needle) return base;
    return base.filter(r => S(r?.Naziv).toLowerCase().includes(needle));
  }, [rows, supplierResourceIds, q]);

  // priprema redova za prikaz (Tip može biti broj ili string)
  const viewRows = useMemo(() => {
    return myRows.map(r => {
      // Tip: broj → mapiraj; string → koristi direktno
      let tipName = '';
      if (typeof r?.Tip === 'number') {
        tipName = TIP_RESURSA[r.Tip] ?? String(r.Tip);
      } else if (!Number.isNaN(Number(r?.Tip))) {
        const idx = Number(r?.Tip);
        tipName = TIP_RESURSA[idx] ?? String(r?.Tip);
      } else {
        tipName = String(r?.Tip ?? '');
      }

      const ukupno = num(r?.UkupnoKolicina, 0);
      const rez = num(r?.RezervisanoKolicina, 0);
      let status = 'Slobodno', rank = 0;
      if (ukupno > 0 && rez >= ukupno) { status = 'Zauzeto'; rank = 2; }
      else if (rez > 0) { status = 'Delimično'; rank = 1; }

      const opis = String(r?.Opis ?? '');
      return {
        id: r?.Id ?? r?.id,
        _id: r?.Id ?? r?.id,
        Naziv: r?.Naziv ?? '',
        TipName: tipName,
        UkupnoKolicina: ukupno,
        RezervisanoKolicina: rez,
        Zauzetost: status,
        ZauzetostRank: rank, // 0 slobodno, 1 delimično, 2 zauzeto  (za sortiranje)
        OpisShort: opis.length > 80 ? (opis.slice(0, 77) + '...') : opis,
        _raw: r
      };
    });
  }, [myRows]);

  // sticky header + scroll body
  const tableWrapperStyle = {
    maxHeight: '65vh',
    overflowY: 'auto',
    position: 'relative',
    borderRadius: '12px',
  };
  const stickyHeaderCss = `
    .sticky-header thead th {
      position: sticky;
      top: 0;
      z-index: 2;
      background: rgba(20,20,20,0.9);
      backdrop-filter: saturate(120%) blur(2px);
    }
  `;

  function openMenu(e, row) {
    // spreči da globalni click handler odmah zatvori
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    // Pozicioniranje LEVO: širina ~ 180px
    const menuWidth = 180;
    const left = Math.max(8, rect.left - menuWidth - 8);
    setMenuPos({ x: left, y: rect.top });
    setMenuOpenId(row?._id || row?.id);
  }

  // zatvori meni klikom van/ESC, ali ne i kad kliknemo na dugme-triger
  useEffect(() => {
    function onDocClick(ev) {
      if (ev.target.closest?.('[data-row-menu-trigger]')) return;
      if (!menuRef.current || !menuRef.current.contains(ev.target)) {
        setMenuOpenId(null);
      }
    }
    function onEsc(ev) {
      if (ev.key === 'Escape') setMenuOpenId(null);
    }
    document.addEventListener('click', onDocClick);
    document.addEventListener('keydown', onEsc);
    return () => {
      document.removeEventListener('click', onDocClick);
      document.removeEventListener('keydown', onEsc);
    };
  }, []);

  function handleEdit(row) {
    if (!row?._id && !row?.id) return;
    // vodi na EditResource.jsx rutu
    navigate(`/resources/${row._id || row.id}/edit`);
  }

  function openDeleteConfirm(row){
    setConfirmRow(row);
    setMenuOpenId(null);
  }

  async function confirmDelete() {
    const row = confirmRow;
    const theId = row?._id || row?.id;
    if (!theId) return;
    try {
      await api.delete(`resursi/obrisi/${theId}`);
      setRows(prev => prev.filter(x => {
        const id = x?.Id ?? x?.id ?? x?._id ?? x?.ID;
        return id !== theId;
      }));
      toast.success('Resurs obrisan.');
    } catch (e) {
      toast.error('Brisanje nije uspelo.');
    } finally {
      setConfirmRow(null);
    }
  }

  const pill = (status) => {
    let cls = 'bg-emerald-500/15 text-emerald-300 border-emerald-500/30';
    if (status === 'Delimično') cls = 'bg-amber-500/15 text-amber-300 border-amber-500/30';
    if (status === 'Zauzeto') cls = 'bg-rose-500/15 text-rose-300 border-rose-500/30';
    return (
      <span className={`inline-block px-2 py-0.5 rounded-[999px] border ${cls}`}>
        {status}
      </span>
    );
  };

  const columns = [
    { key: 'Naziv', header: 'Naziv' },
    { key: 'TipName', header: 'Tip' },
    // sortira se po ZauzetostRank (0,1,2) — DataTable već sortira brojeve
    { key: 'ZauzetostRank', header: 'Zauzetost', render: (v, row) => pill(row.Zauzetost) },
    { key: 'UkupnoKolicina', header: 'Količina' },
    { key: 'OpisShort', header: 'Opis' },
  ];

  return (
    <div className="p-4 md:p-8 space-y-4 relative">
      <style>{stickyHeaderCss}</style>

      <div className="text-2xl font-semibold">Moji resursi</div>

      {/* Search bar */}
      <div className="flex items-center gap-3">
        <input
          type="text"
          value={q}
          onChange={(e)=>setQ(e.target.value)}
          placeholder="Pretraga po nazivu..."
          className="w-full md:w-80 rounded-xl border border-white/10 bg-transparent px-3 py-2 focus:outline-none focus:ring"
        />
      </div>

      {loading && <div>Učitavanje...</div>}
      {error && <div className="text-rose-400">{error}</div>}

      {!loading && !error && (
        <div className="sticky-header" style={tableWrapperStyle}>
          <DataTable
            columns={columns}
            rows={viewRows}
            rowKey={(row) => row?.id}
            actions={(row) => (
              <button
                data-row-menu-trigger
                className="px-3 py-1 rounded bg-white/10 hover:bg-white/15"
                title="Opcije"
                onClick={(e) => openMenu(e, row)}
              >
                ⋯
              </button>
            )}
          />
        </div>
      )}

      {/* GLOBALNI (fixed) MENI — levo od trigera */}
      {menuOpenId && (
        <div
          ref={menuRef}
          style={{
            position: 'fixed',
            left: `${menuPos.x}px`,
            top: `${menuPos.y}px`,
            zIndex: 9999,
            minWidth: '180px'
          }}
          className="rounded-xl border bg-neutral-900 text-sm shadow-2xl"
        >
          <button
            className="w-full text-left px-3 py-2 hover:bg-white/10 rounded-t-xl"
            onClick={() => handleEdit(viewRows.find(r => (r._id || r.id) === menuOpenId))}
          >
            Izmeni
          </button>
          <button
            className="w-full text-left px-3 py-2 hover:bg-white/10 text-rose-300 rounded-b-xl"
            onClick={() => openDeleteConfirm(viewRows.find(r => (r._id || r.id) === menuOpenId))}
          >
            Obriši
          </button>
        </div>
      )}

      {/* MODAL za potvrdu brisanja */}
      {confirmRow && (
        <div
          className="fixed inset-0 z-[9998] flex items-center justify-center"
          aria-modal="true"
          role="dialog"
        >
          <div className="absolute inset-0 bg-black/60" onClick={()=>setConfirmRow(null)} />
          <div className="relative z-[9999] w-full max-w-md rounded-2xl border border-white/10 bg-neutral-900 p-6 shadow-2xl">
            <div className="text-lg font-semibold mb-2">Obriši resurs</div>
            <div className="text-sm opacity-80 mb-6">
              Da li sigurno želiš da obrišeš resurs <span className="font-medium">"{S(confirmRow?.Naziv)}"</span>? Ova akcija je nepovratna.
            </div>
            <div className="flex items-center justify-end gap-2">
              <button
                className="px-4 py-2 rounded-xl border border-white/10 hover:bg-white/10"
                onClick={()=>setConfirmRow(null)}
              >
                Otkaži
              </button>
              <button
                className="px-4 py-2 rounded-xl bg-rose-600/90 hover:bg-rose-500 text-white"
                onClick={confirmDelete}
              >
                Obriši
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
