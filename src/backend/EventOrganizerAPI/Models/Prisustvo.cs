using EventOrganizerAPI.Models.Enums;

namespace EventOrganizerAPI.Models
{
    public class Prisustvo
    {
        public string Id { get; set; }
        public string KorisnikId { get; set; }
        public string DogadjajId { get; set; }

        public DateTime VremeDolaska { get; set; }
        public StatusPrisustva Status { get; set; }
    }
}
