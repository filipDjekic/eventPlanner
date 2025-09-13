namespace EventOrganizerAPI.Dtos.Karta
{
    public class PrikazKartaDto
    {
        public string Id { get; set; }
        public string Naziv { get; set; }
        public string Opis { get; set; }
        public string HEXboja { get; set; }
        public string Tip { get; set; } // kao string jer je enum
        public string URLslike { get; set; }
        public decimal Cena { get; set; }
        public int BrojKarata { get; set; }
        public string DogadjajId { get; set; }
        public string DanId { get; set; }
    }
}
