using EventOrganizerAPI.Models;
using EventOrganizerAPI.DTOs.RasporedAktivnosti;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class RasporedServis : IRasporedServis
    {
        private readonly IMongoCollection<Raspored> _rasporedi;

        public RasporedServis(IMongoDatabase db)
        {
            _rasporedi = db.GetCollection<Raspored>("Rasporedi");
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
            return r;
        }

        public async Task<List<Raspored>> VratiSve() =>
            await _rasporedi.Find(_ => true).ToListAsync();

        public async Task<Raspored> VratiPoId(string id) =>
            await _rasporedi.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task Azuriraj(AzurirajRasporedDto dto)
        {
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
        }

        public async Task Obrisi(string id) =>
            await _rasporedi.DeleteOneAsync(x => x.Id == id);
    }
}
