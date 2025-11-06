// src/services/activitiesApi.js
import api from './api';

function normalizeId(entity){
  return entity?.Id || entity?._id || entity?.id || null;
}

function matchesEvent(entity, eventId){
  if(!eventId) return false;
  const raw = entity?.Dogadjaj ?? entity?.dogadjaj ?? entity?.DogadjajId ?? entity?.dogadjajId;
  return raw && String(raw) === String(eventId);
}

export async function listAll(){
  const { data } = await api.get('aktivnosti/vrati-sve');
  return Array.isArray(data) ? data : [];
}

export async function listByEvent(eventId){
  if(!eventId) return [];
  const { data } = await api.get(`aktivnosti/dogadjaj/${eventId}`);
  const list = Array.isArray(data) ? data : [];
  return list.filter(item => matchesEvent(item, eventId));
}

export async function create(dto){
  const payload = {
    Naziv: dto?.Naziv || dto?.naziv || '',
    Opis: dto?.Opis || dto?.opis || '',
    DatumVremePocetka: dto?.DatumVremePocetka || dto?.datumVremePocetka,
    DatumVremeKraja: dto?.DatumVremeKraja || dto?.datumVremeKraja,
    Lokacija: dto?.Lokacija || dto?.lokacija || '',
    Dan: dto?.Dan || dto?.dan || '',
    Dogadjaj: dto?.Dogadjaj || dto?.dogadjaj || dto?.DogadjajId || dto?.dogadjajId || '',
    Tip: dto?.Tip || dto?.tip || 'Ostalo'
  };
  const { data } = await api.post('aktivnosti/kreiraj', payload);
  return data;
}

export async function update(id, dto){
  const payload = {
    Id: id,
    Naziv: dto?.Naziv,
    Opis: dto?.Opis,
    DatumVremePocetka: dto?.DatumVremePocetka,
    DatumVremeKraja: dto?.DatumVremeKraja,
    Lokacija: dto?.Lokacija,
    Dan: dto?.Dan,
    Dogadjaj: dto?.Dogadjaj,
    Tip: dto?.Tip,
  };
  const { data } = await api.put(`aktivnosti/azuriraj/${id}`, payload);
  return data;
}

export async function remove(id){
  const { data } = await api.delete(`aktivnosti/obrisi/${id}`);
  return data;
}

export { normalizeId };
