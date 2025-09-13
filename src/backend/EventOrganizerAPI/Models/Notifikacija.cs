using EventOrganizerAPI.Models.Enums;
using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;

namespace EventOrganizerAPI.Models
{
    public class Notifikacija
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string Naziv { get; set; } = string.Empty;
        public string Sadrzaj { get; set; } = string.Empty;
        public TipNotifikacije Tip { get; set; }
        public DateTime DatumSlanja { get; set; } = DateTime.Now;

        [BsonRepresentation(BsonType.ObjectId)]
        public string DogadjajId { get; set; } = string.Empty; // Obavezno za grupne notifikacije
    }
}