using EventOrganizerAPI.Models.Enums;

namespace EventOrganizerAPI.DTOs.Resurs
{
    public class KreirajResursDto
    {
        public string Naziv { get; set; }
        public string Opis { get; set; }
        public string Tip { get; set; }
        public int UkupnoKolicina { get; set; }  
        public string Dobavljac { get; set; }
        public string? Lokacija { get; set; }
        public string? Aktivnost { get; set; }
    }
}