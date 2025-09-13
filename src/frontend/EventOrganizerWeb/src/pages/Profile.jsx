// src/pages/Profile.jsx
import React, { useEffect, useMemo, useState } from 'react';
import api from '../services/api';
import toast from 'react-hot-toast';

/* ----------------------- helpers ----------------------- */
function roleKey(role) {
  if (!role) return 'korisnici';
  const r = String(role).toLowerCase();
  if (r.includes('organizator')) return 'organizatori';
  if (r.includes('dobavljac') || r.includes('dobavljač')) return 'dobavljaci';
  return 'korisnici';
}

// vrati inicijale za avatar
function initials(name) {
  if (!name) return '👤';
  const parts = String(name).trim().split(/\s+/).slice(0, 2);
  return parts.map(p => p[0]?.toUpperCase() || '').join('') || '👤';
}

/* ----------------------- component ----------------------- */
export default function Profile(){
  const stored = useMemo(() => {
    try { return JSON.parse(localStorage.getItem('user') || '{}'); } catch { return {}; }
  }, []);
  const userId = stored?.id || stored?.Id || null;
  const userRole = stored?.role || stored?.Uloga || null;

  const [loading, setLoading] = useState(true);
  const [view, setView] = useState(null); // podatak sa servera (view-mode)
  const [form, setForm] = useState(null); // edit-mode snapshot
  const [isEditing, setIsEditing] = useState(false);
  const [confirmPass, setConfirmPass] = useState(''); // potvrda izmene šifrom

  // modali
  const [showChangePass, setShowChangePass] = useState(false);
  const [showForgotPass, setShowForgotPass] = useState(false);

  // change password fields
  const [oldPass, setOldPass] = useState('');
  const [newPass1, setNewPass1] = useState('');
  const [newPass2, setNewPass2] = useState('');

  // forgot password fields
  const [fpNew1, setFpNew1] = useState('');
  const [fpNew2, setFpNew2] = useState('');

  // fetch profile by role/id
  useEffect(() => {
    if (!userId) {
      setLoading(false);
      toast.error('Nedostaje ID korisnika.');
      return;
    }
    const base = roleKey(userRole);

    (async () => {
      setLoading(true);
      try {
        // organizator route u kodu ima malu nekonzistentnost, pa probamo oba oblika
        let res;
        if (base === 'organizatori') {
          try {
            res = await api.get(`organizatori/vrati-po-id/${userId}`);
          } catch {
            res = await api.get(`organizatori/vrati-po-id/${userId}`); // fallback ako je bez kose crte
          }
        } else if (base === 'dobavljaci') {
          res = await api.get(`dobavljaci/vrati-po-id/${userId}`);
        } else {
          res = await api.get(`korisnici/vrati-po-id/${userId}`);
        }
        const data = res?.data || {};

        const v = normalizeView(data, stored, userRole, userId);
        setView(v);

        // form snapshot – popuni SVA polja iz v-a (ne samo ImeIPrezime)
        setForm({
          Id: data?.Id || data?.id || userId || '',
          ImeIPrezime: v.ime || '',
          Email: v.email || '',
          KorisnickoIme: v.korisnickoIme || '',
          BrojTelefona: v.brojTelefona || '',
          Adresa: v.adresa || '',
          // VerifikovanEmail se ne uređuje u formi
        });
      } catch (e) {
        toast.error('Greška pri učitavanju profila.');
      } finally {
        setLoading(false);
      }
    })();
  }, [userId, userRole]);

  function normalizeView(d, storedUser, role, id) {
    // Univerzalna polja za prikaz (ID izostavljamo iz UI-ja po zahtevu)
    return {
      ime: d?.ImeIPrezime || d?.imeIPrezime || d?.Ime || d?.ime || storedUser?.name || '—',
      email: d?.Email || d?.email || '—',
      korisnickoIme: d?.KorisnickoIme || d?.korisnickoIme || '—',
      uloga: role || '—',
      brojTelefona: d?.BrojTelefona || d?.brojTelefona || '—',
      adresa: d?.Adresa || d?.adresa || '—',
      verifikovanEmail: (d?.VerifikovanEmail ?? d?.verifikovanEmail ?? storedUser?.emailVerified) ?? null,
    };
  }

  function startEdit(){
    // kada krene edit, snapshot iz TRENUTNOG view-a (sva polja popunjena)
    setForm(f => ({
      ...(f || {}),
      ImeIPrezime: view?.ime === '—' ? '' : (view?.ime || ''),
      Email: view?.email === '—' ? '' : (view?.email || ''),
      KorisnickoIme: view?.korisnickoIme === '—' ? '' : (view?.korisnickoIme || ''),
      BrojTelefona: view?.brojTelefona === '—' ? '' : (view?.brojTelefona || ''),
      Adresa: view?.adresa === '—' ? '' : (view?.adresa || ''),
    }));
    setIsEditing(true);
    setConfirmPass('');
  }
  function cancelEdit(){
    // reset na trenutno prikazane vrednosti
    setForm(f => ({
      ...(f || {}),
      ImeIPrezime: view?.ime === '—' ? '' : (view?.ime || ''),
      Email: view?.email === '—' ? '' : (view?.email || ''),
      KorisnickoIme: view?.korisnickoIme === '—' ? '' : (view?.korisnickoIme || ''),
      BrojTelefona: view?.brojTelefona === '—' ? '' : (view?.brojTelefona || ''),
      Adresa: view?.adresa === '—' ? '' : (view?.adresa || ''),
    }));
    setIsEditing(false);
    setConfirmPass('');
  }

  async function saveEdit(e){
    e.preventDefault();
    if (!confirmPass) {
      toast.error('Unesi šifru u polje „Potvrdi šifrom“.');
      return;
    }
    try {
      const base = roleKey(userRole);
      // ne šaljemo VerifikovanEmail u payload
      const payload = { ...form };
      if ('VerifikovanEmail' in payload) delete payload.VerifikovanEmail;
      if (base === 'organizatori') {
        // PUT bez id-a u ruti; telo sadrži Id
        await api.put('organizatori/azuriraj', payload);
      } else if (base === 'dobavljaci') {
        await api.put(`dobavljaci/azuriraj/${userId}`, payload);
      } else {
        await api.put(`korisnici/azuriraj/${userId}`, payload);
      }
      toast.success('Podaci su sačuvani.');

      // sync view iz forme posle uspeha
      const nextView = {
        ...view,
        ime: form.ImeIPrezime || view?.ime,
        email: form.Email || view?.email,
        korisnickoIme: form.KorisnickoIme || view?.korisnickoIme,
        brojTelefona: form.BrojTelefona || view?.brojTelefona,
        adresa: form.Adresa || view?.adresa,
      };
      setView(nextView);
      setIsEditing(false);
      setConfirmPass('');

      // osveži i localStorage ime ako je promenjeno
      try {
        const u = JSON.parse(localStorage.getItem('user') || '{}');
        if (form.ImeIPrezime && u) {
          u.name = form.ImeIPrezime;
          localStorage.setItem('user', JSON.stringify(u));
        }
      } catch {}
    } catch (err) {
      toast.error(typeof err?.response?.data === 'string' ? err.response.data : 'Greška pri čuvanju.');
    }
  }

  // Change password (sa starom)
  async function handleChangePassword(e){
    e.preventDefault();
    if (!oldPass || !newPass1 || !newPass2) {
      toast.error('Popuni sva polja.');
      return;
    }
    if (newPass1 !== newPass2) {
      toast.error('Nove šifre se ne poklapaju.');
      return;
    }
    const base = roleKey(userRole);
    try {
      if (base === 'organizatori') {
        await api.post(`organizatori/${userId}/promeni-sifru`, {
          OrganizatorId: userId,
          TrenutnaSifra: oldPass,
          NovaSifra: newPass1,
        });
      } else if (base === 'dobavljaci') {
        await api.post(`dobavljaci/promeni-sifru/${userId}`, {
          TrenutnaSifra: oldPass,
          NovaSifra: newPass1,
        });
      } else {
        toast.error('Promena šifre za ovu ulogu nije podržana na serveru.');
        return;
      }
      toast.success('Šifra uspešno promenjena.');
      setShowChangePass(false);
      setOldPass(''); setNewPass1(''); setNewPass2('');
    } catch (err) {
      toast.error(typeof err?.response?.data === 'string' ? err.response.data : 'Greška pri promeni šifre.');
    }
  }

  // Forgot password (bez stare) — backend ne postoji: samo poruka
  async function handleForgotPassword(e){
    e.preventDefault();
    if (!fpNew1 || !fpNew2) {
      toast.error('Popuni oba polja.');
      return;
    }
    if (fpNew1 !== fpNew2) {
      toast.error('Nove šifre se ne poklapaju.');
      return;
    }
    toast.error('„Zaboravljena šifra“ nije implementirana na serveru. Dodaj reset endpoint pa ću ga odmah povezati.');
  }

  /* ----------------------- UI ----------------------- */
  if (loading) {
    return (
      <div className="p-4 md:p-8 space-y-4">
        <div className="text-2xl font-semibold">Moj profil</div>
        <div>Učitavanje...</div>
      </div>
    );
  }

  return (
    <div className="p-4 md:p-8 space-y-4">
      <div className="text-2xl font-semibold">Moj profil</div>

      {/* CARD – moderan pregled informacija */}
      <div className="bg-gradient-to-br from-white/5 to-white/0 rounded-2xl border border-white/10 shadow-[0_8px_30px_rgb(0,0,0,0.12)] overflow-hidden">
        {/* header */}
        <div className="flex items-center gap-4 p-5 md:p-6 border-b border-white/10 bg-white/5 backdrop-blur">
          <div className="h-14 w-14 rounded-2xl bg-white/10 grid place-items-center text-lg font-semibold">
            {initials(view?.ime)}
          </div>
          <div className="flex-1 min-w-0">
            <div className="text-lg md:text-xl font-semibold truncate">{view?.ime}</div>
            <div className="text-white/60 text-sm truncate">{view?.email}</div>
          </div>

          {!isEditing ? (
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={startEdit}>Izmeni</button>
              <button className="btn btn-subtle" onClick={()=>setShowChangePass(true)}>Promeni šifru</button>
              <button className="btn btn-subtle" onClick={()=>setShowForgotPass(true)}>Zaboravljena šifra</button>
            </div>
          ) : (
            <div className="flex gap-2">
              <button className="btn btn-primary" onClick={saveEdit}>Sačuvaj</button>
              <button className="btn btn-subtle" onClick={cancelEdit}>Otkaži</button>
            </div>
          )}
        </div>

        {/* content */}
        {!isEditing ? (
          <div className="p-5 md:p-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <CardRow label="Korisničko ime" value={view?.korisnickoIme} />
              <CardRow label="Uloga" value={view?.uloga} />
              <CardRow label="Telefon" value={view?.brojTelefona} />
              <CardRow label="Adresa" value={view?.adresa} />
              {view?.verifikovanEmail != null && (
                <CardRow label="Email verifikovan" value={view.verifikovanEmail ? 'DA' : 'NE'} />
              )}
            </div>
          </div>
        ) : (
          <form onSubmit={saveEdit} className="p-5 md:p-6 space-y-5">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Field label="Ime i prezime">
                <input className="input" value={form?.ImeIPrezime || ''} onChange={e=>setForm({...form, ImeIPrezime:e.target.value})}/>
              </Field>
              <Field label="Email">
                <input className="input" type="email" value={form?.Email || ''} onChange={e=>setForm({...form, Email:e.target.value})}/>
              </Field>
              <Field label="Korisničko ime">
                <input className="input" value={form?.KorisnickoIme || ''} onChange={e=>setForm({...form, KorisnickoIme:e.target.value})}/>
              </Field>
              <Field label="Telefon">
                <input className="input" value={form?.BrojTelefona || ''} onChange={e=>setForm({...form, BrojTelefona:e.target.value})}/>
              </Field>
              <Field label="Adresa">
                <input className="input" value={form?.Adresa || ''} onChange={e=>setForm({...form, Adresa:e.target.value})}/>
              </Field>
              
            </div>

            {/* potvrda izmena šifrom */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 pt-2">
              <Field label="Potvrdi šifrom">
                <input className="input" type="password" value={confirmPass} onChange={e=>setConfirmPass(e.target.value)} placeholder="Unesi svoju trenutnu šifru"/>
              </Field>
            </div>

            <div className="flex gap-2">
              <button className="btn btn-primary" type="submit">Sačuvaj</button>
              <button className="btn btn-subtle" type="button" onClick={cancelEdit}>Otkaži</button>
            </div>
          </form>
        )}
      </div>

      {/* MODAL: PROMENA ŠIFRE */}
      {showChangePass && (
        <Modal onClose={()=>{setShowChangePass(false); setOldPass(''); setNewPass1(''); setNewPass2('');}}>
          <div className="text-lg font-semibold mb-3">Promeni šifru</div>
          <form onSubmit={handleChangePassword} className="space-y-3">
            <div>
              <div className="label mb-1">Stara šifra</div>
              <input className="input" type="password" value={oldPass} onChange={e=>setOldPass(e.target.value)} required/>
            </div>
            <div>
              <div className="label mb-1">Nova šifra</div>
              <input className="input" type="password" value={newPass1} onChange={e=>setNewPass1(e.target.value)} required/>
            </div>
            <div>
              <div className="label mb-1">Potvrdi novu šifru</div>
              <input className="input" type="password" value={newPass2} onChange={e=>setNewPass2(e.target.value)} required/>
            </div>
            <div className="flex gap-2 pt-2">
              <button className="btn btn-primary" type="submit">Sačuvaj</button>
              <button className="btn btn-subtle" type="button" onClick={()=>setShowChangePass(false)}>Otkaži</button>
            </div>
          </form>
        </Modal>
      )}

      {/* MODAL: ZABORAVILI STE ŠIFRU */}
      {showForgotPass && (
        <Modal onClose={()=>{setShowForgotPass(false); setFpNew1(''); setFpNew2('');}}>
          <div className="text-lg font-semibold mb-3">Zaboravili ste šifru</div>
          <form onSubmit={handleForgotPassword} className="space-y-3">
            <div className="text-white/70 text-sm">
              Unesite novu šifru dvaput. Napomena: backend trenutno nema endpoint za reset, pa će se prikazati poruka.
            </div>
            <div>
              <div className="label mb-1">Nova šifra</div>
              <input className="input" type="password" value={fpNew1} onChange={e=>setFpNew1(e.target.value)} required/>
            </div>
            <div>
              <div className="label mb-1">Potvrdi novu šifru</div>
              <input className="input" type="password" value={fpNew2} onChange={e=>setFpNew2(e.target.value)} required/>
            </div>
            <div className="flex gap-2 pt-2">
              <button className="btn btn-primary" type="submit">Potvrdi</button>
              <button className="btn btn-subtle" type="button" onClick={()=>setShowForgotPass(false)}>Otkaži</button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}

/** UI helpers */
function CardRow({ label, value }) {
  return (
    <div className="bg-white/5 rounded-xl p-4 border border-white/10">
      <div className="text-xs uppercase tracking-wide text-white/60">{label}</div>
      <div className="mt-1 text-base">{value ?? '—'}</div>
    </div>
  );
}
function Field({ label, children }) {
  return (
    <label className="block">
      <div className="label mb-1">{label}</div>
      {children}
    </label>
  );
}
function Modal({ children, onClose }) {
  return (
    <div className="fixed inset-0 z-50 grid place-items-center bg-black/60 p-4">
      <div className="bg-bg-2 border border-white/10 rounded-2xl shadow-[0_8px_30px_rgb(0,0,0,0.12)] p-4 w-full max-w-md relative">
        <button
          onClick={onClose}
          className="absolute right-3 top-3 text-white/70 hover:text-white text-xl leading-none"
          aria-label="Zatvori"
          type="button"
        >
          ×
        </button>
        {children}
      </div>
    </div>
  );
}
