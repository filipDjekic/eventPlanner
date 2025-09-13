using EventOrganizerAPI.Models;
using MongoDB.Driver;
using System.Text;

namespace EventOrganizerAPI.Utils
{
    public static class GeneratorBrojaZaKartice
    {
        private static readonly Random random = new Random();
        public static async Task<string> GenerisiJedinstvenBrojKarticeAsync(IMongoCollection<KreditKartica> kartice)
        {
            string brojKartice;
            do
            {
                brojKartice = GenerisiBroj();
            }
            while (await BrojKarticePostojiAsync(kartice, brojKartice));

            return brojKartice;
        }
        private static string GenerisiBroj()
        {
            var sb = new StringBuilder();
            for(int i = 0; i < 16; i++)
            {
                sb.Append(random.Next(0, 10));
            }
            return sb.ToString();
        }
        private static async Task<bool> BrojKarticePostojiAsync(IMongoCollection<KreditKartica> kartice, string brojKartice)
        {
            var filter = Builders<KreditKartica>.Filter.Eq(k => k.BrojKartice, brojKartice);
            var result = await kartice.Find(filter).AnyAsync();
            return result;
        }
    }
}
