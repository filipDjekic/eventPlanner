using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EventOrganizerAPI.Models
{
    public class Korisnik
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string KorisnickoIme { get; set; }
        public string Email { get; set; }
        public string Sifra { get; set; }
        public string BrojTelefona { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Karte { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> OmiljeniDogadjaji { get; set; }

        public string Uloga { get; set; }

        public bool VerifikovanEmail { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string? Kartica { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Notifikacije { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> IstorijaTransakcija { get; set; }
        public decimal Balans { get; set; }
    }
}
