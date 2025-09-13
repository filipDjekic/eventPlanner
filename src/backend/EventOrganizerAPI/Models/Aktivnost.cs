using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;
using EventOrganizerAPI.Models.Enums;

namespace EventOrganizerAPI.Models
{
    public class Aktivnost
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string Naziv { get; set; }
        public string Opis { get; set; }
        public DateTime DatumVremePocetka { get; set; }
        public DateTime DatumVremeKraja { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string Lokacija { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string Dan { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string Dogadjaj { get; set; }

        [BsonRepresentation(BsonType.String)]
        public TipAktivnosti Tip { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Notifikacije { get; set; } = new();

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Resursi { get; set; } = new();
    }
}
