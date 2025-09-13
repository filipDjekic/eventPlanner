namespace EventOrganizerAPI.DTOs.Dobavljac
{
    public class PrikaziDobavljacDto
    {
        public string Id { get; set; }
        public string ImeIPrezime { get; set; }
        public string Email { get; set; }
        public string KorisnickoIme { get; set; }
        public string BrojTelefona { get; set; }
        public string Adresa { get; set; }
        public bool VerifikovanEmail { get; set; }
        public List<string> Resursi { get; set; }
    }
}