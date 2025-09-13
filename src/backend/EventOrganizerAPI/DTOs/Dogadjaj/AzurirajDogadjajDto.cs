using System;
using System.Collections.Generic;

namespace EventOrganizerAPI.DTOs.Dogadjaj
{
    public class AzurirajDogadjajDto
    {
        public string Id { get; set; }
        public string? Naziv { get; set; }
        public string? Opis { get; set; }
        public DateTime? DatumPocetka { get; set; }
        public DateTime? DatumKraja { get; set; }
        public string? Status { get; set; }
        public List<string>? Tagovi { get; set; } = new List<string>();
        public string? Lokacija { get; set; }
        public string? Kategorija { get; set; } // NOVO POLJE
        public List<string>? Napomene { get; set; } = new List<string>(); // NOVO POLJE
        public List<string>? Resursi { get; set; } = new List<string>(); 
    }
}