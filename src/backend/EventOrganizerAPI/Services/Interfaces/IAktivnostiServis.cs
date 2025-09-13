using EventOrganizerAPI.Models;
using EventOrganizerAPI.DTOs.RasporedAktivnosti;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IAktivnostiServis
    {
        Task<Aktivnost> Kreiraj(KreirajAktivnostDto dto);
        Task<List<Aktivnost>> VratiSve();
        Task<Aktivnost> VratiPoId(string id);
        Task Azuriraj(AzurirajAktivnostDto dto);
        Task Obrisi(string id);
    }
}
