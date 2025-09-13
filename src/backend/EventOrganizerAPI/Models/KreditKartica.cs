using MongoDB.Bson;
using MongoDB.Bson.Serialization.Attributes;

namespace EventOrganizerAPI.Models
{
    public class KreditKartica
    {
        [BsonId]
        [BsonRepresentation(BsonType.ObjectId)]
        public string Id { get; set; }

        [BsonRepresentation(BsonType.ObjectId)]
        public string KorisnikId { get; set; }

        public string BrojKartice { get; set; }

        public string ImeVlasnika { get; set; }

        public string DatumIsteka { get; set; }

        public decimal Stanje { get; set; }
    }
}
