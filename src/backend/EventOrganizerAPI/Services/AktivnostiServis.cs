using EventOrganizerAPI.Models;
using EventOrganizerAPI.DTOs.RasporedAktivnosti;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class AktivnostiServis : IAktivnostiServis
    {
        private readonly IMongoCollection<Aktivnost> _aktivnosti;
        private readonly IMongoCollection<DanDogadjaja> _dani;

        public AktivnostiServis(IMongoDatabase db)
        {
            _aktivnosti = db.GetCollection<Aktivnost>("Aktivnosti");
            _dani = db.GetCollection<DanDogadjaja>("Dani");
        }

        public async Task<Aktivnost> Kreiraj(KreirajAktivnostDto dto)
        {
            var a = new Aktivnost
            {
                Naziv = dto.Naziv,
                Opis = dto.Opis,
                DatumVremePocetka = dto.DatumVremePocetka,
                DatumVremeKraja = dto.DatumVremeKraja,
                Lokacija = dto.Lokacija,
                Dan = dto.Dan,
                Dogadjaj = dto.Dogadjaj,
                Tip = dto.Tip
            };

            await _aktivnosti.InsertOneAsync(a);

            var filter = Builders<DanDogadjaja>.Filter.Eq(d => d.Id, dto.Dan);
            var update = Builders<DanDogadjaja>.Update.Push(d=> d.Aktivnosti,a.Id);

            await _dani.UpdateOneAsync(filter, update);

            return a;
        }

        public async Task<List<Aktivnost>> VratiSve() =>
            await _aktivnosti.Find(_ => true).ToListAsync();

        public async Task<Aktivnost> VratiPoId(string id) =>
            await _aktivnosti.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task Azuriraj(AzurirajAktivnostDto dto)
        {
            var update = Builders<Aktivnost>.Update.Combine();

            if (dto.Naziv != null)
                update = update.Set(x => x.Naziv, dto.Naziv);
            if (dto.Opis != null)
                update = update.Set(x => x.Opis, dto.Opis);
            if (dto.DatumVremePocetka.HasValue)
                update = update.Set(x => x.DatumVremePocetka, dto.DatumVremePocetka.Value);
            if (dto.DatumVremeKraja.HasValue)
                update = update.Set(x => x.DatumVremeKraja, dto.DatumVremeKraja.Value);
            if (dto.Lokacija != null)
                update = update.Set(x => x.Lokacija, dto.Lokacija);
            if (dto.Dan != null)
                update = update.Set(x => x.Dan, dto.Dan);
            if (dto.Dogadjaj != null)
                update = update.Set(x => x.Dogadjaj, dto.Dogadjaj);
            if (dto.Tip.HasValue)
                update = update.Set(x => x.Tip, dto.Tip.Value);

            await _aktivnosti.UpdateOneAsync(x => x.Id == dto.Id, update);
        }

        public async Task Obrisi(string id) =>
            await _aktivnosti.DeleteOneAsync(x => x.Id == id);
    }
}
