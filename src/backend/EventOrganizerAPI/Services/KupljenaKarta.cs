using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EventOrganizerAPI.Models
{
    public class KupljenaKarta
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string KartaId { get; set; } // Ref na Karta

        [BsonRepresentation(BsonType.ObjectId)]
        public string KorisnikId { get; set; }

        public DateTime DatumVremeKupovine { get; set; }

        public bool Validna { get; set; } = true;
    }
}