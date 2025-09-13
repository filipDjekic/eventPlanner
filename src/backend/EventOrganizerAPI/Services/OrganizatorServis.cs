using EventOrganizerAPI.DTOs.Organizator;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using System.Text.RegularExpressions;

namespace EventOrganizerAPI.Services
{
    public class OrganizatorServis : IOrganizatorServis
    {
        private readonly IMongoCollection<Organizator> _organizatori;

        public OrganizatorServis(IMongoDatabase db)
        {
            _organizatori = db.GetCollection<Organizator>("Organizatori");
        }

        public async Task<List<PrikaziOrganizatorDto>> VratiSve()
        {
            var lista = await _organizatori.Find(_ => true).ToListAsync();
            return lista.Select(o => new PrikaziOrganizatorDto
            {
                Id = o.Id,
                ImeIPrezime = o.ImeIPrezime,
                Email = o.Email,
                KorisnickoIme = o.KorisnickoIme,
                VerifikovanEmail = o.VerifikovanEmail,
                Uloga = o.Uloga,
                Dogadjaji = o.Dogadjaji,
                Adresa=o.Adresa,
                BrojTelefona=o.BrojTelefona
            }).ToList();
        }

        public async Task<PrikaziOrganizatorDto> VratiPoId(string id)
        {
            var organizator = await _organizatori.Find(o => o.Id == id).FirstOrDefaultAsync();
            if (organizator == null) return null;

            return new PrikaziOrganizatorDto
            {
                Id = organizator.Id,
                ImeIPrezime = organizator.ImeIPrezime,
                Email = organizator.Email,
                KorisnickoIme = organizator.KorisnickoIme,
                VerifikovanEmail = organizator.VerifikovanEmail,
                Uloga = organizator.Uloga,
                Dogadjaji = organizator.Dogadjaji,
                Adresa = organizator.Adresa,
                BrojTelefona = organizator.BrojTelefona
            };
        }

        public async Task Azuriraj(AzurirajOrganizatorDto dto)
        {
            var filter = Builders<Organizator>.Filter.Eq(o => o.Id, dto.Id);
            var updateDef = new List<UpdateDefinition<Organizator>>();

            // VALIDACIJA: Ime i prezime
            if (dto.ImeIPrezime != null)
            {
                // Dozvoli samo slova (latinična/ćirilična) i razmake, minimum dve reči
                var regexIme = new Regex(@"^[A-Za-zĆČĐŠŽćčđšžА-Яа-я\s]+$");
                if (!regexIme.IsMatch(dto.ImeIPrezime.Trim()) || dto.ImeIPrezime.Trim().Split(' ').Length < 2)
                    throw new Exception("Ime i prezime nevalidno! Dozvoljena su samo slova i razmaci, minimum dve reči.");
                updateDef.Add(Builders<Organizator>.Update.Set(o => o.ImeIPrezime, dto.ImeIPrezime));
            }

            // VALIDACIJA: Broj telefona
            if (dto.BrojTelefona != null)
            {
                var regexTelefon = new Regex(@"^\d{9,15}$");
                if (!regexTelefon.IsMatch(dto.BrojTelefona.Trim()))
                    throw new Exception("Broj telefona nevalidan! Dozvoljeno je samo 9-15 cifara.");
                updateDef.Add(Builders<Organizator>.Update.Set(o => o.BrojTelefona, dto.BrojTelefona));
            }

            // ...ostala polja kao pre...
            if (dto.Email != null)
                updateDef.Add(Builders<Organizator>.Update.Set(o => o.Email, dto.Email));
            if (dto.KorisnickoIme != null)
                updateDef.Add(Builders<Organizator>.Update.Set(o => o.KorisnickoIme, dto.KorisnickoIme));
            if (dto.Sifra != null)
                updateDef.Add(Builders<Organizator>.Update.Set(o => o.Sifra, dto.Sifra));
            if (dto.VerifikovanEmail.HasValue)
                updateDef.Add(Builders<Organizator>.Update.Set(o => o.VerifikovanEmail, dto.VerifikovanEmail.Value));
            if (dto.Adresa != null)
                updateDef.Add(Builders<Organizator>.Update.Set(o => o.Adresa, dto.Adresa));

            if (updateDef.Count > 0)
                await _organizatori.UpdateOneAsync(filter, Builders<Organizator>.Update.Combine(updateDef));
        }

        public async Task Obrisi(string id) =>
            await _organizatori.DeleteOneAsync(o => o.Id == id);

        public async Task PromeniSifru(string id, string trenutnaSifra, string novaSifra)
        {
            var organizator = await _organizatori.Find(o => o.Id == id).FirstOrDefaultAsync();
            if (organizator == null)
                throw new Exception("Organizator nije pronađen.");

            // Provera trenutne sifre
            bool sifraOk;
            try
            {
                sifraOk = BCrypt.Net.BCrypt.Verify(trenutnaSifra, organizator.Sifra);
            }
            catch
            {
                sifraOk = false;
            }
            if (!sifraOk)
                throw new Exception("Trenutna šifra nije ispravna.");

            // Hash nove sifre i update
            string novaSifraHash = BCrypt.Net.BCrypt.HashPassword(novaSifra);
            var update = Builders<Organizator>.Update.Set(o => o.Sifra, novaSifraHash);
            await _organizatori.UpdateOneAsync(o => o.Id == id, update);
        }
    }
}