using System.ComponentModel.DataAnnotations;

namespace EventOrganizerAPI.DTOs.Dogadjaj
{
    public class FileUploadDto
    {
        [Required(ErrorMessage ="Fajl je obavezan")]
        public IFormFile Slika { get; set; }
        public string Opis { get; set; }
        public string DogadjajId { get; set; }
    }
}
