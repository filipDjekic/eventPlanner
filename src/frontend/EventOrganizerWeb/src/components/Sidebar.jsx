// src/components/Sidebar.jsx
import React, { useEffect, useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { getAuth, clearAuth } from '../utils/auth';

export default function Sidebar() {
  const [auth, setAuth] = useState(getAuth());
  const navigate = useNavigate();
  const loc = useLocation();

  useEffect(() => {
    setAuth(getAuth());
  }, [loc.pathname]);

  function active(href) {
    return loc.pathname.startsWith(href) ? 'bg-white/10' : '';
  }

  function logout() {
    clearAuth();
    navigate('/login', { replace: true });
  }

  const isOrganizer = auth.role === 'Organizator';
  const isSupplier  = auth.role === 'Dobavljac';

  const displayName = auth.name || 'Korisnik';
  const displayUloga = auth.role || null;

  return (
    <div className="h-full p-4 flex flex-col gap-4 text-white">
      {/* header: ime + uloga */}
      <div className="p-4 rounded-xl bg-gradient-to-br from-[#8b5cf6]/20 to-[#ec4899]/20 border border-white/10">
        <div className="text-sm text-white/70">Ulogovani korisnik</div>
        <div className="font-semibold">{displayName}</div>
        <div className="text-xs text-white/70">Uloga: {displayUloga ?? '—'}</div>
      </div>

      <nav className="flex-1 space-y-1">
        {isOrganizer && (
          <>
            <Link className={`block px-3 py-2 rounded-xl ${active('/events')}`} to="/events">
              Događaji
            </Link>
            <Link className={`block px-3 py-2 rounded-xl ${active('/events/new')}`} to="/events/new">
              Novi događaj
            </Link>
          </>
        )}

        {isSupplier && (
          <>
            <Link className={`block px-3 py-2 rounded-xl ${active('/resources')}`} to="/resources">
              Resursi
            </Link>
            <Link className={`block px-3 py-2 rounded-xl ${active('/resources/new')}`} to="/resources/new">
              Novi resurs
            </Link>
          </>
        )}

        {(isOrganizer || isSupplier) && (
          <Link className={`block px-3 py-2 rounded-xl ${active('/profile')}`} to="/profile">
            Moj profil
          </Link>
        )}
      </nav>

      <button onClick={logout} className="btn btn-subtle w-full">
        Odjavi se
      </button>
    </div>
  );
}
