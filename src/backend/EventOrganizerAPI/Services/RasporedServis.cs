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
            var update = Builders<Raspored>.Update.Combine();

            if (dto.Naziv != null)
                update = update.Set(x => x.Naziv, dto.Naziv);
            if (dto.Opis != null)
                update = update.Set(x => x.Opis, dto.Opis);
            if (dto.Lokacija != null)
                update = update.Set(x => x.Lokacija, dto.Lokacija);
            if (dto.Dan != null)
                update = update.Set(x => x.Dan, dto.Dan);

            await _rasporedi.UpdateOneAsync(x => x.Id == dto.Id, update);
        }

        public async Task Obrisi(string id) =>
            await _rasporedi.DeleteOneAsync(x => x.Id == id);
    }
}
