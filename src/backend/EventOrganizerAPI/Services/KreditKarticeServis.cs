using EventOrganizerAPI.DTOs;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;

namespace EventOrganizerAPI.Services
{
    public class KarticaServis : IKarticaServis
    {
        private readonly IMongoCollection<KreditKartica> _kartice;

        public KarticaServis(IMongoDatabase baza)
        {
            _kartice = baza.GetCollection<KreditKartica>("KreditKartica");
        }

        public async Task<KreditKartica> KreirajAsync(KreirajKarticaDto dto)
        {
            var nova = new KreditKartica
            {
                KorisnikId = dto.KorisnikId,
                BrojKartice = dto.BrojKartice,
                ImeVlasnika = dto.ImeVlasnika,
                DatumIsteka = dto.DatumIsteka,
                Stanje = 0
            };

            await _kartice.InsertOneAsync(nova);
            return nova;
        }

        public async Task<decimal> VratiStanjeAsync(string karticaId)
        {
            var kartica = await _kartice.Find(k => k.Id == karticaId).FirstOrDefaultAsync();
            if (kartica == null) return 0;

            return kartica.Stanje;
        }

        public async Task<bool> PromeniStanjeAsync(PromenaStanjaKarticeDto dto)
        {
            var kartica = await _kartice.Find(k => k.Id == dto.KarticaId).FirstOrDefaultAsync();
            if (kartica == null) return false;

            var novoStanje = kartica.Stanje + dto.Iznos;
            if (novoStanje < 0) return false; // Ne dozvoljavamo negativno stanje

            var update = Builders<KreditKartica>.Update.Set(k => k.Stanje, novoStanje);
            var rezultat = await _kartice.UpdateOneAsync(k => k.Id == dto.KarticaId, update);

            return rezultat.ModifiedCount > 0;
        }
    }
}
