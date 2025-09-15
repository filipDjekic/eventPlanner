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
  // dto očekuje: { Naziv, Opis, DatumOdrzavanja, Dogadjaj, Podrucja?, Aktivnosti? }
  const { data } = await api.post('dani/kreiraj', dto);
  return data; // Vrati kreirani Dan (sa Id/_id)
}


export async function update(id, dto){
  await api.put(`dani/azuriraj/${id}`, dto);
}

export async function remove(id){
  await api.delete(`dani/obrisi/${id}`);
}
export async function removeAllForEvent(eventId){
  await api.delete(`dani/obrisi-za-dogadjaj/${eventId}`);
}
export async function listForEventApi(eventId) {
  const { data } = await api.get(`dani/vrati-sve-za-dogadjaj/${eventId}`);
  return Array.isArray(data) ? data : [];
}
export async function listAll(){
  const { data } = await api.get('dani/vrati-sve'); // dodaj '/api/' ako ti baseURL NIJE '/api'
  return Array.isArray(data) ? data : [];
}

/*Poziv da kreira novi niz za datum kada izaberem novi range*/ 
