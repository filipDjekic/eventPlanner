using System.ComponentModel.DataAnnotations;

namespace EventOrganizerAPI.DTOs.Cenovnik
{
    public class KreirajStavkuDto
    {
        [Required]
        public string Naziv { get; set; }

        public string? Opis { get; set; }

        [Required]
        public decimal Cena { get; set; }

        public int Kolicina { get; set; }

        public string? URLslike { get; set; }

        [Required]
        public string CenovnikId { get; set; }
    }
}
