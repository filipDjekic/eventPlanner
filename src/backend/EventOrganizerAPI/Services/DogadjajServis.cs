using EventOrganizerAPI.Dtos.Dogadjaj;
using EventOrganizerAPI.DTOs.Dogadjaj;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class DogadjajServis : IDogadjajServis
    {
        private readonly IMongoCollection<Dogadjaj> _dogadjaji;
        private readonly IMongoCollection<Lokacija> _lokacije;
        private readonly IMongoCollection<Organizator> _organizatori;
        private readonly IWebHostEnvironment _env;
        private readonly IMongoCollection<Resurs> _resursi;

        public DogadjajServis(IMongoDatabase db, IWebHostEnvironment env)
        {
            _dogadjaji = db.GetCollection<Dogadjaj>("Dogadjaji");
            _lokacije = db.GetCollection<Lokacija>("Lokacije");
            _organizatori = db.GetCollection<Organizator>("Organizatori");
            _env = env;
            _resursi = db.GetCollection<Resurs>("Resursi");
        }

        public async Task<Dogadjaj> KreirajDogadjaj(KreirajDogadjajDto dto)
        {
            var dogadjaj = new Dogadjaj
            {
                Naziv = dto.Naziv,
                Lokacija = dto.Lokacija, // <- KORISTI DTO.Lokacija, ne LokacijaId
                DatumPocetka = dto.DatumPocetka,
                DatumKraja = dto.DatumKraja,
                URLalbuma = dto.URLalbuma,
                Opis = dto.Opis,
                Kapacitet = dto.Kapacitet,
                Karte = new List<string>(),
                Dani = new List<string>(),
                Prijavljeni = new List<string>(),
                Tagovi = dto.Tagovi,
                Notifikacije = new List<string>(),
                Napomene = dto.Napomene ?? new List<string>(),
                Organizator = dto.OrganizatorId,
                Status = dto.Status,
                Kategorija = dto.Kategorija
            };

            await _dogadjaji.InsertOneAsync(dogadjaj);

            var filter = Builders<Organizator>.Filter.Eq(o => o.Id, dto.OrganizatorId);
            var update = Builders<Organizator>.Update.Push(o => o.Dogadjaji, dogadjaj.Id);

            await _organizatori.UpdateOneAsync(filter, update);

            return dogadjaj;
        }


        public async Task<List<PrikazDogadjajDto>> VratiSveDogadjaje()
        {
            var dogadjaji = await _dogadjaji.Find(_ => true).ToListAsync();

            var dtoLista = dogadjaji.Select(d => new PrikazDogadjajDto
            {
                Id = d.Id,
                Naziv = d.Naziv,
                Lokacija = d.Lokacija,
                DatumPocetka = d.DatumPocetka,
                DatumKraja = d.DatumKraja,
                URLalbuma = d.URLalbuma,
                Opis = d.Opis,
                Kapacitet = d.Kapacitet,
                Karte = d.Karte,
                Dani = d.Dani,
                Prijavljeni = d.Prijavljeni,
                Tagovi = d.Tagovi,
                Notifikacije = d.Notifikacije,
                Napomene = d.Napomene,
                Organizator = d.Organizator,
                Status = d.Status,
                Kategorija = d.Kategorija
            }).ToList();

            return dtoLista;
        }

        public async Task<Dogadjaj> VratiPoId(string id) =>
            await _dogadjaji.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task AzurirajDogadjaj(AzurirajDogadjajDto dto)
        {
            var filter = Builders<Dogadjaj>.Filter.Eq(d => d.Id, dto.Id);
            var update = Builders<Dogadjaj>.Update
                .Set(d => d.Naziv, dto.Naziv)
                .Set(d => d.Opis, dto.Opis)
                .Set(d => d.Status, dto.Status)
                .Set(d => d.Tagovi, dto.Tagovi);

            if (dto.DatumPocetka.HasValue)
                update = update.Set(d => d.DatumPocetka, dto.DatumPocetka.Value);
            if (dto.DatumKraja.HasValue)
                update = update.Set(d => d.DatumKraja, dto.DatumKraja.Value);
            if (!string.IsNullOrEmpty(dto.Lokacija))
                update = update.Set(d => d.Lokacija, dto.Lokacija);
            if (!string.IsNullOrEmpty(dto.Kategorija))
                update = update.Set(d => d.Kategorija, dto.Kategorija);

            if (dto.Kapacitet.HasValue)                       // <—
                update = update.Set(d => d.Kapacitet, dto.Kapacitet.Value);

            if (dto.Karte != null)                            // <—
                update = update.Set(d => d.Karte, dto.Karte);

            await _dogadjaji.UpdateOneAsync(filter, update);
        }
        public async Task ObrisiDogadjaj(string id) =>
            await _dogadjaji.DeleteOneAsync(d => d.Id == id);

        public async Task<List<Dogadjaj>> Pretrazi(PretraziDogadjajDto dto)
        {
            var filter = Builders<Dogadjaj>.Filter.Empty;

            if (!string.IsNullOrWhiteSpace(dto.Naziv))
                filter &= Builders<Dogadjaj>.Filter.Regex("Naziv", new BsonRegularExpression(dto.Naziv, "i"));

            if (dto.Tagovi != null && dto.Tagovi.Any())
                filter &= Builders<Dogadjaj>.Filter.AnyIn(d => d.Tagovi, dto.Tagovi);

            if (dto.VremeOd.HasValue)
                filter &= Builders<Dogadjaj>.Filter.Gte(d => d.DatumPocetka, dto.VremeOd.Value);
            if (dto.VremeDo.HasValue)
                filter &= Builders<Dogadjaj>.Filter.Lte(d => d.DatumKraja, dto.VremeDo.Value);

            var svi = await _dogadjaji.Find(filter).ToListAsync();

            // Ako lokacija treba da se pretražuje po imenu (adresa)
            if (!string.IsNullOrEmpty(dto.Lokacija))
            {
                svi = svi.Where(d => !string.IsNullOrEmpty(d.Lokacija) &&
                    d.Lokacija.IndexOf(dto.Lokacija, StringComparison.OrdinalIgnoreCase) >= 0).ToList();
            }

            // Ako želiš pretragu po entitetu Lokacija (grad i država) - može ostati, ali tada Dogadjaj.Lokacija treba da odgovara Lokacija.Id kao string!
            if (!string.IsNullOrEmpty(dto.Grad) || !string.IsNullOrEmpty(dto.Drzava))
            {
                var lokacijeFilter = Builders<Lokacija>.Filter.Empty;

                if (!string.IsNullOrEmpty(dto.Grad))
                    lokacijeFilter &= Builders<Lokacija>.Filter.Regex("Grad", new BsonRegularExpression(dto.Grad, "i"));
                if (!string.IsNullOrEmpty(dto.Drzava))
                    lokacijeFilter &= Builders<Lokacija>.Filter.Regex("Drzava", new BsonRegularExpression(dto.Drzava, "i"));

                var lokacije = await _lokacije.Find(lokacijeFilter).ToListAsync();
                var lokacijeIds = lokacije.Select(l => l.Id).ToHashSet();

                svi = svi.Where(d => !string.IsNullOrEmpty(d.Lokacija) && lokacijeIds.Contains(d.Lokacija)).ToList();
            }

            // Sortiranje
            if (dto.SortirajPoDatumu == true)
                svi = svi.OrderBy(d => d.DatumPocetka).ToList();
            else if (dto.SortirajPoDatumu == false)
                svi = svi.OrderByDescending(d => d.DatumPocetka).ToList();

            if (dto.SortirajPoPrijavljenima == true)
                svi = svi.OrderBy(d => d.Prijavljeni.Count).ToList();
            else if (dto.SortirajPoPrijavljenima == false)
                svi = svi.OrderByDescending(d => d.Prijavljeni.Count).ToList();

            return svi;
        }
        public async Task<string> SacuvajSliku(IFormFile slika, string dogadjajId)
        {
            var folder = "images";
            var fileName = Guid.NewGuid().ToString() + Path.GetExtension(slika.FileName);
            var fullPath = Path.Combine(_env.WebRootPath, folder, fileName);

            Directory.CreateDirectory(Path.GetDirectoryName(fullPath)!);

            using (var stream = new FileStream(fullPath, FileMode.Create))
            {
                await slika.CopyToAsync(stream);
            }
            var relativePath = $"/{folder}/{fileName}";

            var filter = Builders<Dogadjaj>.Filter.Eq(d => d.Id, dogadjajId);
            var update = Builders<Dogadjaj>.Update.Set(d => d.URLalbuma, relativePath);

            await _dogadjaji.UpdateOneAsync(filter, update);

            return relativePath;
        }
        public async Task DodajResurseDogadjaju(DodajResurseDogadjajuDto dto)
        {
            // 1. Dodavanje IDeva resursa u Dogadjaj.Resursi
            var filterDog = Builders<Dogadjaj>.Filter.Eq(d => d.Id, dto.DogadjajId);
            var updateDog = Builders<Dogadjaj>.Update.AddToSetEach(d => d.Resursi, dto.ResursiIds);
            await _dogadjaji.UpdateOneAsync(filterDog, updateDog);

            // 2. Za svaki resurs setovanje  DogadjajId
            var filterRes = Builders<Resurs>.Filter.In(r => r.Id, dto.ResursiIds);
            var updateRes = Builders<Resurs>.Update.Set(r => r.DogadjajId, dto.DogadjajId);
            await _resursi.UpdateManyAsync(filterRes, updateRes);
        }

    }
}