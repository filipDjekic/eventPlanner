using EventOrganizerAPI.DTOs.Resurs;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Models.Enums;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class ResursServis : IResursServis
    {
        private readonly IMongoCollection<Resurs> _resursi;

        public ResursServis(IMongoDatabase db)
        {
            _resursi = db.GetCollection<Resurs>("Resursi");
        }

        public async Task<Resurs> Kreiraj(KreirajResursDto dto)
        {
            var resurs = new Resurs
            {
                Naziv = dto.Naziv,
                Opis = dto.Opis,
                Tip = dto.Tip,
                UkupnoKolicina = dto.UkupnoKolicina,
                RezervisanoKolicina = 0,
                Dobavljac = dto.Dobavljac,
                Lokacija = dto.Lokacija,
                Aktivnost = dto.Aktivnost
            };

            await _resursi.InsertOneAsync(resurs);

            var db = _resursi.Database;
            var dobavljaci = db.GetCollection<Dobavljac>("Dobavljaci");
            var filter = Builders<Dobavljac>.Filter.Eq("_id", MongoDB.Bson.ObjectId.Parse(resurs.Dobavljac));
            var update = Builders<Dobavljac>.Update.Push(d => d.Resursi, resurs.Id);
            await dobavljaci.UpdateOneAsync(filter, update);

            return resurs;
        }

        public async Task<List<Resurs>> VratiSve() =>
            await _resursi.Find(_ => true).ToListAsync();

        public async Task<Resurs> VratiPoId(string id) =>
            await _resursi.Find(x => x.Id == id).FirstOrDefaultAsync();

        public async Task Azuriraj(string id, AzurirajResursDto dto)
        {
            var update = Builders<Resurs>.Update.Combine();

            if (dto.Naziv != null)
                update = update.Set(x => x.Naziv, dto.Naziv);
            if (dto.Opis != null)
                update = update.Set(x => x.Opis, dto.Opis);
            if (dto.Tip != null)
                update = update.Set(x => x.Tip, dto.Tip);
            if (dto.Kolicina.HasValue)
                update = update.Set(x => x.UkupnoKolicina, dto.Kolicina.Value); // Menja ukupnu količinu!
            if (dto.Lokacija != null)
                update = update.Set(x => x.Lokacija, dto.Lokacija);
            if (dto.Aktivnost != null)
                update = update.Set(x => x.Aktivnost, dto.Aktivnost);

            await _resursi.UpdateOneAsync(x => x.Id == id, update);
        }

        public async Task Obrisi(string id) =>
            await _resursi.DeleteOneAsync(x => x.Id == id);

        public async Task<List<Resurs>> VratiSlobodne() =>
            await _resursi.Find(x => x.Status == StatusResursa.Slobodan).ToListAsync();

        public async Task RezervisiResurs(string resursId, string dogadjajId, int? kolicina = null)
        {
            var resurs = await _resursi.Find(x => x.Id == resursId).FirstOrDefaultAsync();

            if (resurs != null && kolicina.HasValue)
            {
                var novoRezervisano = (resurs.RezervisanoKolicina) + kolicina.Value;

                var update = Builders<Resurs>.Update
                    .Set(x => x.Status, StatusResursa.Rezervisan)
                    .Set(x => x.DogadjajId, dogadjajId)
                    .Set(x => x.RezervisanoKolicina, novoRezervisano);

                await _resursi.UpdateOneAsync(x => x.Id == resursId, update);

               
                var db = _resursi.Database;
                var dogadjaji = db.GetCollection<Dogadjaj>("Dogadjaji");
                var filterDog = Builders<Dogadjaj>.Filter.Eq(d => d.Id, dogadjajId);
                var updateDog = Builders<Dogadjaj>.Update.AddToSet(d => d.Resursi, resursId);
                await dogadjaji.UpdateOneAsync(filterDog, updateDog);
            }
        }

        public async Task<List<Resurs>> VratiZaDogadjaj(string dogadjajId) =>
            await _resursi.Find(x => x.DogadjajId == dogadjajId).ToListAsync();

        public async Task PonistiRezervaciju(string resursId, string dogadjajId)
        {
            var resurs = await _resursi.Find(x => x.Id == resursId && x.DogadjajId == dogadjajId).FirstOrDefaultAsync();

            if (resurs != null)
            {
                
                int rezervisanoZaDogadjaj = resurs.RezervisanoKolicina; // po potrebi promeniti 
                var update = Builders<Resurs>.Update
                    .Set(x => x.Status, StatusResursa.Slobodan)
                    .Set(x => x.DogadjajId, null)
                    .Set(x => x.RezervisanoKolicina, resurs.RezervisanoKolicina - rezervisanoZaDogadjaj);

                await _resursi.UpdateOneAsync(x => x.Id == resursId && x.DogadjajId == dogadjajId, update);
            }
        }
    }
}