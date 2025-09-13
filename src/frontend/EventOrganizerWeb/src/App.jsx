import React from 'react';
import { useLocation, Navigate, Routes, Route } from 'react-router-dom';
import AppRoutes from './routes/AppRoutes';
import Login from './pages/Auth/Login';

function Sidebar(){
  const S = require('./components/Sidebar').default;
  return <S/>;
}

export default function App(){
  const loc = useLocation();
  const isAuthPage = ['/login','/register'].includes(loc.pathname);

  return (
    <div className="min-h-screen grid grid-cols-12">
      {!isAuthPage && (
        <aside className="hidden md:block col-span-2 bg-[#12121b] border-r border-white/10">
          <Sidebar/>
        </aside>
      )}
      <main className={isAuthPage ? 'col-span-12' : 'col-span-12 md:col-span-10'}>
        <Routes>
          <Route path="/" element={<Navigate to="/login" replace />} />
          <Route path="/*" element={<AppRoutes />} />
        </Routes>
      </main>
    </div>
  );
}
