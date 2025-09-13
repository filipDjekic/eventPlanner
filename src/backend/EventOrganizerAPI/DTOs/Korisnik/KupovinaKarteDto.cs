using MongoDB.Driver;

namespace EventOrganizerAPI.DTOs.Korisnik
{
    public class KupovinaKarteDto
    {
        public string KorisnikId { get; set; }
        public string KartaId { get; set; }
        public int Kolicina { get; set; }
    }
}
