namespace EventOrganizerAPI.DTOs.Karta
{
    public class KreirajKartuDto
    {
        public string Naziv { get; set; } = string.Empty;
        public string Opis { get; set; } = string.Empty;
        public string HEXboja { get; set; } = string.Empty;
        public string Tip { get; set; } = string.Empty; // "VIP", "Regular" itd.
        public string URLslike { get; set; } = string.Empty;
        public decimal Cena { get; set; }
        public int BrojKarata { get; set; }
        public string DogadjajId { get; set; } = string.Empty;
        public string DanId { get; set; } = string.Empty;
    }
}