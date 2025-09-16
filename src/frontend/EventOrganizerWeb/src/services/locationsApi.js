// src/services/locationsApi.js
import api from './api';
import * as areasApi from './areasApi';

/** Lokacije */
export async function getById(id){
  const { data } = await api.get(`lokacije/vrati-po-id/${id}`);
  return data;
}

export async function listAll(){
  const { data } = await api.get('lokacije/vrati-sve');
  return Array.isArray(data) ? data : [];
}

export async function listForEvent(eventId){
  // ispravna ruta na backendu: GET api/lokacije/dogadjaj/{dogadjajId}
  try{
    const { data } = await api.get(`lokacije/dogadjaj/${eventId}`);
    return Array.isArray(data) ? data : [];
  }catch{
    // fallback: klijentski filter
    const all = await listAll();
    return (all||[]).filter(x => (x?.DogadjajId ?? x?.dogadjajId) === eventId);
  }
}

export async function create(dto){
  // TipLokacije je STRING
  const { data } = await api.post('lokacije/kreiraj', dto);
  return data;
}

export async function update(id, dto){
  // Backend nema {id} u ruti; Id mora biti u telu
  await api.put(`lokacije/azuriraj/${id}`, { ...dto, Id: id });
}

export async function remove(id){
  await api.delete(`lokacije/obrisi/${id}`);
}

/** Veza sa područjem (lokacija -> područje) */
export async function attachToArea(areaId, locationId){
  const area = await areasApi.getById(areaId);
  const curr = Array.isArray(area?.Lokacije) ? area.Lokacije.slice() : [];
  if (!curr.includes(locationId)) curr.push(locationId);
  await areasApi.update(areaId, { ...area, Id: areaId, Lokacije: curr });
  window.dispatchEvent(new CustomEvent('ne:areas:updated', { detail: { eventId: area?.DogadjajId || null, areaId, action:'attach' } }));
}

export async function detachFromArea(areaId, locationId){
  const area = await areasApi.getById(areaId);
  const curr = Array.isArray(area?.Lokacije) ? area.Lokacije.slice() : [];
  const next = curr.filter(x => x !== locationId);
  await areasApi.update(areaId, { ...area, Id: areaId, Lokacije: next });
  window.dispatchEvent(new CustomEvent('ne:areas:updated', { detail: { eventId: area?.DogadjajId || null, areaId, action:'detach' } }));
}

/** Dobavljači / Resursi */
export async function listSuppliers(){
  const { data } = await api.get('dobavljaci/vrati-sve');
  return Array.isArray(data) ? data : [];
}

// Backend nema rutu "za dobavljača"; filtriramo lokalno
export async function listAllResources(){
  const { data } = await api.get('resursi/vrati-sve'); // <-- plural
  return Array.isArray(data) ? data : [];
}

export async function listResourcesForSupplier(supplierId){
  const all = await listAllResources();
  const sid = String(supplierId ?? '');
  return (all || []).filter(r => {
    const owner = r?.Dobavljac ?? r?.dobavljac ?? r?.DobavljacId ?? r?.dobavljacId;
    return String(owner ?? '') === sid;
  });
}

export async function listResourcesBySupplierAndType(supplierId, type){
  const list = await listResourcesForSupplier(supplierId);
  const t = String(type ?? '');
  return (list || []).filter(r => String(r?.Tip ?? r?.tip ?? '') === t);
}


/** Rezervacija resursa */
export async function reserveResource(resourceId, kolicina, ctx){
  const payload = { ResursId: resourceId, DogadjajId: ctx?.eventId, Kolicina: kolicina };
  await api.post('resursi/rezervisi', payload); // <-- plural + pravi DTO
}
