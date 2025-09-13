using EventOrganizerAPI.DTOs;
using EventOrganizerAPI.DTOs.PodrucjeLokacija;
using EventOrganizerAPI.Models;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface ILokacijaServis
    {
        Task<Lokacija> KreirajLokacijuAsync(KreirajLokacijuDto dto);
        Task<List<PrikazLokacijaDto>> VratiSveLokacijeAsync();
        Task<PrikazLokacijaDto> VratiLokacijuPoIdAsync(string id);
        Task<bool> AzurirajLokacijuAsync(AzurirajLokacijuDto dto);
        Task<bool> ObrisiLokacijuAsync(string id);
        Task<List<Lokacija>> VratiLokacijeZaDogadjajAsync(string dogadjajId);
    }
}
