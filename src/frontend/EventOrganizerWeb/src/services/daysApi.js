// src/services/daysApi.js
import api from './api';
import * as newevent from './newEventApi';

export async function getById(id){
  const { data } = await api.get(`dani/vrati-po-id/${id}`);
  return data;
}

export async function getForEvent(eventId){
  const ev = await newevent.getById(eventId);
  return Array.isArray(ev?.Dani) ? ev.Dani : [];
}

export async function create(dto){
  const { data } = await api.post('dani/kreiraj', dto);
  return data;
}

export async function update(id, dto){
  await api.put(`dani/azuriraj/${id}`, dto);
}

export async function remove(id){
  await api.delete(`dani/obrisi/${id}`);
}