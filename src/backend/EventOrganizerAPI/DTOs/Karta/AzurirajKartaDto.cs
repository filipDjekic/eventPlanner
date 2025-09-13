namespace EventOrganizerAPI.DTOs.Karta
{
    public class AzurirajKartuDto
    {
        public string Id { get; set; } = string.Empty;
        public string? Naziv { get; set; } = string.Empty;
        public string? Opis { get; set; } = string.Empty;
        public decimal? Cena { get; set; }
        public string? HEXboja { get; set; }
        public int? BrojKarata { get; set; }
    }
}