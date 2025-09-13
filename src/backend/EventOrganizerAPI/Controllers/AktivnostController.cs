using EventOrganizerAPI.DTOs.RasporedAktivnosti;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/aktivnosti")]
    public class AktivnostController : ControllerBase
    {
        private readonly IAktivnostiServis _servis;

        public AktivnostController(IAktivnostiServis servis)
        {
            _servis = servis;
        }

        [HttpPost("kreiraj")]
        public async Task<IActionResult> Kreiraj([FromBody] KreirajAktivnostDto dto)
        {
            var rezultat = await _servis.Kreiraj(dto);
            return Ok(rezultat);
        }

        [HttpGet("vrati-sve")]
        public async Task<IActionResult> VratiSve()
        {
            var rezultat = await _servis.VratiSve();
            return Ok(rezultat);
        }

        [HttpGet("vrati-po-id/{id}")]
        public async Task<IActionResult> VratiPoId(string id)
        {
            var rezultat = await _servis.VratiPoId(id);
            if (rezultat == null) return NotFound();
            return Ok(rezultat);
        }

        [HttpPut("azuriraj/{id}")]
        public async Task<IActionResult> Azuriraj([FromBody] AzurirajAktivnostDto dto)
        {
            await _servis.Azuriraj(dto);
            return NoContent();
        }

        [HttpDelete("obrisi/{id}")]
        public async Task<IActionResult> Obrisi(string id)
        {
            await _servis.Obrisi(id);
            return NoContent();
        }
    }
}
