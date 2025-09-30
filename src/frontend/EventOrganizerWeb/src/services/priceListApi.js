// src/services/priceListApi.js
import api from './api';

const PRICE_LIST_BASE = 'cenovnici';
const ITEMS_BASE = 'cenovnik-stavke';

export function normalizeId(entity){
  return entity?.Id || entity?._id || entity?.id || null;
}

export async function listAll(){
  const { data } = await api.get(`${PRICE_LIST_BASE}/vrati-sve`);
  return Array.isArray(data) ? data : [];
}

export async function getById(id){
  if(!id) return null;
  const { data } = await api.get(`${PRICE_LIST_BASE}/vrati-po-id/${id}`);
  return data || null;
}

export async function createPriceList(dto){
  const payload = {
    Naziv: dto?.Naziv || dto?.naziv || '',
    LokacijaId: dto?.LokacijaId || dto?.lokacijaId || '',
    StavkeIds: Array.isArray(dto?.StavkeIds) ? dto.StavkeIds : [],
  };
  const { data } = await api.post(`${PRICE_LIST_BASE}/kreiraj`, payload);
  return data;
}

export async function updatePriceList(id, dto){
  const payload = {
    Id: id,
    Naziv: dto?.Naziv || dto?.naziv,
    LokacijaId: dto?.LokacijaId || dto?.lokacijaId,
    StavkeIds: Array.isArray(dto?.StavkeIds) ? dto.StavkeIds : dto?.stavkeIds,
  };
  const { data } = await api.put(`${PRICE_LIST_BASE}/azuriraj/${id}`, payload);
  return data;
}

export async function deletePriceList(id){
  const { data } = await api.delete(`${PRICE_LIST_BASE}/obrisi/${id}`);
  return data;
}

export async function addItemToPriceList(priceListId, itemId){
  if(!priceListId || !itemId) return;
  const { data } = await api.post(`${PRICE_LIST_BASE}/dodaj-stavku/${priceListId}/stavke/${itemId}`);
  return data;
}

export async function removeItemFromPriceList(priceListId, itemId){
  if(!priceListId || !itemId) return;
  const { data } = await api.delete(`${PRICE_LIST_BASE}/obrisi-stavku/${priceListId}/stavke/${itemId}`);
  return data;
}

export async function listItems(){
  const { data } = await api.get(`${ITEMS_BASE}/vrati-sve`);
  return Array.isArray(data) ? data : [];
}

export async function getItem(id){
  if(!id) return null;
  const { data } = await api.get(`${ITEMS_BASE}/vrati-po-id/${id}`);
  return data || null;
}

export async function createItem(dto){
  const payload = {
    Naziv: dto?.Naziv || dto?.naziv || '',
    Opis: dto?.Opis || dto?.opis || '',
    Cena: Number(dto?.Cena ?? dto?.cena ?? 0),
    Kolicina: Number(dto?.Kolicina ?? dto?.kolicina ?? 0),
    URLslike: dto?.URLslike || dto?.UrlSlika || dto?.urlSlika || '',
    CenovnikId: dto?.CenovnikId || dto?.cenovnikId || '',
  };
  const { data } = await api.post(`${ITEMS_BASE}/kreiraj`, payload);
  return data;
}

export async function updateItem(id, dto){
  const payload = {
    Id: id,
    Naziv: dto?.Naziv || dto?.naziv,
    Opis: dto?.Opis || dto?.opis,
    Cena: dto?.Cena ?? dto?.cena,
    Kolicina: dto?.Kolicina ?? dto?.kolicina,
    URLslike: dto?.URLslike || dto?.UrlSlika || dto?.urlSlika,
    CenovnikId: dto?.CenovnikId || dto?.cenovnikId,
  };
  const { data } = await api.put(`${ITEMS_BASE}/azuriraj/${id}`, payload);
  return data;
}

export async function deleteItem(id){
  const { data } = await api.delete(`${ITEMS_BASE}/obrisi/${id}`);
  return data;
}
