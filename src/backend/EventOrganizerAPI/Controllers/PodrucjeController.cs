using EventOrganizerAPI.Services;
using EventOrganizerAPI.DTOs.PodrucjeLokacija;
using Microsoft.AspNetCore.Mvc;
using Microsoft.AspNetCore.Authorization;
using System.Threading.Tasks;
using EventOrganizerAPI.DTOs;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/podrucja")]
    public class PodrucjeController : ControllerBase
    {
        private readonly PodrucjeServis _podrucjeServis;

        public PodrucjeController(PodrucjeServis podrucjeServis)
        {
            _podrucjeServis = podrucjeServis;
        }

        [HttpPost("kreiraj")]
        public async Task<IActionResult> KreirajPodrucje([FromBody] PodrucjeKreirajDto dto)
        {
            var novoPodrucje = await _podrucjeServis.KreirajPodrucjeAsync(dto);
            return CreatedAtAction(nameof(VratiPoId), new { id = novoPodrucje.Id }, novoPodrucje);
        }

        [HttpGet("vrati-sve")]
        public async Task<ActionResult<List<PrikazPodrucjeDto>>> VratiSva()
        {
            return Ok(await _podrucjeServis.VratiSvaPodrucjaAsync());
        }

        [HttpGet("vrati-po-id/{id}")]
        public async Task<ActionResult<PrikazPodrucjeDto>> VratiPoId(string id)
        {
            var podrucje = await _podrucjeServis.VratiPodrucjePoIdAsync(id);
            if (podrucje == null) return NotFound();
            return Ok(podrucje);
        }

        [HttpPut("azuriraj/{id}")]
        public async Task<IActionResult> AzurirajPodrucje(string id, [FromBody] PodrucjeAzurirajDto dto)
        {
            if (id != dto.Id) return BadRequest("ID u URL-u i DTO se ne poklapaju.");

            var uspesno = await _podrucjeServis.AzurirajPodrucjeAsync(dto);
            if (!uspesno) return NotFound();

            return NoContent();
        }

        [HttpDelete("obrisi/{id}")]
        public async Task<IActionResult> ObrisiPodrucje(string id)
        {
            var uspesno = await _podrucjeServis.ObrisiPodrucjeAsync(id);
            if (!uspesno) return NotFound();
            return NoContent();
        }
    }
}
