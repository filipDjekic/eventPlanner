using EventOrganizerAPI.DTOs.Dobavljac;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/dobavljaci")]
    public class DobavljacController : ControllerBase
    {
        private readonly IDobavljacServis _dobavljacServis;

        public DobavljacController(IDobavljacServis dobavljacServis)
        {
            _dobavljacServis = dobavljacServis;
        }

        [HttpGet("vrati-sve")]
        public async Task<ActionResult<List<PrikaziDobavljacDto>>> VratiSve()
        {
            return await _dobavljacServis.VratiSve();
        }

        [HttpGet("vrati-po-id/{id}")]
        public async Task<ActionResult<PrikaziDobavljacDto>> VratiPoId(string id)
        {
            var dobavljac = await _dobavljacServis.VratiPoId(id);
            if (dobavljac == null) return NotFound();
            return dobavljac;
        }
        
        [HttpPut("azuriraj/{id}")]
        public async Task<IActionResult> Azuriraj(string id, [FromBody] AzurirajDobavljacDto dto)
        {
            dto.Id = id;
            await _dobavljacServis.Azuriraj(dto);
            return NoContent();
        }

        [HttpPost("promeni-sifru/{id}")]
        public async Task<IActionResult> PromeniSifru(string id, [FromBody] PromeniSifruDto dto)
        {
            await _dobavljacServis.PromeniSifru(id, dto.TrenutnaSifra, dto.NovaSifra);
            return NoContent();
        }

        [HttpDelete("obrisi/{id}")]
        public async Task<IActionResult> Obrisi(string id)
        {
            await _dobavljacServis.Obrisi(id);
            return NoContent();
        }
    }
}