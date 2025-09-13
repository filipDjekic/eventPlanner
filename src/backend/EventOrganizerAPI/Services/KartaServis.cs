using EventOrganizerAPI.Dtos.Karta;
using EventOrganizerAPI.DTOs.Karta;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Models.Enums;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class KartaServis : IKartaServis
    {
        private readonly IMongoCollection<Karta> _karte;
        private readonly IMongoCollection<Dogadjaj> _dogadjaji;
        private readonly IMongoCollection<KupljenaKarta> _kupljeneKarte;
        public KartaServis(IMongoDatabase db)
        {
            _karte = db.GetCollection<Karta>("Karte");
            _dogadjaji = db.GetCollection<Dogadjaj>("Dogadjaji");
            _kupljeneKarte = db.GetCollection<KupljenaKarta>("KupljeneKarte");
        }

        public async Task<Karta> KreirajKartu(KreirajKartuDto dto)
        {
            var karta = new Karta
            {
                Naziv = dto.Naziv,
                Opis = dto.Opis,
                HEXboja = dto.HEXboja,
                Tip = (TipKarte)System.Enum.Parse(typeof(TipKarte), dto.Tip),
                URLslike = dto.URLslike,
                Cena = dto.Cena,
                BrojKarata = dto.BrojKarata,
                DogadjajId = dto.DogadjajId,
                DanId = dto.DanId
            };

            await _karte.InsertOneAsync(karta);

            var filter = Builders<Dogadjaj>.Filter.Eq(d => d.Id, dto.DogadjajId);
            var update = Builders<Dogadjaj>.Update.Push(d => d.Karte, karta.Id);

            await _dogadjaji.UpdateOneAsync(filter, update);

            return karta;
        }

        public async Task<Karta> VratiBesplatnuKartu(string dogadjajId)
        {
            var karte = await _karte.Find(k => k.DogadjajId == dogadjajId).ToListAsync();

            return karte.Count == 0
                ? new Karta { Naziv = "Besplatna", Tip = TipKarte.Besplatna, Cena = 0, BrojKarata = int.MaxValue }
                : karte[0];
        }
        public async Task<KupljenaKarta> VratiKupljenuKartuPoId(string id)
        {
            var filter = Builders<KupljenaKarta>.Filter.Eq(k => k.Id, id);
            var karta = await _kupljeneKarte.Find(filter).FirstOrDefaultAsync();
            return karta;
        }
        public async Task<List<PrikazKartaDto>> VratiSveKarte()
        {
            var karte = await _karte.Find(_ => true).ToListAsync();

            var dto = karte.Select(k => new PrikazKartaDto
            {
                Id = k.Id,
                Naziv = k.Naziv,
                Opis = k.Opis,
                HEXboja = k.HEXboja,
                Tip = k.Tip.ToString(),
                URLslike = k.URLslike,
                Cena = k.Cena,
                BrojKarata = k.BrojKarata,
                DogadjajId = k.DogadjajId,
                DanId = k.DanId
            }).ToList();

            return dto;
        }

        public async Task<Karta> VratiKartuPoId(string id) =>
            await _karte.Find(k => k.Id == id).FirstOrDefaultAsync();

        public async Task AzurirajKartu(AzurirajKartuDto dto)
        {
            var updates = new List<UpdateDefinition<Karta>>();

            if (dto.Naziv != null) updates.Add(Builders<Karta>.Update.Set(k => k.Naziv, dto.Naziv));
            if (dto.Opis != null) updates.Add(Builders<Karta>.Update.Set(k => k.Opis, dto.Opis));
            if (dto.Cena.HasValue) updates.Add(Builders<Karta>.Update.Set(k => k.Cena, dto.Cena));
            if (dto.BrojKarata.HasValue) updates.Add(Builders<Karta>.Update.Set(k => k.BrojKarata, dto.BrojKarata));
            if (!string.IsNullOrEmpty(dto.HEXboja)) updates.Add(Builders<Karta>.Update.Set(k => k.HEXboja, dto.HEXboja));

            if (updates.Count == 0) return;

            var update = Builders<Karta>.Update.Combine(updates);
            await _karte.UpdateOneAsync(k => k.Id == dto.Id, update);
        }


        public async Task ObrisiKartu(string id) =>
            await _karte.DeleteOneAsync(k => k.Id == id);

        public async Task<KupljenaKarta> KreirajKupljenuKartuAsync(string kartaId, string korisnikId)
        {
            var kupljena = new KupljenaKarta
            {
                KartaId = kartaId,
                KorisnikId = korisnikId,
                DatumVremeKupovine = DateTime.UtcNow,
                Validna = true
            };
            await _kupljeneKarte.InsertOneAsync(kupljena);
            return kupljena;
        }
        public async Task OznaciKartuIskoriscenom(string id)
        {
            var filter = Builders<KupljenaKarta>.Filter.Eq(k => k.Id, id);
            var update = Builders<KupljenaKarta>.Update.Set(k => k.Validna, false);
            await _kupljeneKarte.UpdateOneAsync(filter, update);
        }
    }
}