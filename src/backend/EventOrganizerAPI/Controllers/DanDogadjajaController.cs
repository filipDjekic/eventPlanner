using EventOrganizerAPI.DTOs.DanDogadjaja;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/dani")]
    public class DanDogadjajaController : ControllerBase
    {
        private readonly IDanDogadjajaServis _servis;

        public DanDogadjajaController(IDanDogadjajaServis servis)
        {
            _servis = servis;
        }

        [HttpPost("kreiraj")]
        public async Task<IActionResult> Kreiraj([FromBody] KreirajDanDogadjaja dto)
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
        public async Task<IActionResult> Azuriraj(string id, [FromBody] IzmeniDanDogadjaja dto)
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

        [HttpDelete("obrisi-za-dogadjaj/{dogadjajId}")]
        public async Task<IActionResult> ObrisiSveZaDogadjaj(string dogadjajId)
        {
            await _servis.ObrisiSveZaDogadjaj(dogadjajId);
            return NoContent();
        }
        [HttpGet("vrati-sve-za-dogadjaj/{dogadjajId}")]
        public async Task<IActionResult> VratiSveZaDogadjaj(string dogadjajId)
        {
            var lista = await _servis.VratiSveZaDogadjaj(dogadjajId);
            return Ok(lista);
        }
    }
}
