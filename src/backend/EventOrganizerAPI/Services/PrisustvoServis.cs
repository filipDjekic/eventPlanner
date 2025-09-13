using EventOrganizerAPI.Models;
using EventOrganizerAPI.Models.Enums;
using MongoDB.Bson;
using MongoDB.Driver;

namespace EventOrganizerAPI.Services
{
    public class PrisustvoServis
    {
        private readonly IMongoCollection<Prisustvo> _prisustva;

        public PrisustvoServis(IMongoDatabase baza)
        {
            _prisustva = baza.GetCollection<Prisustvo>("Prisustva");
        }

        public async Task ZabeleziPrisustvo(string korisnikId, string dogadjajId)
        {
            var postoji = await _prisustva
                .Find(p => p.KorisnikId == korisnikId && p.DogadjajId == dogadjajId)
                .FirstOrDefaultAsync();

            if (postoji == null)
            {
                var novo = new Prisustvo
                {
                    Id = ObjectId.GenerateNewId().ToString(),
                    KorisnikId = korisnikId,
                    DogadjajId = dogadjajId,
                    VremeDolaska = DateTime.UtcNow,
                    Status = StatusPrisustva.Prisutan
                };
                await _prisustva.InsertOneAsync(novo);
            }
        }

        public List<Prisustvo> DobaviPrisustvaZaDogadjaj(string dogadjajId)
        {
            return _prisustva.Find(p => p.DogadjajId == dogadjajId).ToList();
        }
       
    }
}
