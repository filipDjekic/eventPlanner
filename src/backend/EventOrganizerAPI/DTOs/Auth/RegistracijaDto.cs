namespace EventOrganizerAPI.DTOs.Auth
{
    public class RegistracijaDto
    {
        public string ImeIPrezime { get; set; }
        public string Email { get; set; }
        public string KorisnickoIme { get; set; }
        public string Sifra { get; set; }
        public string Uloga { get; set; } // korisnik | organizator | dobavljac
        public string BrojTelefona { get; set; }
        public string Adresa { get; set; }
    }
}
