using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System.Collections.Generic;

namespace EventOrganizerAPI.Models
{
    public class Dobavljac
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string ImeIPrezime { get; set; }
        public string Email { get; set; }
        public string KorisnickoIme { get; set; }
        public string Sifra { get; set; }
        public string BrojTelefona { get; set; }
        public string Adresa { get; set; }
        public bool VerifikovanEmail { get; set; }
        public string Uloga { get; set; } = "dobavljac";

        // Reference na resurse koje dobavljač nudi
        public List<string> Resursi { get; set; } = new List<string>(); // ObjectId-ovi iz kolekcije Resursi
    }
}