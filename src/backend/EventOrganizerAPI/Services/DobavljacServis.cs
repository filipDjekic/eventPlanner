using EventOrganizerAPI.DTOs.Dobavljac;
using EventOrganizerAPI.Models;
using MongoDB.Driver;
using EventOrganizerAPI.Services.Interfaces;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;
using MongoDB.Bson;

namespace EventOrganizerAPI.Services
{
    public class DobavljacServis : IDobavljacServis
    {
        private readonly IMongoCollection<Dobavljac> _dobavljaci;

        public DobavljacServis(IMongoDatabase db)
        {
            _dobavljaci = db.GetCollection<Dobavljac>("Dobavljaci");
        }

        public async Task<List<PrikaziDobavljacDto>> VratiSve()
        {
            var dobavljaci = await _dobavljaci.Find(_ => true).ToListAsync();
            return dobavljaci.Select(d => new PrikaziDobavljacDto
            {
                Id = d.Id,
                ImeIPrezime = d.ImeIPrezime,
                Email = d.Email,
                KorisnickoIme = d.KorisnickoIme,
                BrojTelefona = d.BrojTelefona,
                Adresa = d.Adresa,
                VerifikovanEmail = d.VerifikovanEmail,
                Resursi = d.Resursi
            }).ToList();
        }

        public async Task<PrikaziDobavljacDto> VratiPoId(string id)
        {
            var dobavljac = await _dobavljaci.Find(d => d.Id == id).FirstOrDefaultAsync();
            if (dobavljac == null) return null;

            return new PrikaziDobavljacDto
            {
                Id = dobavljac.Id,
                ImeIPrezime = dobavljac.ImeIPrezime,
                Email = dobavljac.Email,
                KorisnickoIme = dobavljac.KorisnickoIme,
                BrojTelefona = dobavljac.BrojTelefona,
                Adresa = dobavljac.Adresa,
                VerifikovanEmail = dobavljac.VerifikovanEmail,
                Resursi = dobavljac.Resursi ?? new List<string>()
            };
        }

        public async Task Azuriraj(AzurirajDobavljacDto dto)
        {
            // Validacija ime i prezime
            if (dto.ImeIPrezime == null ||
                !System.Text.RegularExpressions.Regex.IsMatch(dto.ImeIPrezime.Trim(), @"^[A-Za-zĆČĐŠŽćčđšžА-Яа-я\s]+$") ||
                dto.ImeIPrezime.Trim().Split(' ').Length < 2)
                throw new Exception("Ime i prezime: samo slova, bez brojeva, minimum dve reči.");

            // Validacija broj telefona
            if (dto.BrojTelefona == null ||
                !System.Text.RegularExpressions.Regex.IsMatch(dto.BrojTelefona.Trim(), @"^\d{9,15}$"))
                throw new Exception("Broj telefona: samo cifre (9-15).");

            var filter = Builders<Dobavljac>.Filter.Eq("_id", ObjectId.Parse(dto.Id));
            var update = Builders<Dobavljac>.Update
                .Set(d => d.ImeIPrezime, dto.ImeIPrezime)
                .Set(d => d.Email, dto.Email)
                .Set(d => d.KorisnickoIme, dto.KorisnickoIme)
                .Set(d => d.BrojTelefona, dto.BrojTelefona)
                .Set(d => d.Adresa, dto.Adresa);

            var result = await _dobavljaci.UpdateOneAsync(filter, update);

            Console.WriteLine($"Modified count: {result.ModifiedCount}");
        }

        public async Task Obrisi(string id)
        {
            await _dobavljaci.DeleteOneAsync(d => d.Id == id);
        }

        public async Task PromeniSifru(string id, string trenutnaSifra, string novaSifra)
        {
           
            var dobavljac = await _dobavljaci.Find(d => d.Id == id).FirstOrDefaultAsync();
            if (dobavljac == null)
                throw new Exception("Dobavljač nije pronađen.");

            
            bool sifraOk;
            try
            {
                
                sifraOk = BCrypt.Net.BCrypt.Verify(trenutnaSifra, dobavljac.Sifra);
            }
            catch
            {
                sifraOk = false;
            }

            if (!sifraOk)
                throw new Exception("Trenutna šifra nije ispravna.");

           
            string novaSifraHash = BCrypt.Net.BCrypt.HashPassword(novaSifra);

            var update = Builders<Dobavljac>.Update.Set(d => d.Sifra, novaSifraHash);
            await _dobavljaci.UpdateOneAsync(d => d.Id == id, update);
        
        }
    }
}