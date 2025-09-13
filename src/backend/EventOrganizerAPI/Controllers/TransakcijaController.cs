using EventOrganizerAPI.DTOs;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/transakcija")]
    public class TransakcijaController : ControllerBase
    {
        private readonly ITransakcijaServis _transakcijaServis;

        public TransakcijaController(ITransakcijaServis transakcijaServis)
        {
            _transakcijaServis = transakcijaServis;
        }

        [HttpGet("stanje/{karticaId}")]
        public async Task<ActionResult<StanjeKarticeDto>> PrikaziStanje(string karticaId)
        {
            var stanje = await _transakcijaServis.PrikaziStanjeAsync(karticaId);
            if (stanje == null)
                return NotFound("Kartica nije pronađena.");

            return Ok(stanje);
        }

        [HttpPost("kreiraj")]
        public async Task<ActionResult<Transakcija>> KreirajTransakciju([FromBody] KreirajTransakcijaDto dto)
        {
            var rezultat = await _transakcijaServis.KreirajTransakcijuAsync(dto);
            if (rezultat == null)
                return NotFound("Kartica nije pronađena.");

            return Ok(rezultat);
        }
    }
}
