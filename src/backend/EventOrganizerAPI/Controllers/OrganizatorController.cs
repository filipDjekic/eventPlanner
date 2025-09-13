using EventOrganizerAPI.DTOs.Organizator;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/organizatori")]
    public class OrganizatorController : ControllerBase
    {
        private readonly IOrganizatorServis _servis;

        public OrganizatorController(IOrganizatorServis servis)
        {
            _servis = servis;
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
            var organizator = await _servis.VratiPoId(id);
            if (organizator == null) return NotFound();
            return Ok(organizator);
        }

        [HttpPut("azuriraj")]
        public async Task<IActionResult> Azuriraj([FromBody] AzurirajOrganizatorDto dto)
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

        [HttpPost("{id}/promeni-sifru")]
        public async Task<IActionResult> PromeniSifru(string id, [FromBody] PromeniSifruDto dto)
        {
            await _servis.PromeniSifru(id, dto.TrenutnaSifra, dto.NovaSifra);
            return NoContent();
        }
    }
}
