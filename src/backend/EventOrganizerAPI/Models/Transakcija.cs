using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EventOrganizerAPI.Models
{
    public class Transakcija
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string KarticaId { get; set; }

        public decimal Iznos { get; set; }

        public DateTime Vreme { get; set; }

        public string Opis { get; set; }
    }
}
