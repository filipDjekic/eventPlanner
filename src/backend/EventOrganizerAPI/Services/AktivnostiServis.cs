using EventOrganizerAPI.Models;
using EventOrganizerAPI.DTOs.RasporedAktivnosti;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class AktivnostiServis : IAktivnostiServis
    {
        private readonly IMongoCollection<Aktivnost> _aktivnosti;
        private readonly IMongoCollection<DanDogadjaja> _dani;
        private readonly IMongoCollection<Raspored> _rasporedi;

        public AktivnostiServis(IMongoDatabase db)
        {
            _aktivnosti = db.GetCollection<Aktivnost>("Aktivnosti");
            _dani = db.GetCollection<DanDogadjaja>("Dani");
            _rasporedi = db.GetCollection<Raspored>("Rasporedi");
        }

        public async Task<Aktivnost> Kreiraj(KreirajAktivnostDto dto)
        {
            var a = new Aktivnost
            {
                Naziv = dto.Naziv,
                Opis = dto.Opis,
                DatumVremePocetka = dto.DatumVremePocetka,
                DatumVremeKraja = dto.DatumVremeKraja,
                Lokacija = dto.Lokacija,
                Dan = dto.Dan,
                Dogadjaj = dto.Dogadjaj,
                Tip = dto.Tip,
                RasporedId = dto.RasporedId
            };

            await _aktivnosti.InsertOneAsync(a);

            var filter = Builders<DanDogadjaja>.Filter.Eq(d => d.Id, dto.Dan);
            var update = Builders<DanDogadjaja>.Update.Push(d=> d.Aktivnosti,a.Id);

            await _dani.UpdateOneAsync(filter, update);

            if (!string.IsNullOrWhiteSpace(dto.RasporedId))
            {
                var rasporedFilter = Builders<Raspored>.Filter.Eq(r => r.Id, dto.RasporedId);
                var rasporedUpdate = Builders<Raspored>.Update.AddToSet(r => r.Aktivnosti, a.Id);
                await _rasporedi.UpdateOneAsync(rasporedFilter, rasporedUpdate);
            }

            return a;
        }

        public async Task<List<Aktivnost>> VratiSve() =>
            await _aktivnosti.Find(_ => true).ToListAsync();

        public async Task<List<Aktivnost>> VratiZaDogadjaj(string dogadjajId)
        {
            if (string.IsNullOrWhiteSpace(dogadjajId))
            {
                return new List<Aktivnost>();
            }

            return await _aktivnosti
                .Find(x => x.Dogadjaj == dogadjajId)
                .ToListAsync();
        }

        public async Task<Aktivnost> VratiPoId(string id) =>
            await _aktivnosti.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task Azuriraj(AzurirajAktivnostDto dto)
        {
            var existing = await _aktivnosti.Find(x => x.Id == dto.Id).FirstOrDefaultAsync();
            if (existing == null)
            {
                return;
            }

            var updates = new List<UpdateDefinition<Aktivnost>>();

            if (dto.Naziv != null)
                updates.Add(Builders<Aktivnost>.Update.Set(x => x.Naziv, dto.Naziv));
            if (dto.Opis != null)
                updates.Add(Builders<Aktivnost>.Update.Set(x => x.Opis, dto.Opis));
            if (dto.DatumVremePocetka.HasValue)
                updates.Add(Builders<Aktivnost>.Update.Set(x => x.DatumVremePocetka, dto.DatumVremePocetka.Value));
            if (dto.DatumVremeKraja.HasValue)
                updates.Add(Builders<Aktivnost>.Update.Set(x => x.DatumVremeKraja, dto.DatumVremeKraja.Value));
            if (dto.Lokacija != null)
                updates.Add(Builders<Aktivnost>.Update.Set(x => x.Lokacija, dto.Lokacija));
            if (dto.Dan != null)
            {
                if (string.IsNullOrWhiteSpace(dto.Dan))
                    updates.Add(Builders<Aktivnost>.Update.Unset(x => x.Dan));
                else
                    updates.Add(Builders<Aktivnost>.Update.Set(x => x.Dan, dto.Dan));
            }
            if (dto.Dogadjaj != null)
                updates.Add(Builders<Aktivnost>.Update.Set(x => x.Dogadjaj, dto.Dogadjaj));
            if (dto.Tip != null)
                updates.Add(Builders<Aktivnost>.Update.Set(x => x.Tip, dto.Tip));
            if (dto.RasporedId != null)
            {
                if (string.IsNullOrWhiteSpace(dto.RasporedId))
                    updates.Add(Builders<Aktivnost>.Update.Unset(x => x.RasporedId));
                else
                    updates.Add(Builders<Aktivnost>.Update.Set(x => x.RasporedId, dto.RasporedId));
            }

            if (updates.Count > 0)
            {
                var combined = Builders<Aktivnost>.Update.Combine(updates);
                await _aktivnosti.UpdateOneAsync(x => x.Id == dto.Id, combined);
            }

            if (dto.Dan != null && dto.Dan != existing.Dan)
            {
                if (!string.IsNullOrEmpty(existing.Dan))
                {
                    var oldDayFilter = Builders<DanDogadjaja>.Filter.Eq(x => x.Id, existing.Dan);
                    var oldDayUpdate = Builders<DanDogadjaja>.Update.Pull(x => x.Aktivnosti, existing.Id);
                    await _dani.UpdateOneAsync(oldDayFilter, oldDayUpdate);
                }

                if (!string.IsNullOrWhiteSpace(dto.Dan))
                {
                    var newDayFilter = Builders<DanDogadjaja>.Filter.Eq(x => x.Id, dto.Dan);
                    var newDayUpdate = Builders<DanDogadjaja>.Update.AddToSet(x => x.Aktivnosti, existing.Id);
                    await _dani.UpdateOneAsync(newDayFilter, newDayUpdate);
                }
            }

            if (dto.RasporedId != null && dto.RasporedId != existing.RasporedId)
            {
                if (!string.IsNullOrEmpty(existing.RasporedId))
                {
                    var oldScheduleFilter = Builders<Raspored>.Filter.Eq(x => x.Id, existing.RasporedId);
                    var oldScheduleUpdate = Builders<Raspored>.Update.Pull(x => x.Aktivnosti, existing.Id);
                    await _rasporedi.UpdateOneAsync(oldScheduleFilter, oldScheduleUpdate);
                }

                if (!string.IsNullOrWhiteSpace(dto.RasporedId))
                {
                    var newScheduleFilter = Builders<Raspored>.Filter.Eq(x => x.Id, dto.RasporedId);
                    var newScheduleUpdate = Builders<Raspored>.Update.AddToSet(x => x.Aktivnosti, existing.Id);
                    await _rasporedi.UpdateOneAsync(newScheduleFilter, newScheduleUpdate);
                }
            }
        }

        public async Task Obrisi(string id)
        {
            var existing = await _aktivnosti.Find(x => x.Id == id).FirstOrDefaultAsync();

            await _aktivnosti.DeleteOneAsync(x => x.Id == id);

            if (existing == null)
            {
                return;
            }

            if (!string.IsNullOrEmpty(existing.Dan))
            {
                var dayFilter = Builders<DanDogadjaja>.Filter.Eq(x => x.Id, existing.Dan);
                var dayUpdate = Builders<DanDogadjaja>.Update.Pull(x => x.Aktivnosti, existing.Id);
                await _dani.UpdateOneAsync(dayFilter, dayUpdate);
            }

            if (!string.IsNullOrEmpty(existing.RasporedId))
            {
                var scheduleFilter = Builders<Raspored>.Filter.Eq(x => x.Id, existing.RasporedId);
                var scheduleUpdate = Builders<Raspored>.Update.Pull(x => x.Aktivnosti, existing.Id);
                await _rasporedi.UpdateOneAsync(scheduleFilter, scheduleUpdate);
            }
        }
    }
}
