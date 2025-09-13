using System;
using System.Collections.Generic;

namespace EventOrganizerAPI.DTOs.Dogadjaj
{
    public class KreirajDogadjajDto
    {
        public string Naziv { get; set; }
        public string Lokacija { get; set; }
        public DateTime DatumPocetka { get; set; }
        public DateTime DatumKraja { get; set; }
        public string? URLalbuma { get; set; }
        public string Opis { get; set; }
        public int Kapacitet { get; set; }
        public List<string> Tagovi { get; set; } = new List<string>();
        public string OrganizatorId { get; set; }
        public string Status { get; set; }
        public string Kategorija { get; set; }
        public List<string> Napomene { get; set; } = new List<string>();
        public List<string> Resursi { get; set; } = new List<string>();
    }
}