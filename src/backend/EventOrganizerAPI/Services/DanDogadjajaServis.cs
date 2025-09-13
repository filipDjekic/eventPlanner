using EventOrganizerAPI.Models;
using EventOrganizerAPI.DTOs.DanDogadjaja;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class DanDogadjajaServis : IDanDogadjajaServis
    {
        private readonly IMongoCollection<DanDogadjaja> _dani;
        private readonly IMongoCollection<Dogadjaj> _dogadjaji;

        public DanDogadjajaServis(IMongoDatabase database)
        {
            _dani = database.GetCollection<DanDogadjaja>("Dani");
            _dogadjaji = database.GetCollection<Dogadjaj>("Dogadjaji");
        }

        public async Task<DanDogadjaja> Kreiraj(KreirajDanDogadjaja dto)
        {
            var dan = new DanDogadjaja
            {
                Naziv = dto.Naziv,
                Opis = dto.Opis,
                DatumOdrzavanja = dto.DatumOdrzavanja,
                Dogadjaj = dto.Dogadjaj,
                Podrucja = dto.Podrucja ?? new List<string>(),
                Aktivnosti = dto.Aktivnosti ?? new List<string>()
            };

            await _dani.InsertOneAsync(dan);
            var filter = Builders<Dogadjaj>.Filter.Eq(d => d.Id, dto.Dogadjaj);
            var update = Builders<Dogadjaj>.Update.Push(d => d.Dani, dan.Id);

            await _dogadjaji.UpdateOneAsync(filter, update);

            return dan;
        }

        public async Task<List<DanDogadjaja>> VratiSve() =>
            await _dani.Find(_ => true).ToListAsync();

        public async Task<DanDogadjaja> VratiPoId(string id) =>
            await _dani.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task Azuriraj(string id, IzmeniDanDogadjaja dto)
        {
            var update = Builders<DanDogadjaja>.Update.Combine();

            if (dto.Naziv != null)
                update = update.Set(d => d.Naziv, dto.Naziv);
            if (dto.Opis != null)
                update = update.Set(d => d.Opis, dto.Opis);
            if (dto.DatumOdrzavanja.HasValue)
                update = update.Set(d => d.DatumOdrzavanja, dto.DatumOdrzavanja.Value);
            if (dto.Podrucja != null)
                update = update.Set(d => d.Podrucja, dto.Podrucja);
            if (dto.Aktivnosti != null)
                update = update.Set(d => d.Aktivnosti, dto.Aktivnosti);

            await _dani.UpdateOneAsync(d => d.Id == id, update);
        }

        public async Task Obrisi(string id) =>
            await _dani.DeleteOneAsync(d => d.Id == id);
    }
}
