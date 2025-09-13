using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;

namespace EventOrganizerAPI.Models
{
    public class Raspored
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string Naziv { get; set; }
        public string Opis { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string Lokacija { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string Dan { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Aktivnosti { get; set; } = new();
    }
}
