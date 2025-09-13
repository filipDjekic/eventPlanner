using EventOrganizerAPI.DTOs.Resurs;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/resursi")]
    public class ResursController : ControllerBase
    {
        private readonly IResursServis _servis;

        public ResursController(IResursServis servis)
        {
            _servis = servis;
        }

        [HttpPost("kreiraj")]
        public async Task<IActionResult> Kreiraj([FromBody] KreirajResursDto dto)
        {
            var rezultat = await _servis.Kreiraj(dto);
            return Ok(rezultat);
        }

        [HttpGet("vrati-sve")]
        public async Task<IActionResult> VratiSve()
        {
            var rezultat = await _servis.VratiSve();
            // Pretvori u DTO za front ako treba
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
        public async Task<IActionResult> Azuriraj(string id, [FromBody] AzurirajResursDto dto)
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

        [HttpGet("slobodni")]
        public async Task<IActionResult> VratiSlobodne()
        {
            var rezultat = await _servis.VratiSlobodne();
            return Ok(rezultat);
        }

        [HttpPost("rezervisi")]
        public async Task<IActionResult> Rezervisi([FromBody] RezervisiResursDto dto)
        {
            await _servis.RezervisiResurs(dto.ResursId, dto.DogadjajId, dto.Kolicina);
            return Ok();
        }

        [HttpGet("dogadjaj/{dogadjajId}")]
        public async Task<IActionResult> VratiZaDogadjaj(string dogadjajId)
        {
            var rezultat = await _servis.VratiZaDogadjaj(dogadjajId);
            return Ok(rezultat);
        }

        [HttpPost("ponisti-rezervaciju")]
        public async Task<IActionResult> PonistiRezervaciju([FromBody] PonistiRezervacijuDto dto)
        {
            await _servis.PonistiRezervaciju(dto.ResursId, dto.DogadjajId);
            return Ok();
        }
    }
}