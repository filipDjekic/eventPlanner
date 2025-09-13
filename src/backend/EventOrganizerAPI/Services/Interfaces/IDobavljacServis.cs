using EventOrganizerAPI.DTOs.Dobavljac;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IDobavljacServis
    {
        Task<List<PrikaziDobavljacDto>> VratiSve();
        Task<PrikaziDobavljacDto> VratiPoId(string id);
        Task Azuriraj(AzurirajDobavljacDto dto);
        Task Obrisi(string id);
        Task PromeniSifru(string id, string trenutnaSifra, string novaSifra);
    }
}