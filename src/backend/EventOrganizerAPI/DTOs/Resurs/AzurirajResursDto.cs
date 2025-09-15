using EventOrganizerAPI.Models.Enums;

namespace EventOrganizerAPI.DTOs.Resurs
{
    public class AzurirajResursDto
    {
        public string? Naziv { get; set; }
        public string? Opis { get; set; }
        public string? Tip { get; set; }
        public int? Kolicina { get; set; }
        public string? Lokacija { get; set; }
        public string? Aktivnost { get; set; }
    }
}
