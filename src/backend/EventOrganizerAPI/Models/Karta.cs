using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using EventOrganizerAPI.Models.Enums;

namespace EventOrganizerAPI.Models
{
    public class Karta
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; } = string.Empty;

        public string Naziv { get; set; } = string.Empty;
        public string Opis { get; set; } = string.Empty;
        public string HEXboja { get; set; } = string.Empty;
        public string Tip { get; set; }
        public string URLslike { get; set; } = string.Empty;
        public decimal Cena { get; set; }
        public int BrojKarata { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string DogadjajId { get; set; } = string.Empty;
        public string DanId { get; set; } = string.Empty; //Nisam stavio ObjectId, kako ne bi doslo do problema jer je ovo novo dodato
    }
}