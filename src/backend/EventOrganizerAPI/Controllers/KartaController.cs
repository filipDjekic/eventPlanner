using EventOrganizerAPI.Dtos.Karta;
using EventOrganizerAPI.DTOs.Karta;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/karta")]
    public class KartaController : ControllerBase
    {
        private readonly IKartaServis _kartaServis;

        public KartaController(IKartaServis kartaServis)
        {
            _kartaServis = kartaServis;
        }

        [HttpPost("kreiraj")]
        public async Task<ActionResult<Karta>> KreirajKartu(KreirajKartuDto dto)
        {
            var karta = await _kartaServis.KreirajKartu(dto);
            return CreatedAtAction(nameof(VratiKartuPoId), new { id = karta.Id }, karta);
        }

        [HttpGet("vrati-za-dogadjaj-kartu/{dogadjajId}")]
        public async Task<ActionResult<Karta>> VratiKartuZaDogadjaj(string dogadjajId)
        {
            return Ok(await _kartaServis.VratiBesplatnuKartu(dogadjajId));
        }


        [HttpGet("vrati-sve")]
        public async Task<ActionResult<List<PrikazKartaDto>>> VratiSve()
        {
            var karte = await _kartaServis.VratiSveKarte();
            return Ok(karte);
        }

        [HttpGet("vrati-po-id/{id}")]
        public async Task<ActionResult<Karta>> VratiKartuPoId(string id)
        {
            var karta = await _kartaServis.VratiKartuPoId(id);
            return karta != null ? Ok(karta) : NotFound();
        }

        [HttpPut("azuriraj/{id}")]
        public async Task<IActionResult> AzurirajKartu(string id, AzurirajKartuDto dto)
        {
            dto.Id = id;
            await _kartaServis.AzurirajKartu(dto);
            return NoContent();
        }
        [HttpGet("kupljene/{id}")]
        public async Task<ActionResult<KupljenaKarta>> VratiKupljenuKartuPoId(string id)
        {
            var karta = await _kartaServis.VratiKupljenuKartuPoId(id);
            return Ok(karta);
        }

        [HttpDelete("obrisi/{id}")]
        public async Task<IActionResult> ObrisiKartu(string id)
        {
            await _kartaServis.ObrisiKartu(id);
            return NoContent();
        }

        [HttpPost("kreiraj-kupljenu-kartu")]
        public async Task<ActionResult<KupljenaKarta>> KreirajKupljenuKartu([FromBody] KreirajKupljenaKartaDto dto)
        {
            var kupljena = await _kartaServis.KreirajKupljenuKartuAsync(dto.IdKarte, dto.KorisnikId);
            return CreatedAtAction(nameof(VratiKupljenuKartuPoId), new { id = kupljena.Id }, kupljena);
        }

    }
}