using MongoDB.Bson.Serialization.Attributes;

namespace EventOrganizerAPI.Models
{
    public class Slika
    {
        public string PutanjaDoSlike { get; set; }//npr assets/images/slika.jpg
        public string Naziv { get;set; }
    }
}
