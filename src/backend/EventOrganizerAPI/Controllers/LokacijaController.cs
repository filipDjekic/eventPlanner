using EventOrganizerAPI.DTOs;
using EventOrganizerAPI.DTOs.PodrucjeLokacija;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/lokacije")]
    public class LokacijaController : ControllerBase
    {
        private readonly LokacijaServis _lokacijaServis;

        public LokacijaController(LokacijaServis lokacijaServis)
        {
            _lokacijaServis = lokacijaServis;
        }

        [HttpPost("kreiraj")]
        public async Task<IActionResult> Kreiraj([FromBody] KreirajLokacijuDto dto)
        {
            var lokacija = await _lokacijaServis.KreirajLokacijuAsync(dto);
            return Ok(lokacija);
        }

        [HttpGet("vrati-sve")]
        public async Task<ActionResult<List<PrikazLokacijaDto>>> VratiSve()
        {
            return Ok(await _lokacijaServis.VratiSveLokacijeAsync());
        }

        [HttpGet("vrati-po-id/{id}")]
        public async Task<ActionResult<PrikazLokacijaDto>> VratiPoId(string id)
        {
            var lokacija = await _lokacijaServis.VratiLokacijuPoIdAsync(id);
            if (lokacija == null) return NotFound();
            return Ok(lokacija);
        }

        [HttpPut("azuriraj/{id}")]
        public async Task<IActionResult> Azuriraj(string id, [FromBody] AzurirajLokacijuDto dto)
        {
            dto.Id = id;
            var uspeh = await _lokacijaServis.AzurirajLokacijuAsync(dto);
            if (!uspeh) return BadRequest("Neuspešna izmena lokacije.");
            return Ok("Lokacija uspešno ažurirana.");
        }

        [HttpDelete("obrisi/{id}")]
        public async Task<IActionResult> Obrisi(string id)
        {
            var uspeh = await _lokacijaServis.ObrisiLokacijuAsync(id);
            if (!uspeh) return NotFound();
            return NoContent();
        }

        [HttpGet("dogadjaj/{dogadjajId}")]
        public async Task<IActionResult> VratiLokacijeZaDogadjaj(string dogadjajId)
        {
            var lokacije = await _lokacijaServis.VratiLokacijeZaDogadjajAsync(dogadjajId);
            return Ok(lokacije);
        }
    }
}
