// src/services/ticketsApi.js
import api from './api';

/** Učitaj događaj da bi dobili Kapacitet, Beskonacno i postojeće karte (ako API vraća) */
export async function fetchEvent(eventId){
  const { data } = await api.get(`dogadjaj/vrati-po-id/${eventId}`);
  return data;
}

/** Lista karata za događaj (ako API postoji) */
export async function fetchTickets(eventId){
  const { data } = await api.get(`karta/vrati-za-dogadjaj-kartu/${eventId}`);
  return Array.isArray(data) ? data : [];
}

/** Kreiraj kartu za događaj */
export async function createTicket(eventId, payload){
  const body = { ...(payload||{}), DogadjajId: eventId };
  const { data } = await api.post('karta/kreiraj', body);
  return data; // očekuje se { Id: '...' } ili ID string
}

/** Ažuriraj kartu */
export async function updateTicket(ticketId, payload){
  const { data } = await api.put(`karta/azuriraj/${ticketId}`, { ...(payload||{}) });
  return data;
}

/** Obriši kartu */
export async function deleteTicket(ticketId){
  const { data } = await api.delete(`karta/obrisi/${ticketId}`);
  return data;
}
