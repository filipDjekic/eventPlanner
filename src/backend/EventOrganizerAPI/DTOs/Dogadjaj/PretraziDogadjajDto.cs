using System;
using System.Collections.Generic;

namespace EventOrganizerAPI.DTOs.Dogadjaj
{
    public class PretraziDogadjajDto
    {
        public string Naziv { get; set; }
        public List<string> Tagovi { get; set; } = new List<string>();
        public string Grad { get; set; }
        public string Drzava { get; set; }
        public DateTime? VremeOd { get; set; }
        public DateTime? VremeDo { get; set; }
        public bool? SortirajPoDatumu { get; set; } // true = najskoriji, false = najdalji
        public bool? SortirajPoPrijavljenima { get; set; } // true = najmanje, false = najvise
        public string Lokacija { get; set; }
    }
}