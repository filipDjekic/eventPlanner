using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;

namespace EventOrganizerAPI.Models
{
    public class Organizator
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string ImeIPrezime { get; set; }
        public string Email { get; set; }
        public string Sifra { get; set; }
        public string KorisnickoIme { get; set; }
        public string Uloga { get; set; } = "Organizator";
        public bool VerifikovanEmail { get; set; }

        public string BrojTelefona { get; set; }
        public string Adresa { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Dogadjaji { get; set; } = new List<string>();
    }
}
