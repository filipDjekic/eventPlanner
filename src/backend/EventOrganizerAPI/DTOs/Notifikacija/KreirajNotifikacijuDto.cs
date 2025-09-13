using EventOrganizerAPI.Models.Enums;

namespace EventOrganizerAPI.DTOs
{
    public class KreirajNotifikacijuDto
    {
        public string DogadjajId { get; set; }
        public string Naziv {  get; set; }
        public string Sadrzaj { get; set; }
        public TipNotifikacije Tip {  get; set; }
        public DateTime DatumSlanja { get; set; }
    }
}
