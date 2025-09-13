using EventOrganizerAPI.DTOs;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;

namespace EventOrganizerAPI.Services
{
    public class TransakcijaServis : ITransakcijaServis
    {
        private readonly IMongoCollection<KreditKartica> _kartice;
        private readonly IMongoCollection<Transakcija> _transakcije;

        public TransakcijaServis(IMongoDatabase baza)
        {
            _kartice = baza.GetCollection<KreditKartica>("KreditKartica");
            _transakcije = baza.GetCollection<Transakcija>("Transakcija");
        }

        public async Task<StanjeKarticeDto> PrikaziStanjeAsync(string karticaId)
        {
            var kartica = await _kartice.Find(k => k.Id == karticaId).FirstOrDefaultAsync();

            if (kartica == null) return null;

            return new StanjeKarticeDto
            {
                KarticaId = kartica.Id,
                Stanje = kartica.Stanje
            };
        }

        public async Task<Transakcija> KreirajTransakcijuAsync(KreirajTransakcijaDto dto)
        {
            var kartica = await _kartice.Find(k => k.Id == dto.KarticaId).FirstOrDefaultAsync();

            if (kartica == null) return null;

            kartica.Stanje += dto.Iznos;

            var update = Builders<KreditKartica>.Update.Set(k => k.Stanje, kartica.Stanje);
            await _kartice.UpdateOneAsync(k => k.Id == kartica.Id, update);

            var transakcija = new Transakcija
            {
                KarticaId = kartica.Id,
                Iznos = dto.Iznos,
                Opis = dto.Opis,
                Vreme = DateTime.UtcNow
            };

            await _transakcije.InsertOneAsync(transakcija);

            return transakcija;
        }
    }
}
