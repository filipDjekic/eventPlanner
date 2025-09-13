using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace EventOrganizerAPI.Models
{
    public class DanDogadjaja
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string Naziv { get; set; }
        public string Opis { get; set; }
        public DateTime DatumOdrzavanja { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Podrucja { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string Dogadjaj { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Aktivnosti { get; set; }
    }
}
