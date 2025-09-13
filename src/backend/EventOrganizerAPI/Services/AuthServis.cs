using EventOrganizerAPI.DTOs.Auth;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System.Threading.Tasks;
using BCrypt.Net;

namespace EventOrganizerAPI.Services
{
    public class AuthServis : IAuthServis
    {
        private readonly IMongoCollection<Korisnik> _korisnici;
        private readonly IMongoCollection<Organizator> _organizatori;
        private readonly IMongoCollection<Dobavljac> _dobavljaci;
        private readonly ITokenServis _tokenServis;
        private readonly EmailServis _emailServis;

        public AuthServis(IMongoDatabase db, ITokenServis tokenServis, EmailServis emailServis)
        {
            _korisnici = db.GetCollection<Korisnik>("Korisnici");
            _organizatori = db.GetCollection<Organizator>("Organizatori");
            _dobavljaci = db.GetCollection<Dobavljac>("Dobavljaci");
            _tokenServis = tokenServis;
            _emailServis = emailServis;
        }

        // ----------- LOGIN -----------

        public async Task<LoginOdgovorDto?> LoginKorisnika(LoginDto dto)
        {
            var korisnik = await _korisnici.Find(k => k.KorisnickoIme == dto.KorisnickoIme).FirstOrDefaultAsync();
            if (korisnik == null || !BCrypt.Net.BCrypt.Verify(dto.Sifra, korisnik.Sifra))
                return null;

            var token = _tokenServis.GenerisiToken(korisnik);

            return new LoginOdgovorDto
            {
                Id = korisnik.Id,
                Ime = korisnik.KorisnickoIme,
                Uloga = "Korisnik",
                Token = token,
                VerifikovanEmail = korisnik.VerifikovanEmail
            };
        }

        public async Task<LoginOdgovorDto?> LoginOrganizatora(LoginDto dto)
        {
            var organizator = await _organizatori.Find(o => o.KorisnickoIme == dto.KorisnickoIme).FirstOrDefaultAsync();
            if (organizator == null || !BCrypt.Net.BCrypt.Verify(dto.Sifra, organizator.Sifra))
                return null;

            var token = _tokenServis.GenerisiToken(organizator);

            return new LoginOdgovorDto
            {
                Id = organizator.Id,
                Ime = organizator.ImeIPrezime,
                Uloga = "Organizator",
                Token = token,
                VerifikovanEmail = organizator.VerifikovanEmail
            };
        }

        public async Task<LoginOdgovorDto?> LoginDobavljaca(LoginDto dto)
        {
            var dobavljac = await _dobavljaci.Find(d => d.KorisnickoIme == dto.KorisnickoIme).FirstOrDefaultAsync();
            if (dobavljac == null || !BCrypt.Net.BCrypt.Verify(dto.Sifra, dobavljac.Sifra))
                return null;

            var token = _tokenServis.GenerisiToken(dobavljac);

            return new LoginOdgovorDto
            {
                Id = dobavljac.Id,
                Ime = dobavljac.ImeIPrezime,
                Uloga = "Dobavljac",
                Token = token,
                VerifikovanEmail = dobavljac.VerifikovanEmail
            };
        }

        // ----------- REGISTRACIJA -----------

        public async Task<bool> RegistrujKorisnika(RegistracijaDto dto)
        {
            var postoji = await _korisnici.Find(k => k.KorisnickoIme == dto.KorisnickoIme).AnyAsync();
            if (postoji) return false;

            var novi = new Korisnik
            {
                Email = dto.Email,
                KorisnickoIme = dto.KorisnickoIme,
                Sifra = BCrypt.Net.BCrypt.HashPassword(dto.Sifra),
                Uloga = "Korisnik",
                VerifikovanEmail = false,
                OmiljeniDogadjaji = new(),
                Karte = new(),
                IstorijaTransakcija = new(),
                Notifikacije = new()
                
            };

            await _korisnici.InsertOneAsync(novi);
            //await _emailServis.PosaljiVerifikacioniEmail(novi);
            return true;
        }

        public async Task<bool> RegistrujOrganizatora(RegistracijaDto dto)
        {
            var postoji = await _organizatori.Find(o => o.KorisnickoIme == dto.KorisnickoIme).AnyAsync();
            if (postoji) return false;

            var novi = new Organizator
            {
                ImeIPrezime = dto.ImeIPrezime,
                Email = dto.Email,
                KorisnickoIme = dto.KorisnickoIme,
                Sifra = BCrypt.Net.BCrypt.HashPassword(dto.Sifra),
                Uloga = "Organizator",
                VerifikovanEmail = false,
                Dogadjaji = new(),
                Adresa=dto.Adresa,
                BrojTelefona=dto.BrojTelefona
            };

            await _organizatori.InsertOneAsync(novi);
            await _emailServis.PosaljiVerifikacioniEmail(novi);
            return true;
        }

        public async Task<bool> RegistrujDobavljaca(RegistracijaDto dto)
        {
            var postoji = await _dobavljaci.Find(d => d.KorisnickoIme == dto.KorisnickoIme).AnyAsync();
            if (postoji) return false;

            var novi = new Dobavljac
            {
                ImeIPrezime = dto.ImeIPrezime,
                Email = dto.Email,
                KorisnickoIme = dto.KorisnickoIme,
                BrojTelefona = dto.BrojTelefona,
                Sifra = BCrypt.Net.BCrypt.HashPassword(dto.Sifra),
                Uloga = "Dobavljac",
                VerifikovanEmail = false,
                Adresa=dto.Adresa
            };

            await _dobavljaci.InsertOneAsync(novi);
            await _emailServis.PosaljiVerifikacioniEmail(novi);
            return true;
        }

        // ----------- VERIFIKACIJA MAILA -----------

        public async Task VerifikujMail(string id, string uloga)
        {
            if (uloga == "organizator")
            {
                var filter = Builders<Organizator>.Filter.Eq(o => o.Id, id);
                var update = Builders<Organizator>.Update.Set(o => o.VerifikovanEmail, true);
                await _organizatori.UpdateOneAsync(filter, update);
            }
            else if (uloga == "korisnik")
            {
                var filter = Builders<Korisnik>.Filter.Eq(k => k.Id, id);
                var update = Builders<Korisnik>.Update.Set(k => k.VerifikovanEmail, true);
                await _korisnici.UpdateOneAsync(filter, update);
            }
            else if (uloga == "dobavljac")
            {
                var filter = Builders<Dobavljac>.Filter.Eq(d => d.Id, id);
                var update = Builders<Dobavljac>.Update.Set(d => d.VerifikovanEmail, true);
                await _dobavljaci.UpdateOneAsync(filter, update);
            }
        }
    }
}