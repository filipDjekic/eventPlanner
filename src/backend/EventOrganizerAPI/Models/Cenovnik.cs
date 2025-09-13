using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EventOrganizerAPI.Models
{
    public class Cenovnik
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string Naziv {  get; set; }

        public string LokacijaId { get; set; }
        public List<string> Stavke { get; set; }

    }
}
