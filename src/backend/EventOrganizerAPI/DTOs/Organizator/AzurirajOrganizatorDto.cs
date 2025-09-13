namespace EventOrganizerAPI.DTOs.Organizator
{
    public class AzurirajOrganizatorDto
    {
        public string Id { get; set; }
        public string? ImeIPrezime { get; set; }
        public string? Email { get; set; }
        public string? KorisnickoIme { get; set; }
        public string? Sifra { get; set; }
        public string? Adresa { get; set; }
        public string? BrojTelefona { get; set; }
        public bool? VerifikovanEmail { get; set; }
    }
}