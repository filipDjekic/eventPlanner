using EventOrganizerAPI.Services;
using EventOrganizerAPI.Services.Interfaces;
using EventOrganizerAPI.Servisi;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/prisustvo")]
    public class PrisustvoKontroler : ControllerBase
    {
        private readonly PrisustvoServis _prisustvoServis;
        private readonly IKartaServis _kartaServis;

        public PrisustvoKontroler(PrisustvoServis prisustvoServis, IKartaServis kartaServis)
        {
            _prisustvoServis = prisustvoServis;
            _kartaServis = kartaServis;
        }

        [HttpPost("validiraj")]
        public async Task<IActionResult> Validiraj([FromBody] string skeniraniKod)
        {
            // skeniraniKod je Id KupljeneKarte iz QR koda
            var kupljenaKarta = await _kartaServis.VratiKupljenuKartuPoId(skeniraniKod);
            if (kupljenaKarta == null || !kupljenaKarta.Validna)
                return NotFound("Karta nije validna.");

            var karta = await _kartaServis.VratiKartuPoId(kupljenaKarta.KartaId);
            if (karta == null)
                return NotFound("Karta nije pronađena.");

            var dogadjajId = karta.DogadjajId;

            await _prisustvoServis.ZabeleziPrisustvo(kupljenaKarta.KorisnikId, dogadjajId);

            return Ok("Prisustvo potvrđeno.");
        }

        [HttpGet("prisutni/{dogadjajId}")]
        public IActionResult DobaviPrisutne(string dogadjajId)
        {
            var lista = _prisustvoServis.DobaviPrisustvaZaDogadjaj(dogadjajId);
            return Ok(lista);
        }
    }
}