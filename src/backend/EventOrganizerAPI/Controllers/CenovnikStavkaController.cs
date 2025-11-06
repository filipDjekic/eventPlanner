using EventOrganizerAPI.DTOs.Cenovnik;
using EventOrganizerAPI.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/cenovnik-stavke")]
    public class CenovnikStavkaController : ControllerBase
    {
        private readonly CenovnikStavkaServis _stavkaServis;

        public CenovnikStavkaController(CenovnikStavkaServis stavkaServis)
        {
            _stavkaServis = stavkaServis;
        }

        [HttpPost("kreiraj")]
        
        public async Task<IActionResult> Kreiraj([FromBody] KreirajStavkuDto dto)
        {
            var stavka = await _stavkaServis.KreirajStavkuAsync(dto);
            return Ok(stavka);
        }

        [HttpGet("vrati-sve")]
        public async Task<IActionResult> VratiSve()
        {
            var lista = await _stavkaServis.VratiSveStavkeAsync();
            return Ok(lista);
        }

        [HttpGet("vrati-po-id/{id}")]
        public async Task<IActionResult> VratiPoId(string id)
        {
            var stavka = await _stavkaServis.VratiStavkuPoIdAsync(id);
            if (stavka == null) return NotFound();
            return Ok(stavka);
        }

        [HttpPut("azuriraj/{id}")]

        public async Task<IActionResult> Azuriraj(string id, [FromBody] AzurirajStavkuDto dto)
        {
            dto.Id = id;
            var success = await _stavkaServis.AzurirajStavkuAsync(dto);
            if (!success) return BadRequest("Neuspešna izmena stavke.");
            return Ok("Stavka uspešno ažurirana.");
        }

        [HttpDelete("obrisi/{id}")]
        
        public async Task<IActionResult> Obrisi(string id)
        {
            var success = await _stavkaServis.ObrisiStavkuAsync(id);
            if (!success) return NotFound();
            return NoContent();
        }
    }
}
