using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EventOrganizerAPI.Models
{
    public class CenovnikStavka
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id {  get; set; }

        public string Naziv {  get; set; }
        public string Opis { get; set; }
        public decimal Cena { get; set; }
        public int Kolicina { get; set; }
        public string UrlSlika { get; set; }

    }
}
