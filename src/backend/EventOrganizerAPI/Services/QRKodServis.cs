using QRCoder;
using MongoDB.Driver;
using EventOrganizerAPI.Models;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Servisi
{
    public class QRKodServis
    {
        private readonly IMongoCollection<KupljenaKarta> _kupljeneKarte;
        private readonly string _baseUrl;

        public QRKodServis(IMongoDatabase db, IConfiguration config)
        {
            _kupljeneKarte = db.GetCollection<KupljenaKarta>("KupljeneKarte");
            _baseUrl = config["App:BaseUrl"] ?? "http://localhost:5246"; 
        }

        // Generiše QR kod koji sadrži link za validaciju
        public string GenerisiTrajniQRKod(string kupljenaKartaId)
        {
            var link = $"{_baseUrl}/api/karta-validacija/{kupljenaKartaId}";
            var generator = new QRCodeGenerator();
            var qrPodaci = generator.CreateQrCode(link, QRCodeGenerator.ECCLevel.Q);
            var svgQr = new SvgQRCode(qrPodaci);

            return svgQr.GetGraphic(5);
        }

        // Validira QR kod (da li karta postoji i da li je validna)
        public async Task<bool> ValidirajQRKodAsync(string kupljenaKartaId)
        {
            var karta = await _kupljeneKarte.Find(k => k.Id == kupljenaKartaId).FirstOrDefaultAsync();
            return karta != null && karta.Validna;
        }
    }
}