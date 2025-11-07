// src/services/locationsApi.js
// Povezano sa backendom: api/lokacije/* (ASP.NET)
import api from './api';

export function normalizeId(x) {
  return x?.Id || x?._id || x?.id || null;
}

export async function listAll() {
  const { data } = await api.get('lokacije/vrati-sve');
  return Array.isArray(data) ? data : [];
}

export async function listByEvent(eventId) {
  const { data } = await api.get(`lokacije/dogadjaj/${eventId}`);
  return Array.isArray(data) ? data : [];
}

// Kreiranje lokacije — DTO: KreirajLokacijuDto
// { DogadjajId, Naziv, Opis, XKoordinata, YKoordinata, URLSlikeMape, CenovnikId, PodrucjeId, HEXboja, TipLokacije, Resursi }
export async function create(dto) {
  const payload = {
    DogadjajId: dto.DogadjajId,
    Naziv: dto.Naziv,
    Opis: dto.Opis,
    XKoordinata: Number(dto.XKoordinata),
    YKoordinata: Number(dto.YKoordinata),
    URLSlikeMape: dto.URLSlikeMape ?? '',
    CenovnikId: dto.CenovnikId ?? null,
    PodrucjeId: dto.PodrucjeId,        // **bitno**: PodrucjeId (ne "Podrucje")
    HEXboja: dto.HEXboja,
    TipLokacije: String(dto.TipLokacije || ''),
    Resursi: Array.isArray(dto.Resursi) ? dto.Resursi : [],
  };
  const { data } = await api.post('lokacije/kreiraj', payload);
  return data;
}

// Ažuriranje — DTO: AzurirajLokacijuDto
export async function update(id, dto) {
  const payload = {
    Id: id,
    DogadjajId: dto.DogadjajId,
    Naziv: dto.Naziv,
    Opis: dto.Opis,
    XKoordinata: dto.XKoordinata == null ? undefined : Number(dto.XKoordinata),
    YKoordinata: dto.YKoordinata == null ? undefined : Number(dto.YKoordinata),
    URLSlikeMape: dto.URLSlikeMape,
    CenovnikId: dto.CenovnikId,
    PodrucjeId: dto.PodrucjeId,
    HEXboja: dto.HEXboja,
    TipLokacije: dto.TipLokacije == null ? undefined : String(dto.TipLokacije),
    Resursi: Array.isArray(dto.Resursi) ? dto.Resursi : undefined,
  };
  const { data } = await api.put(`lokacije/azuriraj/${id}`, payload);
  return data;
}

export async function remove(id) {
  return api.delete(`lokacije/obrisi/${id}`);
}
