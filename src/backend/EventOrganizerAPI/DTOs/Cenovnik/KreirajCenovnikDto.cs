using System.Collections.Generic;
using System.ComponentModel.DataAnnotations;

namespace EventOrganizerAPI.DTOs.Cenovnik
{
    public class KreirajCenovnikDto
    {
        [Required]
        public string Naziv { get; set; }

        [Required]
        public string LokacijaId { get; set; }

        public List<string> StavkeIds { get; set; } = new();
    }
}
