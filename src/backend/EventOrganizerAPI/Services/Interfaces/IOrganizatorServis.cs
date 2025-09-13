using EventOrganizerAPI.DTOs.Organizator;
using EventOrganizerAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IOrganizatorServis
    {
        Task<List<PrikaziOrganizatorDto>> VratiSve();
        Task<PrikaziOrganizatorDto> VratiPoId(string id);
        Task Azuriraj(AzurirajOrganizatorDto dto);
        Task Obrisi(string id);
        Task PromeniSifru(string id, string trenutnaSifra, string novaSifra);
    }
}
