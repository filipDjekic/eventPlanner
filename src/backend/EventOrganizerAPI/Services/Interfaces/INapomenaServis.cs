using EventOrganizerAPI.Models;
using EventOrganizerAPI.DTOs.Napomena;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface INapomenaServis
    {
        Task<Napomena> Kreiraj(KreirajNapomenuDto dto);
        Task<List<Napomena>> VratiSve();
        Task<Napomena> VratiPoId(string id);
        Task Azuriraj(string id, AzurirajNapomenuDto dto);
        Task Obrisi(string id);
    }
}
