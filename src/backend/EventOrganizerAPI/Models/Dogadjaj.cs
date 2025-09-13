using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;
using System;
using System.Collections.Generic;

namespace EventOrganizerAPI.Models
{
    public class Dogadjaj
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonElement("naziv")]
        public string Naziv { get; set; }

        [BsonElement("lokacija")]
        public string Lokacija { get; set; }

        [BsonElement("datumPocetka")]
        public DateTime DatumPocetka { get; set; }

        [BsonElement("datumKraja")]
        public DateTime DatumKraja { get; set; }

        [BsonElement("urlAlbuma")]
        public string URLalbuma { get; set; }

        [BsonElement("opis")]
        public string Opis { get; set; }

        [BsonElement("kapacitet")]
        public int Kapacitet { get; set; }

        [BsonElement("karte")]
        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Karte { get; set; } = new List<string>();

        [BsonElement("dani")]
        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Dani { get; set; } = new List<string>();

        [BsonElement("prijavljeni")]
        public List<string> Prijavljeni { get; set; } = new List<string>();

        [BsonElement("tagovi")]
        public List<string> Tagovi { get; set; } = new List<string>();

        [BsonElement("notifikacije")]
        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Notifikacije { get; set; } = new List<string>();

        [BsonElement("napomene")]
        public List<string> Napomene { get; set; } = new List<string>();

        [BsonElement("organizator")]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Organizator { get; set; }

        [BsonElement("status")]
        public string Status { get; set; }
        public string Kategorija { get; set; } // NOVO POLJE

        [BsonElement("resursi")]
        [BsonRepresentation(BsonType.ObjectId)]
        public List<string> Resursi { get; set; } = new List<string>();
    }
}