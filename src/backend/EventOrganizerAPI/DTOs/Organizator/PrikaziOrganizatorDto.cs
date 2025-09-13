namespace EventOrganizerAPI.DTOs.Organizator
{
    public class PrikaziOrganizatorDto
    {
        public string Id { get; set; }
        public string ImeIPrezime { get; set; }
        public string Email { get; set; }
        public string KorisnickoIme { get; set; }
        public bool VerifikovanEmail { get; set; }
        public string Uloga { get; set; }
        public string Adresa { get; set; }
        public string BrojTelefona { get; set; }
        public List<string> Dogadjaji { get; set; }
    }
}