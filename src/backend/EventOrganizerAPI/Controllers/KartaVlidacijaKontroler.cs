using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using MongoDB.Driver;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/karta-validacija")]
    public class KartaValidacijaKontroler : ControllerBase
    {
        private readonly IKartaServis _kartaServis;

        public KartaValidacijaKontroler(IKartaServis kartaServis)
        {
            _kartaServis = kartaServis;
        }

        // GET: api/karta-validacija/{kupljenaKartaId}
        [HttpGet("validiraj/{kupljenaKartaId}")]
        public async Task<IActionResult> ValidirajKartu(string kupljenaKartaId)
        {
            var kupljenaKarta = await _kartaServis.VratiKupljenuKartuPoId(kupljenaKartaId);
            if (kupljenaKarta == null)
                return NotFound("Karta ne postoji!");

            if (!kupljenaKarta.Validna)
                return BadRequest("Karta je već iskorišćena!");

            await _kartaServis.OznaciKartuIskoriscenom(kupljenaKartaId);

            return Ok("Karta uspešno validirana! Ulazak dozvoljen.");
        }
    }
}