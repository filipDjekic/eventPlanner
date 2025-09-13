using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EventOrganizerAPI.Models
{
    public class QrToken
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        public string KorisnikId { get; set; }
        public string KartaId { get; set; }
        public string Token { get; set; }
        public DateTime ExpiresAt { get; set; }
    }
}