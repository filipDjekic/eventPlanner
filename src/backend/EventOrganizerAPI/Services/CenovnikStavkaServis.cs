using EventOrganizerAPI.DTOs.Cenovnik;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;

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
                Kolicina = dto.Kolicina,
                UrlSlika = dto.URLslike,
                CenovnikId = dto.CenovnikId
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
            var updateBuilder = Builders<CenovnikStavka>.Update;
            var updates = new List<UpdateDefinition<CenovnikStavka>>();

            if (!string.IsNullOrEmpty(dto.Naziv))
                updates.Add(updateBuilder.Set(s => s.Naziv, dto.Naziv));
            if (!string.IsNullOrEmpty(dto.Opis))
                updates.Add(updateBuilder.Set(s => s.Opis, dto.Opis));
            if (dto.Cena.HasValue)
                updates.Add(updateBuilder.Set(s => s.Cena, dto.Cena.Value));
            if (dto.Kolicina.HasValue)
                updates.Add(updateBuilder.Set(s => s.Kolicina, dto.Kolicina.Value));
            if (!string.IsNullOrEmpty(dto.URLslike))
                updates.Add(updateBuilder.Set(s => s.UrlSlika, dto.URLslike));
            if (!string.IsNullOrEmpty(dto.CenovnikId))
                updates.Add(updateBuilder.Set(s => s.CenovnikId, dto.CenovnikId));

            if (updates.Count == 0) return false;

            var update = updateBuilder.Combine(updates);

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
