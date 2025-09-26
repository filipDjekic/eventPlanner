// src/services/resourcesApi.js
import api from './api';

const ENDPOINTS = {
  listAll: 'resursi/vrati-sve',
  reserve: 'resursi/rezervisi', // POST { LokacijaId, ResursId, Kolicina }
  cancel:  'resursi/otkazi',    // POST { LokacijaId, ResursId } (promeni ako je drugi endpoint)
};

export async function listAllResources() {
  const { data } = await api.get(ENDPOINTS.listAll);
  return Array.isArray(data) ? data : [];
}

export async function reserveResource({ LokacijaId, ResursId, Kolicina }) {
  const { data } = await api.post(ENDPOINTS.reserve, { LokacijaId, ResursId, Kolicina });
  return data;
}

export async function cancelReservation({ LokacijaId, ResursId }) {
  const { data } = await api.post(ENDPOINTS.cancel, { LokacijaId, ResursId });
  return data;
}
