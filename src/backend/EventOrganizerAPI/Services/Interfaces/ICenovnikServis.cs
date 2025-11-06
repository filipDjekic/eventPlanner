using EventOrganizerAPI.DTOs.Cenovnik;
using EventOrganizerAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface ICenovnikServis
    {
        Task<Cenovnik> KreirajCenovnikAsync(KreirajCenovnikDto dto);
        Task<List<Cenovnik>> VratiSveCenovnikeAsync();
        Task<List<Cenovnik>> VratiSveZaDogadjajAsync(string dogadjajId);
        Task<Cenovnik> VratiCenovnikPoIdAsync(string id);
        Task<bool> AzurirajCenovnikAsync(AzurirajCenovnikDto dto);
        Task<bool> ObrisiCenovnikAsync(string id);
        Task<bool> DodajStavkuAsync(string cenovnikId, string stavkaId);
        Task<bool> UkloniStavkuAsync(string cenovnikId, string stavkaId);
    }
}
