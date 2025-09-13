using EventOrganizerAPI.DTOs.Korisnik;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;

namespace EventOrganizerAPI.Services
{
    public class KorisnikServis : IKorisnikServis
    {
        private readonly IMongoCollection<Korisnik> _korisnici;
        private readonly IMongoCollection<Karta> _karte;
        private readonly IMongoCollection<Dogadjaj> _dogadjaji;
        private readonly IMongoCollection<KupljenaKarta> _kupljeneKarte;

        public KorisnikServis(IMongoDatabase db)
        {
            _korisnici = db.GetCollection<Korisnik>("Korisnici");
            _karte = db.GetCollection<Karta>("Karte");
            _dogadjaji = db.GetCollection<Dogadjaj>("Dogadjaji");
            _kupljeneKarte = db.GetCollection<KupljenaKarta>("KupljeneKarte");
        }

        public async Task<List<PrikaziKorisnikDto>> VratiSve()
        {
            var korisnici = await _korisnici.Find(_ => true).ToListAsync();
            return korisnici.Select(k => new PrikaziKorisnikDto
            {
                Id = k.Id,
                KorisnickoIme = k.KorisnickoIme,
                Email = k.Email,
                BrojTelefona = k.BrojTelefona,
                Uloga = k.Uloga,
                VerifikovanEmail = k.VerifikovanEmail,
                Kartica = k.Kartica
            }).ToList();
        }

        public async Task<PrikaziKorisnikDto?> VratiPoId(string id)
        {
            var korisnik = await _korisnici.Find(k => k.Id == id).FirstOrDefaultAsync();
            if (korisnik == null) return null;

            return new PrikaziKorisnikDto
            {
                Id = korisnik.Id,
                KorisnickoIme = korisnik.KorisnickoIme,
                Email = korisnik.Email,
                BrojTelefona = korisnik.BrojTelefona,
                Uloga = korisnik.Uloga,
                VerifikovanEmail = korisnik.VerifikovanEmail,
                Kartica = korisnik.Kartica,
                Karte = korisnik.Karte
            };
        }

        public async Task Azuriraj(AzurirajKorisnikDto dto)
        {
            var filter = Builders<Korisnik>.Filter.Eq(k => k.Id, dto.Id);
            var update = Builders<Korisnik>.Update.Combine(new List<UpdateDefinition<Korisnik>>
            {
                dto.KorisnickoIme != null ? Builders<Korisnik>.Update.Set(k => k.KorisnickoIme, dto.KorisnickoIme) : null,
                dto.Email != null ? Builders<Korisnik>.Update.Set(k => k.Email, dto.Email) : null,
                dto.BrojTelefona != null ? Builders<Korisnik>.Update.Set(k => k.BrojTelefona, dto.BrojTelefona) : null,
                dto.Uloga != null ? Builders<Korisnik>.Update.Set(k => k.Uloga, dto.Uloga) : null,
                dto.VerifikovanEmail.HasValue ? Builders<Korisnik>.Update.Set(k => k.VerifikovanEmail, dto.VerifikovanEmail.Value) : null,
                dto.Kartica != null ? Builders<Korisnik>.Update.Set(k => k.Kartica, dto.Kartica) : null,
            }.Where(u => u != null)!);

            await _korisnici.UpdateOneAsync(filter, update);
        }

        public async Task Obrisi(string id)
        {
            await _korisnici.DeleteOneAsync(k => k.Id == id);
        }

        public async Task<bool> KupiKartuAsync(KupovinaKarteDto dto)
        {
            var korisnik = await _korisnici.Find(k => k.Id == dto.KorisnikId).FirstOrDefaultAsync();
            var karta = await _karte.Find(k => k.Id == dto.KartaId).FirstOrDefaultAsync();

            if (korisnik == null || karta == null)
                return false;

            if (karta.BrojKarata <= 0)
                return false;
            if (korisnik.Balans < karta.Cena * dto.Kolicina) return false;
            if (dto.Kolicina > karta.BrojKarata) return false;

            // 1 Smanji broj dostupnih karata
            karta.BrojKarata -= dto.Kolicina;
            await _karte.ReplaceOneAsync(k => k.Id == karta.Id, karta);

            for (int i = 0; i < dto.Kolicina; i++)
            {
                KupljenaKarta temp = new KupljenaKarta
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    DatumVremeKupovine = DateTime.Now,
                    KartaId = dto.KartaId,
                    KorisnikId = dto.KorisnikId,
                    Validna = true
                };
                await _kupljeneKarte.InsertOneAsync(temp);
                decimal tempBalans = korisnik.Balans - karta.Cena;
                var filter = Builders<Korisnik>.Filter.Eq(k => k.Id, dto.KorisnikId);
                var update = Builders<Korisnik>.Update
                    .Push(k => k.Karte, temp.Id)
                    .Set(k => k.Balans, tempBalans);

                await _korisnici.UpdateOneAsync(filter, update);
            }

            // 3 Dodaj korisnika u prijavljene na događaj
            var dogadjaj = await _dogadjaji.Find(d => d.Id == karta.DogadjajId).FirstOrDefaultAsync();
            if (dogadjaj != null && !dogadjaj.Prijavljeni.Contains(korisnik.Id))
            {
                dogadjaj.Prijavljeni.Add(korisnik.Id);
                await _dogadjaji.ReplaceOneAsync(d => d.Id == dogadjaj.Id, dogadjaj);
            }

            return true;
        }

        public async Task DodajBalans(DodajBalansDto dto)
        {
            var filter = Builders<Korisnik>.Filter.Eq(k => k.Id, dto.KorisnikId);
            var kor = await _korisnici.Find(filter).FirstOrDefaultAsync();

            decimal noviBalans = dto.Balans + kor.Balans;
            var update = Builders<Korisnik>.Update.Set(k => k.Balans, noviBalans);

            await _korisnici.UpdateOneAsync(filter, update);
        }
    }
}