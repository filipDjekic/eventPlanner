using EventOrganizerAPI.DTOs.Cenovnik;
using EventOrganizerAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface ICenovnikStavkaServis
    {
        Task<CenovnikStavka> KreirajStavkuAsync(KreirajStavkuDto dto);
        Task<List<CenovnikStavka>> VratiSveStavkeAsync();
        Task<CenovnikStavka> VratiStavkuPoIdAsync(string id);
        Task<bool> AzurirajStavkuAsync(AzurirajStavkuDto dto);
        Task<bool> ObrisiStavkuAsync(string id);
    }
}
