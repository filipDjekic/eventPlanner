using EventOrganizerAPI.DTOs.Cenovnik;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;

namespace EventOrganizerAPI.Services
{
    public class CenovnikStavkaServis : ICenovnikStavkaServis
    {
        private readonly IMongoCollection<CenovnikStavka> _stavkaCollection;

        public CenovnikStavkaServis(IMongoDatabase database)
        {
            _stavkaCollection = database.GetCollection<CenovnikStavka>("CenovnikStavke");
        }

        public async Task<CenovnikStavka> KreirajStavkuAsync(KreirajStavkuDto dto)
        {
            var novaStavka = new CenovnikStavka
            {
                Naziv = dto.Naziv,
                Opis = dto.Opis,
                Cena = dto.Cena,
                Kolicina = dto.Kolicina
            };
            await _stavkaCollection.InsertOneAsync(novaStavka);
            return novaStavka;
        }

        public async Task<List<CenovnikStavka>> VratiSveStavkeAsync()
        {
            return await _stavkaCollection.Find(_ => true).ToListAsync();
        }

        public async Task<CenovnikStavka> VratiStavkuPoIdAsync(string id)
        {
            return await _stavkaCollection.Find(s => s.Id == id).FirstOrDefaultAsync();
        }

        public async Task<bool> AzurirajStavkuAsync(AzurirajStavkuDto dto)
        {
            var filter = Builders<CenovnikStavka>.Filter.Eq(s => s.Id, dto.Id);
            var update = Builders<CenovnikStavka>.Update
                .Set(s => s.Naziv, dto.Naziv)
                .Set(s => s.Opis, dto.Opis)
                .Set(s => s.Cena, dto.Cena)
                .Set(s => s.Kolicina, dto.Kolicina);

            var result = await _stavkaCollection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> ObrisiStavkuAsync(string id)
        {
            var result = await _stavkaCollection.DeleteOneAsync(s => s.Id == id);
            return result.DeletedCount > 0;
        }
    }
}
