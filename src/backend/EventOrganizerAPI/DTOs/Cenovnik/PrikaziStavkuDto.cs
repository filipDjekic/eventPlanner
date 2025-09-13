namespace EventOrganizerAPI.DTOs.Cenovnik
{
    public class PrikaziStavkuDto
    {
        public string Id { get; set; }
        public string Naziv { get; set; }
        public string? Opis { get; set; }
        public decimal Cena { get; set; }
        public int Kolicina { get; set; }
        public string? URLslike { get; set; }
        public string CenovnikId { get; set; }
    }
}
