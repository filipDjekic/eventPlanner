using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EventOrganizerAPI.Models
{
    public class Napomena
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string Sadrzaj { get; set; }
        public string Tip { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string Dogadjaj { get; set; }
    }
}
