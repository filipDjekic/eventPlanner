using EventOrganizerAPI.DTOs;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Models.Enums;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/notifikacija")]
    public class NotifikacijaController : ControllerBase
    {
        private readonly INotifikacijeServis _notifikacijaServis;

        public NotifikacijaController(INotifikacijeServis notifikacijaServis)
        {
            _notifikacijaServis = notifikacijaServis;
        }

        [HttpPost("posalji-notifikaciju/{dogadjajId}")]
        public async Task<IActionResult> PosaljiNotifikaciju(string dogadjajId, [FromBody] KreirajNotifikacijuDto dto)
        {
            if (!Enum.IsDefined(typeof(Models.Enums.TipNotifikacije), dto.Tip))
                return BadRequest("Nevažeći tip notifikacije");

            dto.DogadjajId = dogadjajId;
            await _notifikacijaServis.PosaljiNotifikacijuSvimPrijavljenima(dto);
            return Ok();
        }

        [HttpGet("vrati-sve-notifikacije-za-dogadjaj/{dogadjajId}")]
        public async Task<ActionResult<List<Notifikacija>>> VratiNotifikacijeZaDogadjaj(string dogadjajId)
        {
            var notifikacije = await _notifikacijaServis.VratiNotifikacijeZaDogadjaj(dogadjajId);
            return Ok(notifikacije);
        }

        [HttpDelete("obrisi/{id}")]
        public async Task<IActionResult> ObrisiNotifikaciju(string id)
        {
            await _notifikacijaServis.ObrisiNotifikaciju(id);
            return NoContent();
        }
    }
}