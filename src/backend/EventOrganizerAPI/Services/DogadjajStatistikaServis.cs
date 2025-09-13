// DogadjajStatistikaServis.cs
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Models.DTOs;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{

    public class DogadjajStatistikaServis : IDogadjajStatistikaServis
    {
        private readonly IMongoCollection<Dogadjaj> _dogadjaji;
        private readonly IMongoCollection<Karta> _karte;
        private readonly IMongoCollection<Notifikacija> _notifikacije;
        private readonly IMongoCollection<Napomena> _napomene;
        private readonly IMongoCollection<DanDogadjaja> _dani;

        public DogadjajStatistikaServis(IMongoDatabase db)
        {
            _dogadjaji = db.GetCollection<Dogadjaj>("Dogadjaji");
            _karte = db.GetCollection<Karta>("Karte");
            _notifikacije = db.GetCollection<Notifikacija>("Notifikacije");
            _napomene = db.GetCollection<Napomena>("Napomene");
            _dani = db.GetCollection<DanDogadjaja>("Dani");
        }

        public async Task<List<DogadjajStatistikaDto>> PreuzmiSvuStatistikuAsync()
        {
            var dogadjaji = await _dogadjaji.Find(_ => true).ToListAsync();
            var statistike = new List<DogadjajStatistikaDto>();

            foreach (var dogadjaj in dogadjaji)
            {
                var statistika = await KreirajStatistikuZaDogadjaj(dogadjaj);
                statistike.Add(statistika);
            }

            return statistike;
        }

        public async Task<DogadjajStatistikaDto> PreuzmiStatistikuDogadjajaAsync(string dogadjajId)
        {
            var dogadjaj = await _dogadjaji.Find(d => d.Id == dogadjajId).FirstOrDefaultAsync();
            if (dogadjaj == null) return null;

            return await KreirajStatistikuZaDogadjaj(dogadjaj);
        }

        public async Task<List<DogadjajStatistikaDto>> PreuzmiStatistikuPoOrganizatoruAsync(string organizatorId)
        {
            var dogadjaji = await _dogadjaji.Find(d => d.Organizator == organizatorId).ToListAsync();
            var statistike = new List<DogadjajStatistikaDto>();

            foreach (var dogadjaj in dogadjaji)
            {
                var statistika = await KreirajStatistikuZaDogadjaj(dogadjaj);
                statistike.Add(statistika);
            }

            return statistike;
        }

        private async Task<DogadjajStatistikaDto> KreirajStatistikuZaDogadjaj(Dogadjaj dogadjaj)
        {
            // Broj prodatih karata
            var filterKarte = Builders<Karta>.Filter.Eq(k => k.DogadjajId, dogadjaj.Id);
            var prodateKarte = await _karte.CountDocumentsAsync(filterKarte);

            // Broj notifikacija
            var filterNotifikacije = Builders<Notifikacija>.Filter.In("_id", dogadjaj.Notifikacije);
            var brojNotifikacija = await _notifikacije.CountDocumentsAsync(filterNotifikacije);

            // Broj napomena
            var filterNapomene = Builders<Napomena>.Filter.In("_id", dogadjaj.Napomene);
            var brojNapomena = await _napomene.CountDocumentsAsync(filterNapomene);

            // Broj dana
            var filterDani = Builders<DanDogadjaja>.Filter.In("_id", dogadjaj.Dani);
            var brojDana = await _dani.CountDocumentsAsync(filterDani);

            return new DogadjajStatistikaDto
            {
                DogadjajId = dogadjaj.Id,
                NazivDogadjaja = dogadjaj.Naziv,
                Lokacija = dogadjaj.Lokacija,
                DatumPocetka = dogadjaj.DatumPocetka,
                DatumKraja = dogadjaj.DatumKraja,
                Kapacitet = dogadjaj.Kapacitet,
                ProdatihKarata = (int)prodateKarte,
                PrijavljenihUcesnika = dogadjaj.Prijavljeni?.Count ?? 0,
                BrojNotifikacija = (int)brojNotifikacija,
                BrojNapomena = (int)brojNapomena,
                BrojDana = (int)brojDana,
                Organizator = dogadjaj.Organizator,
                Status = dogadjaj.Status
            };
        }
    }
}