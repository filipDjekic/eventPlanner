using EventOrganizerAPI.Models;
using EventOrganizerAPI.DTOs.RasporedAktivnosti;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IRasporedServis
    {
        Task<Raspored> Kreiraj(KreirajRasporedDto dto);
        Task<List<Raspored>> VratiSve();
        Task<Raspored> VratiPoId(string id);
        Task Azuriraj(AzurirajRasporedDto dto);
        Task Obrisi(string id);
    }
}
