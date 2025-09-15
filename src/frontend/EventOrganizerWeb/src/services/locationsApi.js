// src/services/locationsApi.js
import api from './api';
import * as areasApi from './areasApi';

/** Lokacije */
export async function getById(id){
  const { data } = await api.get(`lokacija/vrati-po-id/${id}`);
  return data;
}

export async function listAll(){
  const { data } = await api.get('lokacija/vrati-sve');
  return Array.isArray(data) ? data : [];
}

export async function listForEvent(eventId){
  try{
    const { data } = await api.get(`lokacija/vrati-za-dogadjaj/${eventId}`);
    if (Array.isArray(data)) return data;
  }catch{}
  // fallback: filtriraj klijentski
  const all = await listAll();
  return (all||[]).filter(x => (x?.DogadjajId ?? x?.dogadjajId) === eventId);
}

export async function create(dto){
  // dto: vidi KreirajLokacijuDto (TipLokacije je string) 
  // (:contentReference[oaicite:4]{index=4})
  const { data } = await api.post('lokacija/kreiraj', dto);
  return data;
}

export async function update(id, dto){
  // dto.Id = id; TipLokacije ostaje string (:contentReference[oaicite:5]{index=5})
  await api.put(`lokacija/azuriraj/${id}`, dto);
}

export async function remove(id){
  await api.delete(`lokacija/obrisi/${id}`);
}

/** Veza sa područjem (lokacija -> područje) */
export async function attachToArea(areaId, locationId){
  const area = await areasApi.getById(areaId);
  const curr = Array.isArray(area?.Lokacije) ? area.Lokacije.slice() : [];
  if (!curr.includes(locationId)) curr.push(locationId);
  await areasApi.update(areaId, { ...area, Id: areaId, Lokacije: curr });
  // Obavesti sve da se područja promene
  window.dispatchEvent(new CustomEvent('ne:areas:updated', { detail: { eventId: area?.DogadjajId || null, areaId, action:'attach' } }));
}

export async function detachFromArea(areaId, locationId){
  const area = await areasApi.getById(areaId);
  const curr = Array.isArray(area?.Lokacije) ? area.Lokacije.slice() : [];
  const next = curr.filter(x => x !== locationId);
  await areasApi.update(areaId, { ...area, Id: areaId, Lokacije: next });
  window.dispatchEvent(new CustomEvent('ne:areas:updated', { detail: { eventId: area?.DogadjajId || null, areaId, action:'detach' } }));
}

/** Dobavljači / Resursi (best-effort; backend nazivi mogu malo da variraju) */
export async function listSuppliers(){
  const { data } = await api.get('dobavljac/vrati-sve');
  return Array.isArray(data) ? data : [];
}

export async function listResourcesForSupplier(supplierId){
  try{
    const { data } = await api.get(`resurs/vrati-za-dobavljaca/${supplierId}`);
    return Array.isArray(data) ? data : [];
  }catch{
    // fallback: sve
    const all = await listAllResources();
    return (all||[]).filter(r => (r?.DobavljacId||r?.dobavljacId) === supplierId);
  }
}

export async function listAllResources(){
  const { data } = await api.get('resurs/vrati-sve');
  return Array.isArray(data) ? data : [];
}

export async function listResourcesBySupplierAndType(supplierId, type){
  // Ako backend nema poseban endpoint, filtriraj klijentski
  try{
    const all = await listResourcesForSupplier(supplierId);
    return (all||[]).filter(r => (r?.Tip||r?.tip) === type);
  }catch{
    return [];
  }
}

/** Rezervacija resursa (pokušaj); ako endpoint ne postoji, baciti grešku i UI će fallbackovati */
export async function reserveResource(resourceId, kolicina, ctx){
  try{
    const payload = { ResursId: resourceId, Kolicina: kolicina, Target: 'Lokacija', TargetId: ctx?.locationId, DogadjajId: ctx?.eventId };
    await api.post('resurs/rezervisi', payload);
  }catch(err){
    // re-throw; UI hvata i radi fallback
    throw err;
  }
}
