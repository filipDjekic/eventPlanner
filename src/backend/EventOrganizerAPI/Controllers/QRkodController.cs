using EventOrganizerAPI.Services;
using EventOrganizerAPI.Services.Interfaces;
using EventOrganizerAPI.Servisi;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [Route("api/qr-kod-generator")]
    [ApiController]
    public class QRKodKontroler : ControllerBase
    {
        private readonly QRKodServis _qrServis;
        private readonly IKorisnikServis _korisnikServis;
        private readonly IKartaServis _kartaServis;
        private readonly IConfiguration _configuration;

        public QRKodKontroler(
            QRKodServis qrServis,
            IKorisnikServis korisnikServis,
            IKartaServis kartaServis,
            IConfiguration configuration)
        {
            _qrServis = qrServis;
            _korisnikServis = korisnikServis;
            _kartaServis = kartaServis;
            _configuration = configuration;
        }

        // GET: api/qr-kod-generator/generisi/{kupljenaKartaId}
        [HttpGet("generisi/{kupljenaKartaId}")]
        public IActionResult GenerisiQRKod(string kupljenaKartaId)
        {
            var svg = _qrServis.GenerisiTrajniQRKod(kupljenaKartaId);
            return Content(svg, "image/svg+xml");
        }

        // POST: api/qr-kod-generator/generisi-pdf/{kupljenaKartaId}
        [HttpPost("generisi-pdf/{kupljenaKartaId}")]
        public async Task<IActionResult> GenerisiPdfQrKod(string kupljenaKartaId)
        {
            // 1. Generisanje QR koda
            var qrSvg = _qrServis.GenerisiTrajniQRKod(kupljenaKartaId);

            // 2. Uzimanje podataka korisnika i karte
            var kupljenaKarta = await _kartaServis.VratiKupljenuKartuPoId(kupljenaKartaId);
            if (kupljenaKarta == null)
                return NotFound("Kupljena karta nije pronađena.");

            var korisnik = await _korisnikServis.VratiPoId(kupljenaKarta.KorisnikId);
            var karta = await _kartaServis.VratiKartuPoId(kupljenaKarta.KartaId);

            // 3. Generisanje PDF
            var pdfServis = new PdfServis();
            var pdfBytes = pdfServis.GenerisiKartuPdf(karta.Naziv, korisnik.KorisnickoIme, qrSvg);

            // 4. Slanje PDF mejlom
            var emailServis = new EmailServis(_configuration);
            await emailServis.PosaljiEmailSaPdf(korisnik.Email, "Vaša karta", "U prilogu je PDF sa QR kodom za ulazak.", pdfBytes, "karta.pdf");

            return Ok("QR kod je generisan, PDF je poslat na email!");
        }
    }
}