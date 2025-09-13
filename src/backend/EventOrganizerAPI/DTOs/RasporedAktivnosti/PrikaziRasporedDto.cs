using System.Collections.Generic;

namespace EventOrganizerAPI.DTOs.RasporedAktivnosti
{
    public class PrikaziRasporedDto
    {
        public string Id { get; set; }
        public string Naziv { get; set; }
        public string Opis { get; set; }
        public string Lokacija { get; set; }
        public string Dan { get; set; }
        public List<string> Aktivnosti { get; set; }
    }
}
