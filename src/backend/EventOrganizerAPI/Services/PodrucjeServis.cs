using EventOrganizerAPI.Models;
using EventOrganizerAPI.DTOs;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;
using EventOrganizerAPI.DTOs.PodrucjeLokacija;
using EventOrganizerAPI.Services.Interfaces;

namespace EventOrganizerAPI.Services
{
    public class PodrucjeServis : IPodrucjeServis
    {
        private readonly IMongoCollection<Podrucje> _podrucjeCollection;
        private readonly IMongoCollection<DanDogadjaja> _danCollection;

        public PodrucjeServis(IMongoDatabase database)
        {
            _podrucjeCollection = database.GetCollection<Podrucje>("Podrucja");
            _danCollection = database.GetCollection<DanDogadjaja>("Dani");
        }

        public async Task<Podrucje> KreirajPodrucjeAsync(PodrucjeKreirajDto dto)
        {
            var novoPodrucje = new Podrucje
            {
                DogadjajId = dto.DogadjajId,
                DanId = dto.DanId,
                Lokacije = dto.Lokacije ?? new List<string>(),
                Koordinate = dto.Koordinate?.ConvertAll(k => new List<double> { k[0], k[1] })
                             ?? new List<List<double>>(),
                Naziv = dto.Naziv,
                HEXboja = dto.HEXboja
            };

            await _podrucjeCollection.InsertOneAsync(novoPodrucje);

            var filter = Builders<DanDogadjaja>.Filter.Eq(d => d.Id, novoPodrucje.DanId);
            var update = Builders<DanDogadjaja>.Update.Push(d => d.Podrucja, novoPodrucje.Id);

            await _danCollection.UpdateOneAsync(filter, update);

            return novoPodrucje;
        }

        public async Task<List<PrikazPodrucjeDto>> VratiSvaPodrucjaAsync()
        {
            var podrucja = await _podrucjeCollection.Find(_ => true).ToListAsync();
            return podrucja.Select(p => new PrikazPodrucjeDto
            {
                Id = p.Id,
                DogadjajId = p.DogadjajId,
                DanId = p.DanId,
                Naziv = p.Naziv,
                Lokacije = p.Lokacije,
                Koordinate = p.Koordinate,
                HEXboja = p.HEXboja
            }).ToList();
        }

        public async Task<PrikazPodrucjeDto> VratiPodrucjePoIdAsync(string id)
        {
            var p = await _podrucjeCollection.Find(p => p.Id == id).FirstOrDefaultAsync();
            if (p == null) return null;

            return new PrikazPodrucjeDto
            {
                Id = p.Id,
                DogadjajId = p.DogadjajId,
                DanId = p.DanId,
                Naziv = p.Naziv,
                Lokacije = p.Lokacije,
                Koordinate = p.Koordinate,
                HEXboja = p.HEXboja
            };
        }


        public async Task<bool> AzurirajPodrucjeAsync(PodrucjeAzurirajDto dto)
        {
            var update = Builders<Podrucje>.Update
                .Set(p => p.DogadjajId, dto.DogadjajId)
                .Set(p => p.Lokacije, dto.Lokacije)
                .Set(p => p.Koordinate, dto.Koordinate?.ConvertAll(k => new List<double> { k[0], k[1] }))
                .Set(p => p.Naziv, dto.Naziv)
                .Set(p => p.HEXboja, dto.HEXboja)
                .Set(p => p.DanId, dto.DanId);


            var result = await _podrucjeCollection.UpdateOneAsync(
                p => p.Id == dto.Id,
                update
            );

            return result.ModifiedCount > 0;
        }

        public async Task<bool> ObrisiPodrucjeAsync(string id)
        {
            var result = await _podrucjeCollection.DeleteOneAsync(p => p.Id == id);
            return result.DeletedCount > 0;
        }
    }
}
