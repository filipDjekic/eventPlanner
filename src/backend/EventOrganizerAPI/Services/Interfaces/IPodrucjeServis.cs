using EventOrganizerAPI.DTOs;
using EventOrganizerAPI.DTOs.PodrucjeLokacija;
using EventOrganizerAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IPodrucjeServis
    {
        Task<Podrucje> KreirajPodrucjeAsync(PodrucjeKreirajDto dto);
        Task<List<PrikazPodrucjeDto>> VratiSvaPodrucjaAsync();
        Task<PrikazPodrucjeDto> VratiPodrucjePoIdAsync(string id);
        Task<bool> AzurirajPodrucjeAsync(PodrucjeAzurirajDto dto);
        Task<bool> ObrisiPodrucjeAsync(string id);
    }
}
