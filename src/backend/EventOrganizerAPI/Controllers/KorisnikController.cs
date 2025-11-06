using EventOrganizerAPI.DTOs.Korisnik;
using EventOrganizerAPI.Services;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Authorization.Infrastructure;
using Microsoft.AspNetCore.Mvc;
using System.Security.Claims;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/korisnici")]
    public class KorisnikController : ControllerBase
    {
        private readonly IKorisnikServis _servis;

        public KorisnikController(IKorisnikServis servis)
        {
            _servis = servis;
        }

        [HttpGet("vrati-sve")]
        public async Task<IActionResult> VratiSve()
        {
            var korisnici = await _servis.VratiSve();
            return Ok(korisnici);
        }

        [HttpGet("vrati-po-id/{id}")]
        public async Task<IActionResult> VratiPoId(string id)
        {
            var korisnik = await _servis.VratiPoId(id);
            if (korisnik == null) return NotFound();
            return Ok(korisnik);
        }

        [HttpPut("azuriraj/{id}")]
        public async Task<IActionResult> Azuriraj(string id, [FromBody] AzurirajKorisnikDto dto)
        {
            dto.Id = id;
            await _servis.Azuriraj(dto);
            return NoContent();
        }

        [HttpDelete("obrisi/{id}")]
        public async Task<IActionResult> Obrisi(string id)
        {
            await _servis.Obrisi(id);
            return NoContent();
        }

        [HttpPost("kupi-kartu")]
        public async Task<IActionResult> KupiKartu([FromBody] KupovinaKarteDto dto)
        {
            var uspeh = await _servis.KupiKartuAsync(dto);
            if (!uspeh)
                return BadRequest("Kupovina nije uspela.");

            return Ok("Uspešno kupljena karta.");
        }
        [HttpPost("balans")]
        public async Task<IActionResult> DodajBalans([FromBody] DodajBalansDto dto)
        {
            await _servis.DodajBalans(dto);
            return Ok();
        }
    }
}
