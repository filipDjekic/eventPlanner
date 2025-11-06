using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;

namespace EventOrganizerAPI.Models
{
    public class Cenovnik
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string Naziv {  get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string DogadjajId { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string LokacijaId { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Stavke { get; set; }

    }
}
