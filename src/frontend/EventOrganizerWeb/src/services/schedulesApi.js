// src/services/schedulesApi.js
import api from './api';

export function normalizeId(entity){
  return entity?.Id || entity?._id || entity?.id || null;
}

function matchesEvent(entity, eventId){
  if (!eventId) return false;
  const raw = entity?.DogadjajId ?? entity?.dogadjajId ?? entity?.Dogadjaj ?? entity?.dogadjaj;
  return raw && String(raw) === String(eventId);
}

export async function listByEvent(eventId){
  if (!eventId) return [];
  const { data } = await api.get(`rasporedi/dogadjaj/${eventId}`);
  const list = Array.isArray(data) ? data : [];
  return list.filter(item => matchesEvent(item, eventId));
}

export async function create(dto){
  const payload = {
    Naziv: dto?.Naziv || dto?.naziv || '',
    Opis: dto?.Opis || dto?.opis || '',
    Lokacija: dto?.Lokacija || dto?.lokacija || '',
    Dan: dto?.Dan || dto?.dan || '',
    DogadjajId: dto?.DogadjajId || dto?.dogadjajId || dto?.Dogadjaj || dto?.dogadjaj || '',
  };
  const { data } = await api.post('rasporedi/kreiraj', payload);
  return data;
}

export async function update(id, dto){
  const payload = {
    Id: id,
    Naziv: dto?.Naziv,
    Opis: dto?.Opis,
    Lokacija: dto?.Lokacija,
    Dan: dto?.Dan,
    DogadjajId: dto?.DogadjajId,
  };
  const { data } = await api.put(`rasporedi/azuriraj/${id}`, payload);
  return data;
}

export async function remove(id){
  const { data } = await api.delete(`rasporedi/obrisi/${id}`);
  return data;
}

export { matchesEvent };
