using System.Collections.Generic;

namespace EventOrganizerAPI.DTOs.Cenovnik
{
    public class PrikaziCenovnikDto
    {
        public string Id { get; set; }
        public string Naziv { get; set; }
        public string LokacijaId { get; set; }
        public List<string> StavkeIds { get; set; }
    }
}
