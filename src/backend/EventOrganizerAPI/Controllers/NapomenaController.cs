using EventOrganizerAPI.DTOs.Napomena;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/napomene")]
    public class NapomenaController : ControllerBase
    {
        private readonly INapomenaServis _servis;

        public NapomenaController(INapomenaServis servis)
        {
            _servis = servis;
        }

        [HttpPost("kreiraj")]
        public async Task<IActionResult> Kreiraj([FromBody] KreirajNapomenuDto dto)
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
        public async Task<IActionResult> Azuriraj(string id, [FromBody] AzurirajNapomenuDto dto)
        {
            await _servis.Azuriraj(id, dto);
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
