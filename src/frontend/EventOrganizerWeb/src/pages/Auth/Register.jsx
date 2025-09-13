import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';

const ROLES = [
  { value: 'organizator', label: 'Organizator' },
  { value: 'dobavljac',   label: 'Dobavljač' },
];

export default function Register(){
  const [form, setForm] = useState({
    ImeIPrezime: '', Email: '', KorisnickoIme: '', Sifra: '',
    Uloga: 'organizator', BrojTelefona: '', Adresa: '',
  });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e){
    e.preventDefault();
    setLoading(true);
    try{
      // Backend ima tri rute: /registracija/organizator | /dobavljac | /korisnik
      const role = form.Uloga || 'organizator';
      const path = role === 'dobavljac' ? 'auth/registracija/dobavljac' : 'auth/registracija/organizator';
      const payload = {
        ImeIPrezime: form.ImeIPrezime,
        Email: form.Email,
        KorisnickoIme: form.KorisnickoIme,
        Sifra: form.Sifra,
        BrojTelefona: form.BrojTelefona,
        Adresa: form.Adresa,
        Uloga: form.Uloga
      };
      await api.post(path, payload);
      toast.success('Uspešna registracija! Proveri email za verifikaciju, pa se prijavi.');
      navigate('/login', { replace:true });
    } catch(err){
      const msg = err?.response?.data || 'Greška pri registraciji.';
      toast.error(typeof msg === 'string' ? msg : 'Greška pri registraciji.');
    } finally{
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={onSubmit} className="form-card w-full max-w-lg space-y-4">
        <h1 className="text-2xl font-semibold">Registracija</h1>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <label className="block">
            <div className="label mb-1">Ime i prezime</div>
            <input className="input" value={form.ImeIPrezime}
                   onChange={e=>setForm({...form, ImeIPrezime:e.target.value})} required />
          </label>

          <label className="block">
            <div className="label mb-1">Email</div>
            <input className="input" type="email" value={form.Email}
                   onChange={e=>setForm({...form, Email:e.target.value})} required />
          </label>

          <label className="block">
            <div className="label mb-1">Korisničko ime</div>
            <input className="input" value={form.KorisnickoIme}
                   onChange={e=>setForm({...form, KorisnickoIme:e.target.value})} required />
          </label>

          <label className="block">
            <div className="label mb-1">Šifra</div>
            <input className="input" type="password" value={form.Sifra}
                   onChange={e=>setForm({...form, Sifra:e.target.value})} required />
          </label>

          <label className="block">
            <div className="label mb-1">Telefon</div>
            <input className="input" value={form.BrojTelefona}
                   onChange={e=>setForm({...form, BrojTelefona:e.target.value})} />
          </label>

          <label className="block">
            <div className="label mb-1">Adresa</div>
            <input className="input" value={form.Adresa}
                   onChange={e=>setForm({...form, Adresa:e.target.value})} />
          </label>

          <label className="block md:col-span-2">
            <div className="label mb-1">Uloga</div>
            <select className="input" value={form.Uloga}
                    onChange={e=>setForm({...form, Uloga:e.target.value})}>
              {ROLES.map(r => <option key={r.value} value={r.value}>{r.label}</option>)}
            </select>
          </label>
        </div>

        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Učitavam...' : 'Registruj se'}
        </button>

        <div className="text-sm text-white/70">
          Već imaš nalog? <Link to="/login" className="link">Prijavi se</Link>
        </div>
      </form>
    </div>
  );
}
