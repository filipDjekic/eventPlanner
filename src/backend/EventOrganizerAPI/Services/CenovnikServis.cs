using EventOrganizerAPI.DTOs.Cenovnik;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using MongoDB.Bson;
using MongoDB.Driver;
using System.Collections.Generic;
using System.Linq;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class CenovnikServis : ICenovnikServis
    {
        private readonly IMongoCollection<Cenovnik> _cenovnici;
        private readonly IMongoCollection<Lokacija> _lokacije;

        public CenovnikServis(IMongoDatabase db)
        {
            _cenovnici = db.GetCollection<Cenovnik>("Cenovnici");
            _lokacije = db.GetCollection<Lokacija>("Lokacije");
        }

        public async Task<Cenovnik> KreirajCenovnikAsync(KreirajCenovnikDto dto)
        {
            var cenovnik = new Cenovnik
            {
                Naziv = dto.Naziv,
                DogadjajId = dto.DogadjajId,
                LokacijaId = dto.LokacijaId,
                Stavke = new List<string>()
            };

            if (dto.StavkeIds != null)
            {
                foreach (var stavkaId in dto.StavkeIds)
                {
                    cenovnik.Stavke.Add(stavkaId);
                }
            }

            await _cenovnici.InsertOneAsync(cenovnik);
            return cenovnik;
        }

        public async Task<List<Cenovnik>> VratiSveCenovnikeAsync() =>
            await _cenovnici.Find(_ => true).ToListAsync();

        public async Task<List<Cenovnik>> VratiSveZaDogadjajAsync(string dogadjajId)
        {
            if (string.IsNullOrWhiteSpace(dogadjajId))
            {
                return new List<Cenovnik>();
            }

            var rezultat = await _cenovnici
                .Find(c => c.DogadjajId == dogadjajId)
                .ToListAsync();

            var fallbackFilter = Builders<Cenovnik>.Filter.Or(
                Builders<Cenovnik>.Filter.Where(c => c.DogadjajId == null),
                Builders<Cenovnik>.Filter.Eq(c => c.DogadjajId, string.Empty)
            );

            var fallback = await _cenovnici.Find(fallbackFilter).ToListAsync();

            if (fallback.Count > 0)
            {
                var lokacijeDogadjaja = await _lokacije
                    .Find(l => l.DogadjajId == dogadjajId)
                    .Project(l => l.Id)
                    .ToListAsync();

                var lokacijaSet = new HashSet<string>(lokacijeDogadjaja ?? new List<string>());

                foreach (var cen in fallback)
                {
                    if (!string.IsNullOrEmpty(cen.LokacijaId) && lokacijaSet.Contains(cen.LokacijaId))
                    {
                        if (!rezultat.Any(x => x.Id == cen.Id))
                        {
                            rezultat.Add(cen);
                        }
                    }
                }
            }

            return rezultat;
        }

        public async Task<Cenovnik> VratiCenovnikPoIdAsync(string id) =>
            await _cenovnici.Find(c => c.Id == id).FirstOrDefaultAsync();

        public async Task<bool> AzurirajCenovnikAsync(AzurirajCenovnikDto dto)
        {
            var filter = Builders<Cenovnik>.Filter.Eq(c => c.Id, dto.Id);
            var update = Builders<Cenovnik>.Update;

            var updateDef = new List<UpdateDefinition<Cenovnik>>();

            if (!string.IsNullOrEmpty(dto.Naziv))
                updateDef.Add(update.Set(c => c.Naziv, dto.Naziv));

            if (!string.IsNullOrEmpty(dto.LokacijaId))
                updateDef.Add(update.Set(c => c.LokacijaId, dto.LokacijaId));

            if (!string.IsNullOrEmpty(dto.DogadjajId))
                updateDef.Add(update.Set(c => c.DogadjajId, dto.DogadjajId));

            if (dto.StavkeIds != null)
            {
                var stavkeObjIds = new List<string>();
                foreach (var stavkaId in dto.StavkeIds)
                    stavkeObjIds.Add(stavkaId);

                updateDef.Add(update.Set(c => c.Stavke, stavkeObjIds));
            }

            if (updateDef.Count > 0)
            {
                var combinedUpdate = update.Combine(updateDef);
                var result = await _cenovnici.UpdateOneAsync(filter, combinedUpdate);
                return result.ModifiedCount > 0;
            }

            return false;
        }

        public async Task<bool> ObrisiCenovnikAsync(string id)
        {
            var result = await _cenovnici.DeleteOneAsync(c => c.Id == id);
            return result.DeletedCount > 0;
        }

        public async Task<bool> DodajStavkuAsync(string cenovnikId, string stavkaId)
        {
            var filter = Builders<Cenovnik>.Filter.Eq(c => c.Id, cenovnikId);
            var update = Builders<Cenovnik>.Update.Push(c => c.Stavke, stavkaId);
            var result = await _cenovnici.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }

        public async Task<bool> UkloniStavkuAsync(string cenovnikId, string stavkaId)
        {
            var filter = Builders<Cenovnik>.Filter.Eq(c => c.Id, cenovnikId);
            var update = Builders<Cenovnik>.Update.Pull(c => c.Stavke, stavkaId);
            var result = await _cenovnici.UpdateOneAsync(filter, update);
            return result.ModifiedCount > 0;
        }
    }
}