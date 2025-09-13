// src/pages/Auth/Login.jsx
import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../../services/api';
import toast from 'react-hot-toast';
import { parseLoginResponse, saveAuth } from '../../utils/auth';

export default function Login(){
  const [form, setForm] = useState({ KorisnickoIme:'', Sifra:'' });
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  async function onSubmit(e){
    e.preventDefault();
    setLoading(true);
    try{
      const res = await api.post('auth/login', form);
      const auth = parseLoginResponse(res.data);
      if(!auth?.token){
        toast.error('Neispravan odgovor servera.');
        return;
      }
      if (auth.emailVerified === false) {
        toast.error('Email nije verifikovan. Proveri sanduče.');
        return;
      }
      saveAuth(auth);
      toast.success('Uspešna prijava!');
      // Po ulozi vodi na pravu početnu
      if (auth.role === 'Organizator') navigate('/events', { replace:true });
      else if (auth.role === 'Dobavljac') navigate('/resources', { replace:true });
      else navigate('/profile', { replace:true });
    } catch(err){
      const msg = err?.response?.data || 'Greška pri prijavi.';
      toast.error(typeof msg === 'string' ? msg : 'Greška pri prijavi.');
    } finally{
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen grid place-items-center px-4">
      <form onSubmit={onSubmit} className="form-card w-full max-w-md space-y-4">
        <h1 className="text-2xl font-semibold">Prijava</h1>

        <label className="block">
          <div className="label mb-1">Korisničko ime</div>
          <input className="input" value={form.KorisnickoIme}
                 onChange={e=>setForm({...form, KorisnickoIme:e.target.value})}
                 autoComplete="username" required />
        </label>

        <label className="block">
          <div className="label mb-1">Šifra</div>
          <input className="input" type="password" value={form.Sifra}
                 onChange={e=>setForm({...form, Sifra:e.target.value})}
                 autoComplete="current-password" required />
        </label>

        <button className="btn btn-primary w-full" disabled={loading}>
          {loading ? 'Učitavam...' : 'Uloguj se'}
        </button>

        <div className="text-sm text-white/70">
          Nemaš nalog? <Link to="/register" className="link">Registruj se</Link>
        </div>
      </form>
    </div>
  );
}
