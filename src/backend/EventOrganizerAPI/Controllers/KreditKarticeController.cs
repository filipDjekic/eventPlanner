using EventOrganizerAPI.DTOs;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/kredit-kartica")]
    public class KarticaController : ControllerBase
    {
        private readonly IKarticaServis _karticaServis;

        public KarticaController(IKarticaServis karticaServis)
        {
            _karticaServis = karticaServis;
        }

        [HttpPost("kreiraj")]
        public async Task<ActionResult<KreditKartica>> Kreiraj(KreirajKarticaDto dto)
        {
            var kreirana = await _karticaServis.KreirajAsync(dto);
            return Ok(kreirana);
        }

        [HttpGet("vrati-stanje/{karticaId}")]
        public async Task<ActionResult<StanjeKarticeDto>> VratiStanje(string karticaId)
        {
            var stanje = await _karticaServis.VratiStanjeAsync(karticaId);
            if (stanje == null) return NotFound("Kartica nije pronađena.");

            return Ok(stanje);
        }

        [HttpPut("promeni-stanje")]
        public async Task<IActionResult> PromeniStanje(PromenaStanjaKarticeDto dto)
        {
            var uspeh = await _karticaServis.PromeniStanjeAsync(dto);
            if (!uspeh) return BadRequest("Neuspešna promena stanja.");

            return Ok("Stanje ažurirano.");
        }
    }
}
