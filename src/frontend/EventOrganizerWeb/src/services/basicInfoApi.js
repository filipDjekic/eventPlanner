// src/services/basicinfoapi.js
import * as newevent from './newEventApi.js';

/** Pakuje i šalje podatke iz BasicInfo forme u newevent API */
export async function createDraft(payload){
  return await newevent.createDraft(payload);
}

export async function updateDraft(eventId, payload){
  const body = { ...(payload || {}), Id: eventId };
  return await newevent.updateDraft(eventId, body);
}
