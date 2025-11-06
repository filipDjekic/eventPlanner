// src/services/areasApi.js
import api from './api';

/** Vrati sva područja (server-side lista, pa filtriramo po dogadjaju/danu po potrebi) */
export async function getAll(){
  const { data } = await api.get('podrucja/vrati-sve');
  return Array.isArray(data) ? data : [];
}

/** Vrati područje po Id-u */
export async function getById(id){
  const { data } = await api.get(`podrucja/vrati-po-id/${id}`);
  return data;
}

/** Kreiraj područje */
export async function create(dto){
  // dto: { DogadjajId, DanId, Naziv, HEXboja, Koordinate:[[x,y],...], Lokacije:[...] }
  const { data } = await api.post('podrucja/kreiraj', dto);
  return data; // očekujemo kreirani objekat sa Id
}

/** Ažuriraj područje */
export async function update(id, dto){
  // dto: { Id, DogadjajId?, DanId?, Naziv?, HEXboja?, Koordinate?, Lokacije? }
  await api.put(`podrucja/azuriraj/${id}`, { Id: id, ...dto });
}

/** Obriši područje */
export async function remove(id){
  await api.delete(`podrucja/obrisi/${id}`);
}

/** Pomoćno: filtriranja na klijentu */
export async function getForEvent(eventId){
  const all = await getAll();
  return all.filter(a => String(a?.DogadjajId ?? a?.dogadjajId ?? '') === String(eventId));
}
export async function getForDay(dayId){
  const all = await getAll();
  return all.filter(a => a?.DanId === dayId);
}
export async function listAll(){
  const { data } = await api.get('podrucja/vrati-sve');
  return Array.isArray(data) ? data : [];
}