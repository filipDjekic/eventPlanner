import React from 'react';
import { Routes, Route, Navigate } from 'react-router-dom';
import Login from '../pages/Auth/Login';
import Register from '../pages/Auth/Register';
import Events from '../pages/Organizer/Events';
import NewEvent from '../pages/Organizer/NewEvent/NewEvent';
import EventDetails from '../pages/Organizer/EventDetails';
import Resources from '../pages/Supplier/Resources';
import NewResource from '../pages/Supplier/NewResource';
import EditResource from '../pages/Supplier/EditResource';
import Profile from '../pages/Profile';
import ProtectedRoute from './ProtectedRoute';

export default function AppRoutes(){
  return (
    <Routes>
      <Route path="/login" element={<Login/>} />
      <Route path="/register" element={<Register/>} />

      <Route path="/" element={<Navigate to="/login" replace/>} />

      <Route path="/events" element={<ProtectedRoute><Events/></ProtectedRoute>} />
      <Route path="/events/new" element={<ProtectedRoute><NewEvent/></ProtectedRoute>} />
      <Route path="/events/:id" element={<ProtectedRoute><EventDetails/></ProtectedRoute>} />

      <Route path="/resources" element={<ProtectedRoute><Resources/></ProtectedRoute>} />
      <Route path="/resources/new" element={<ProtectedRoute><NewResource/></ProtectedRoute>} />
      <Route path="/resources/:id/edit" element={<ProtectedRoute><EditResource/></ProtectedRoute>} />

      <Route path="/profile" element={<ProtectedRoute><Profile/></ProtectedRoute>} />

      <Route path="*" element={<Navigate to="/login" replace/>} />
    </Routes>
  );
}
