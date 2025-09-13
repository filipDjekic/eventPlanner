using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EventOrganizerAPI.Models
{
    public class Statistika
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string DogadjajId { get; set; }

        public int BrojPrijava { get; set; }

        public int BrojProdatihKarata { get; set; }

        public decimal UkupanPrihod { get; set; }
    }
}
