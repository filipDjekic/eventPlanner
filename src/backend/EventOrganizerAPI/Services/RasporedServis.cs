using EventOrganizerAPI.Models;
using EventOrganizerAPI.DTOs.RasporedAktivnosti;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class RasporedServis : IRasporedServis
    {
        private readonly IMongoCollection<Raspored> _rasporedi;
        private readonly IMongoCollection<Dogadjaj> _dogadjaji;
        private readonly IMongoCollection<Aktivnost> _aktivnosti;

        public RasporedServis(IMongoDatabase db)
        {
            _rasporedi = db.GetCollection<Raspored>("Rasporedi");
            _dogadjaji = db.GetCollection<Dogadjaj>("Dogadjaji");
            _aktivnosti = db.GetCollection<Aktivnost>("Aktivnosti");
        }

        public async Task<Raspored> Kreiraj(KreirajRasporedDto dto)
        {
            var r = new Raspored
            {
                Naziv = dto.Naziv,
                Opis = dto.Opis,
                Lokacija = dto.Lokacija,
                Dan = dto.Dan,
                DogadjajId = dto.DogadjajId,
                Aktivnosti = new List<string>()
            };

            await _rasporedi.InsertOneAsync(r);

            if (!string.IsNullOrWhiteSpace(dto.DogadjajId))
            {
                var filter = Builders<Dogadjaj>.Filter.Eq(x => x.Id, dto.DogadjajId);
                var update = Builders<Dogadjaj>.Update.AddToSet(x => x.Rasporedi, r.Id);
                await _dogadjaji.UpdateOneAsync(filter, update);
            }

            return r;
        }

        public async Task<List<Raspored>> VratiSve() =>
            await _rasporedi.Find(_ => true).ToListAsync();

        public async Task<List<Raspored>> VratiZaDogadjaj(string dogadjajId)
        {
            if (string.IsNullOrWhiteSpace(dogadjajId))
            {
                return new List<Raspored>();
            }

            return await _rasporedi
                .Find(x => x.DogadjajId == dogadjajId)
                .ToListAsync();
        }

        public async Task<Raspored> VratiPoId(string id) =>
            await _rasporedi.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task Azuriraj(AzurirajRasporedDto dto)
        {
            var existing = await _rasporedi.Find(x => x.Id == dto.Id).FirstOrDefaultAsync();
            if (existing == null)
            {
                return;
            }

            var updateBuilder = Builders<Raspored>.Update;
            var updates = new List<UpdateDefinition<Raspored>>();

            if (!string.IsNullOrEmpty(dto.Naziv))
                updates.Add(updateBuilder.Set(x => x.Naziv, dto.Naziv));
            if (!string.IsNullOrEmpty(dto.Opis))
                updates.Add(updateBuilder.Set(x => x.Opis, dto.Opis));
            if (!string.IsNullOrEmpty(dto.Lokacija))
                updates.Add(updateBuilder.Set(x => x.Lokacija, dto.Lokacija));
            if (!string.IsNullOrEmpty(dto.Dan))
                updates.Add(updateBuilder.Set(x => x.Dan, dto.Dan));
            if (!string.IsNullOrEmpty(dto.DogadjajId))
                updates.Add(updateBuilder.Set(x => x.DogadjajId, dto.DogadjajId));

            if (updates.Count == 0) return;

            var combined = updateBuilder.Combine(updates);
            await _rasporedi.UpdateOneAsync(x => x.Id == dto.Id, combined);

            if (dto.DogadjajId != null && dto.DogadjajId != existing.DogadjajId)
            {
                if (!string.IsNullOrEmpty(existing.DogadjajId))
                {
                    var removeFilter = Builders<Dogadjaj>.Filter.Eq(x => x.Id, existing.DogadjajId);
                    var removeUpdate = Builders<Dogadjaj>.Update.Pull(x => x.Rasporedi, existing.Id);
                    await _dogadjaji.UpdateOneAsync(removeFilter, removeUpdate);
                }

                if (!string.IsNullOrWhiteSpace(dto.DogadjajId))
                {
                    var addFilter = Builders<Dogadjaj>.Filter.Eq(x => x.Id, dto.DogadjajId);
                    var addUpdate = Builders<Dogadjaj>.Update.AddToSet(x => x.Rasporedi, existing.Id);
                    await _dogadjaji.UpdateOneAsync(addFilter, addUpdate);
                }
            }
        }

        public async Task Obrisi(string id)
        {
            var raspored = await _rasporedi.Find(x => x.Id == id).FirstOrDefaultAsync();
            if (raspored == null)
            {
                return;
            }

            await _rasporedi.DeleteOneAsync(x => x.Id == id);

            if (!string.IsNullOrEmpty(raspored.DogadjajId))
            {
                var filter = Builders<Dogadjaj>.Filter.Eq(x => x.Id, raspored.DogadjajId);
                var update = Builders<Dogadjaj>.Update.Pull(x => x.Rasporedi, raspored.Id);
                await _dogadjaji.UpdateOneAsync(filter, update);
            }

            if (raspored.Aktivnosti != null && raspored.Aktivnosti.Count > 0)
            {
                var filter = Builders<Aktivnost>.Filter.In(x => x.Id, raspored.Aktivnosti);
                var update = Builders<Aktivnost>.Update.Unset(x => x.RasporedId);
                await _aktivnosti.UpdateManyAsync(filter, update);
            }
        }
    }
}
