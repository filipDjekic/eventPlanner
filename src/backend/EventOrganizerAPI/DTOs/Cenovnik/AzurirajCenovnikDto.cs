using System.Collections.Generic;

namespace EventOrganizerAPI.DTOs.Cenovnik
{
    public class AzurirajCenovnikDto
    {
        public string? Id { get; set; }
        public string? Naziv { get; set; }
        public string? LokacijaId { get; set; }
        public string? DogadjajId { get; set; }
        public List<string>? StavkeIds { get; set; }
    }
}
