using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EventOrganizerAPI.Models
{ 
    public class Podrucje
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string DogadjajId { get; set; }
        public string DanId { get; set; }
        public string Naziv {  get; set; }

        public List<string> Lokacije { get; set; }

        public List<List<double>> Koordinate { get; set; }

        public string HEXboja {  get; set; }
    }
}
