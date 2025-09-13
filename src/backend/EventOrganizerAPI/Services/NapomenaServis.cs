using EventOrganizerAPI.Models;
using EventOrganizerAPI.DTOs.Napomena;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class NapomenaServis : INapomenaServis
    {
        private readonly IMongoCollection<Napomena> _napomene;

        public NapomenaServis(IMongoDatabase database)
        {
            _napomene = database.GetCollection<Napomena>("Napomene");
        }

        public async Task<Napomena> Kreiraj(KreirajNapomenuDto dto)
        {
            var napomena = new Napomena
            {
                Sadrzaj = dto.Sadrzaj,
                Tip = dto.Tip,
                Dogadjaj = dto.Dogadjaj
            };

            await _napomene.InsertOneAsync(napomena);
            return napomena;
        }

        public async Task<List<Napomena>> VratiSve() =>
            await _napomene.Find(_ => true).ToListAsync();

        public async Task<Napomena> VratiPoId(string id) =>
            await _napomene.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task Azuriraj(string id, AzurirajNapomenuDto dto)
        {
            var update = Builders<Napomena>.Update.Combine();

            if (dto.Sadrzaj != null)
                update = update.Set(x => x.Sadrzaj, dto.Sadrzaj);
            if (dto.Tip != null)
                update = update.Set(x => x.Tip, dto.Tip);

            await _napomene.UpdateOneAsync(x => x.Id == id, update);
        }

        public async Task Obrisi(string id) =>
            await _napomene.DeleteOneAsync(x => x.Id == id);
    }
}
