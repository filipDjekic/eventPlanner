using EventOrganizerAPI.Dtos.Dogadjaj;
using EventOrganizerAPI.DTOs.Dogadjaj;
using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/dogadjaj")]
    public class DogadjajController : ControllerBase
    {
        private readonly IDogadjajServis _servis;

        public DogadjajController(IDogadjajServis servis)
        {
            _servis = servis;
        }

        [HttpPost("kreiraj")]
        public async Task<IActionResult> KreirajDogadjaj([FromBody] KreirajDogadjajDto dto)
        {
            var rezultat = await _servis.KreirajDogadjaj(dto);
            return Ok(rezultat);
        }

        // Novi RESTful endpoint za ažuriranje po ID-u (REST standard)
        [HttpPut("azuriraj/{id}")]
        public async Task<IActionResult> AzurirajDogadjaj(string id, [FromBody] AzurirajDogadjajDto dto)
        {
            dto.Id = id;
            await _servis.AzurirajDogadjaj(dto);
            return NoContent();
        }

        [HttpGet("vrati-sve")]
        public async Task<ActionResult<List<PrikazDogadjajDto>>> VratiSve()
        {
            var dogadjaji = await _servis.VratiSveDogadjaje();
            return Ok(dogadjaji);
        }

        [HttpGet("vrati-po-id/{id}")]
        public async Task<IActionResult> VratiPoId(string id)
        {
            var dogadjaj = await _servis.VratiPoId(id);
            if (dogadjaj == null) return NotFound();
            return Ok(dogadjaj);
        }

        [HttpDelete("obrisi/{id}")]
        public async Task<IActionResult> Obrisi(string id)
        {
            await _servis.ObrisiDogadjaj(id);
            return NoContent();
        }

        [HttpPost("pretrazi")]
        public async Task<IActionResult> Pretrazi([FromBody] PretraziDogadjajDto dto)
        {
            var rezultat = await _servis.Pretrazi(dto);
            return Ok(rezultat);
        }
        [HttpPost("slika")]
        [Consumes("multipart/form-data")]
        public async Task<IActionResult> DodajSliku([FromForm] FileUploadDto dto)
        {
            if (dto.Slika == null || dto.Slika.Length == 0)
                return BadRequest("Nema fajla.");
            var relativePath = await _servis.SacuvajSliku(dto.Slika, dto.DogadjajId);

            return Ok(new { path = relativePath });
        }
        [HttpPost("dodaj-resurse")]
        public async Task<IActionResult> DodajResurseDogadjaju([FromBody] DodajResurseDogadjajuDto dto)
        {
            await _servis.DodajResurseDogadjaju(dto);
            return NoContent();
        }
    }
}