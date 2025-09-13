using EventOrganizerAPI.Models;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.IdentityModel.Tokens;
using System.IdentityModel.Tokens.Jwt;
using System.Security.Claims;
using System.Text;

namespace EventOrganizerAPI.Servisi
{
    public class TokenServis : ITokenServis
    {
        private readonly IConfiguration _configuration;

        public TokenServis(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        private string GenerisiTokenZaClaims(IEnumerable<Claim> claims)
        {
            var key = new SymmetricSecurityKey(Encoding.ASCII.GetBytes(_configuration["Jwt:SecretKey"]));
            var creds = new SigningCredentials(key, SecurityAlgorithms.HmacSha256);

            var token = new JwtSecurityToken(
                issuer: _configuration["Jwt:Issuer"],
                audience: _configuration["Jwt:Audience"],
                claims: claims,
                expires: DateTime.UtcNow.AddHours(1),
                signingCredentials: creds
            );

            return new JwtSecurityTokenHandler().WriteToken(token);
        }

        public string GenerisiToken(Korisnik korisnik)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, korisnik.Email),
                new Claim(ClaimTypes.NameIdentifier, korisnik.Id),
                new Claim(ClaimTypes.Role, korisnik.Uloga),
                new Claim("verifikovan_email", korisnik.VerifikovanEmail ? "true" : "false")
            };
            return GenerisiTokenZaClaims(claims);
        }

        public string GenerisiToken(Organizator organizator)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, organizator.Email),
                new Claim(ClaimTypes.NameIdentifier, organizator.Id),
                new Claim(ClaimTypes.Role, organizator.Uloga),
                new Claim("verifikovan_email", organizator.VerifikovanEmail ? "true" : "false")
            };
            return GenerisiTokenZaClaims(claims);
        }

        public string GenerisiToken(Dobavljac dobavljac)
        {
            var claims = new[]
            {
                new Claim(ClaimTypes.Name, dobavljac.Email),
                new Claim(ClaimTypes.NameIdentifier, dobavljac.Id),
                new Claim(ClaimTypes.Role, dobavljac.Uloga),
                new Claim("verifikovan_email", dobavljac.VerifikovanEmail ? "true" : "false")
            };
            return GenerisiTokenZaClaims(claims);
        }
    }
}
