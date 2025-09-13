namespace EventOrganizerAPI.DTOs.Korisnik
{
    public class AzurirajKorisnikDto
    {
        public string Id { get; set; }
        public string? KorisnickoIme { get; set; }
        public string? Email { get; set; }
        public string? BrojTelefona { get; set; }
        public string? Uloga { get; set; }
        public bool? VerifikovanEmail { get; set; }
        public string? Kartica { get; set; }
    }
}
