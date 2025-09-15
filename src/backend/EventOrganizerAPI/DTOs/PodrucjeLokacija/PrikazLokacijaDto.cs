using System.Collections.Generic;
using EventOrganizerAPI.Models.Enums;

namespace EventOrganizerAPI.DTOs
{
    public class PrikazLokacijaDto
    {
        public string Id { get; set; }
        public string DogadjajId { get; set; }
        public string Naziv { get; set; }
        public string Opis { get; set; }
        public double XKoordinata { get; set; }
        public double YKoordinata { get; set; }
        public string URLSlikeMape { get; set; }
        public string Cenovnik { get; set; }
        public string Podrucje { get; set; }
        public string HEXboja { get; set; }
        public string TipLokacije { get; set; }
        public List<string> Resursi { get; set; }
    }
}
