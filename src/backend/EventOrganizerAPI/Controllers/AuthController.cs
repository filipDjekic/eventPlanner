using EventOrganizerAPI.DTOs.Auth;
using EventOrganizerAPI.Services;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/auth")]
    public class AuthController : ControllerBase
    {
        private readonly IAuthServis _authServis;

        public AuthController(IAuthServis authServis)
        {
            _authServis = authServis;
        }

        // ----------- LOGIN -----------
        [HttpPost("login")]
        public async Task<IActionResult> Login([FromBody] LoginDto dto)
        {
            // Probaj kao organizator
            var organizator = await _authServis.LoginOrganizatora(dto);
            if (organizator != null)
            {
                if (!organizator.VerifikovanEmail)
                    return Unauthorized("Email nije verifikovan. Proverite svoj email.");
                return Ok(organizator);
            }

            // Probaj kao dobavljac
            var dobavljac = await _authServis.LoginDobavljaca(dto);
            if (dobavljac != null)
            {
                if (!dobavljac.VerifikovanEmail)
                    return Unauthorized("Email nije verifikovan. Proverite svoj email.");
                return Ok(dobavljac);
            }

            // Probaj kao korisnik
            var korisnik = await _authServis.LoginKorisnika(dto);
            if (korisnik != null)
            {
                if (!korisnik.VerifikovanEmail)
                    return Unauthorized("Email nije verifikovan. Proverite svoj email.");
                return Ok(korisnik);
            }

            // Nijedan nije našao
            return Unauthorized("Neispravni podaci za prijavu.");
        }

        // ----------- REGISTRACIJA -----------

        [HttpPost("registracija/korisnik")]
        public async Task<IActionResult> RegistrujKorisnika([FromBody] RegistracijaDto dto)
        {
            var uspesno = await _authServis.RegistrujKorisnika(dto);
            if (!uspesno) return BadRequest("Korisničko ime već postoji.");
            return Ok();
        }

        [HttpPost("registracija/organizator")]
        public async Task<IActionResult> RegistrujOrganizatora([FromBody] RegistracijaDto dto)
        {
            var uspesno = await _authServis.RegistrujOrganizatora(dto);
            if (!uspesno) return BadRequest("Organizator već postoji.");
            return Ok();
        }

        [HttpPost("registracija/dobavljac")]
        public async Task<IActionResult> RegistrujDobavljaca([FromBody] RegistracijaDto dto)
        {
            var uspesno = await _authServis.RegistrujDobavljaca(dto);
            if (!uspesno) return BadRequest("Dobavljač već postoji.");
            return Ok();
        }

        // ----------- VERIFIKACIJA -----------

        [HttpGet("verifikuj-mail")]
        public async Task<IActionResult> VerifikujMail([FromQuery] string id, [FromQuery] string uloga)
        {
            if (string.IsNullOrEmpty(id) || string.IsNullOrEmpty(uloga))
                return BadRequest("Nedostaju parametri.");

            await _authServis.VerifikujMail(id, uloga.ToLower());
            return Ok();
        }
    }
}