using System.Collections.Generic;
using EventOrganizerAPI.DTOs;
using EventOrganizerAPI.DTOs.PodrucjeLokacija;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;

namespace EventOrganizerAPI.Services
{
    public class LokacijaServis : ILokacijaServis
    {
        private readonly IMongoCollection<Lokacija> _lokacijaCollection;

        public LokacijaServis(IMongoDatabase database)
        {
            _lokacijaCollection = database.GetCollection<Lokacija>("Lokacije");
        }

        public async Task<Lokacija> KreirajLokacijuAsync(KreirajLokacijuDto dto)
        {
            var novaLokacija = new Lokacija
            {
                Id = MongoDB.Bson.ObjectId.GenerateNewId().ToString(),
                DogadjajId = dto.DogadjajId,
                Naziv = dto.Naziv,
                Opis = dto.Opis,
                XKoordinata = dto.XKoordinata,
                YKoordinata = dto.YKoordinata,
                URLSlikeMape = dto.URLSlikeMape,
                Cenovnik = dto.CenovnikId,
                Podrucje = dto.PodrucjeId,
                HEXboja = dto.HEXboja,
                TipLokacije = dto.TipLokacije,
                Resursi = dto.Resursi ?? new List<string>()
            };

            await _lokacijaCollection.InsertOneAsync(novaLokacija);
            return novaLokacija;
        }

        public async Task<List<PrikazLokacijaDto>> VratiSveLokacijeAsync()
        {
            var lokacije = await _lokacijaCollection.Find(_ => true).ToListAsync();
            return lokacije.Select(l => new PrikazLokacijaDto
            {
                Id = l.Id,
                DogadjajId = l.DogadjajId,
                Naziv = l.Naziv,
                Opis = l.Opis,
                XKoordinata = l.XKoordinata,
                YKoordinata = l.YKoordinata,
                URLSlikeMape = l.URLSlikeMape,
                Cenovnik = l.Cenovnik,
                Podrucje = l.Podrucje,
                HEXboja = l.HEXboja,
                TipLokacije = l.TipLokacije,
                Resursi = l.Resursi ?? new List<string>()
            }).ToList();
        }

        public async Task<PrikazLokacijaDto> VratiLokacijuPoIdAsync(string id)
        {
            var lokacija = await _lokacijaCollection.Find(l => l.Id == id).FirstOrDefaultAsync();
            if (lokacija == null) return null;

            return new PrikazLokacijaDto
            {
                Id = lokacija.Id,
                DogadjajId = lokacija.DogadjajId,
                Naziv = lokacija.Naziv,
                Opis = lokacija.Opis,
                XKoordinata = lokacija.XKoordinata,
                YKoordinata = lokacija.YKoordinata,
                URLSlikeMape = lokacija.URLSlikeMape,
                Cenovnik = lokacija.Cenovnik,
                Podrucje = lokacija.Podrucje,
                HEXboja = lokacija.HEXboja,
                TipLokacije = lokacija.TipLokacije,
                Resursi = lokacija.Resursi ?? new List<string>()
            };
        }

        public async Task<bool> AzurirajLokacijuAsync(AzurirajLokacijuDto dto)
        {
            var filter = Builders<Lokacija>.Filter.Eq(l => l.Id, dto.Id);

            var update = Builders<Lokacija>.Update
                .Set(l => l.DogadjajId, dto.DogadjajId)
                .Set(l => l.Naziv, dto.Naziv)
                .Set(l => l.Opis, dto.Opis)
                .Set(l => l.XKoordinata, dto.XKoordinata)
                .Set(l => l.YKoordinata, dto.YKoordinata)
                .Set(l => l.URLSlikeMape, dto.URLSlikeMape)
                .Set(l => l.Cenovnik, dto.CenovnikId)
                .Set(l => l.Podrucje, dto.PodrucjeId);

            if (dto.Resursi != null)
            {
                update = update.Set(l => l.Resursi, dto.Resursi);
            }

            var result = await _lokacijaCollection.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> ObrisiLokacijuAsync(string id)
        {
            var result = await _lokacijaCollection.DeleteOneAsync(l => l.Id == id);
            return result.DeletedCount > 0;
        }

        public async Task<List<Lokacija>> VratiLokacijeZaDogadjajAsync(string dogadjajId)
        {
            return await _lokacijaCollection.Find(l => l.DogadjajId == dogadjajId).ToListAsync();
        }
    }
}
