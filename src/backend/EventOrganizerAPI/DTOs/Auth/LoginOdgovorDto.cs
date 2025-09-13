namespace EventOrganizerAPI.DTOs.Auth
{
    public class LoginOdgovorDto
    {
        public string Token { get; set; }
        public string Uloga { get; set; }
        public string Id { get; set; }
        public string Ime { get; set; }
        public bool VerifikovanEmail { get; set; }
    }
}