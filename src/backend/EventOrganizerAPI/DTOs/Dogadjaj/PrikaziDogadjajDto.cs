using System;
using System.Collections.Generic;

namespace EventOrganizerAPI.Dtos.Dogadjaj
{
    public class PrikazDogadjajDto
    {
        public string Id { get; set; }
        public string Naziv { get; set; }
        public string Lokacija { get; set; }
        public DateTime DatumPocetka { get; set; }
        public DateTime DatumKraja { get; set; }
        public string URLalbuma { get; set; }
        public string Opis { get; set; }
        public int Kapacitet { get; set; }
        public List<string> Karte { get; set; } = new List<string>();
        public List<string> Dani { get; set; } = new List<string>();
        public List<string> Prijavljeni { get; set; } = new List<string>();
        public List<string> Tagovi { get; set; } = new List<string>();
        public List<string> Notifikacije { get; set; } = new List<string>();
        public List<string> Napomene { get; set; } = new List<string>();
        public string Organizator { get; set; }
        public string Status { get; set; }
        public string Kategorija { get; set; }
        public List<string> Resursi { get; set; } = new List<string>();
    }
}