// src/services/newEventApi.js
import api from './api';

/** Kreira draft događaja */
export async function createDraft(payload){
  const { data } = await api.post('dogadjaj/kreiraj', payload);
  return data; // očekuje se { id: '...', ... } ili ceo objekat
}

/** Ažurira draft događaja */
export async function updateDraft(eventId, payload){
  await api.put(`dogadjaj/azuriraj/${eventId}`, payload);
}

/** Upload slike za događaj (multipart/form-data) */
export async function uploadImage(eventId, file, opis=''){
  const fd = new FormData();
  fd.append('Slika', file);
  fd.append('Opis', opis);
  fd.append('DogadjajId', eventId);
  const { data } = await api.post('dogadjaj/dodaj-sliku', fd, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data;
}

export async function getById(eventId){
  const { data } = await api.get(`dogadjaj/vrati-po-id/${eventId}`);
  return data;
}

export async function updateTicketIds(eventId, ticketIds){
  return await updateDraft(eventId, { Id: eventId, Karte: ticketIds });
}



