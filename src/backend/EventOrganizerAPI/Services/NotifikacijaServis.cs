using EventOrganizerAPI.DTOs;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Models.Enums;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class NotifikacijaServis : INotifikacijeServis
    {
        private readonly IMongoCollection<Notifikacija> _notifikacije;
        private readonly IMongoCollection<Dogadjaj> _dogadjaji;

        public NotifikacijaServis(IMongoDatabase db)
        {
            _notifikacije = db.GetCollection<Notifikacija>("Notifikacije");
            _dogadjaji = db.GetCollection<Dogadjaj>("Dogadjaji");
        }

        public async Task PosaljiNotifikacijuSvimPrijavljenima(KreirajNotifikacijuDto dto)
        {
            var notifikacija = new Notifikacija
            {
                Naziv = dto.Naziv,
                Sadrzaj = dto.Sadrzaj,
                Tip = dto.Tip,
                DogadjajId = dto.DogadjajId,
                DatumSlanja = DateTime.Now
            };

            await _notifikacije.InsertOneAsync(notifikacija);
        }

        public async Task<List<Notifikacija>> VratiNotifikacijeZaDogadjaj(string dogadjajId)
        {
            return await _notifikacije
                .Find(n => n.DogadjajId == dogadjajId)
                .SortByDescending(n => n.DatumSlanja)
                .ToListAsync();
        }

        public async Task ObrisiNotifikaciju(string id)
        {
            await _notifikacije.DeleteOneAsync(n => n.Id == id);
        }
    }
}