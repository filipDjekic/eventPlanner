// src/services/newEventApi.js
import api from './api';

/** Kreira draft događaja */
export async function createDraft(payload){
  const { data } = await api.post('dogadjaj/kreiraj', payload);
  return data; // očekuje se { id: '...', ... } ili ceo objekat
}

/** Ažurira draft događaja */
// src/services/newEventApi.js

/** Ažurira draft događaja – MERGE GUARD (ne briše Dani ako payload ne sadrži Dani) */
export async function updateDraft(eventId, payload){
  let existing = null;
  try { existing = await getById(eventId); } catch {}

  // Ako payload ne šalje Dani, zadrži postojeće Dani sa servera
  const nextDani =
    (payload && Object.prototype.hasOwnProperty.call(payload, 'Dani'))
      ? payload.Dani
      : (existing ? existing.Dani : undefined);

  const merged = {
    ...(existing || {}),
    ...(payload || {}),
    Id: eventId,
    // eksplicitno postavi Dani posle spread-a da ne bude pregažen
    ...(nextDani !== undefined ? { Dani: nextDani } : {})
  };

  await api.put(`dogadjaj/azuriraj/${eventId}`, merged);
}


/** Vrati događaj po Id-u */
export async function getById(id){
  const { data } = await api.get(`dogadjaj/vrati-po-id/${id}`);
  return data;
}

/** Upload slike za događaj (multipart/form-data) */
export async function uploadImage(eventId, file, opis=''){
  const formData = new FormData();
  formData.append('DogadjajId', eventId);
  formData.append('Slika', file);
  if (opis) formData.append('Opis', opis);

  const { data } = await api.post('dogadjaj/slika', formData, {
    headers: { 'Content-Type': 'multipart/form-data' }
  });
  return data; // očekuje { path: '/relative/path' } sa backenda
}


export async function updateTicketIds(eventId, ticketIds){
  const ev = await getById(eventId);           // učitamo postojeće vrednosti
  const { Id, _id, ...rest } = ev || {};       // sklonimo eventualne read-only/_id polja
  const payload = { ...rest, Id: eventId, Karte: ticketIds };
  return await updateDraft(eventId, payload);  // pošalji PUNE podatke + izmenjene Karte
}

export async function updateDayIds(eventId, dayIds){
  const ev = await getById(eventId);           // uzmi postojeće
  const { Id, _id, ...rest } = ev || {};       // skini read-only
  const payload = { ...rest, Id: eventId, Dani: dayIds };
  return await updateDraft(eventId, payload);  // pošalji PUNE podatke + izmenjene Dani
}