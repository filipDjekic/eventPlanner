using EventOrganizerAPI.Models;
using EventOrganizerAPI.DTOs.Resurs;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IResursServis
    {
        Task<Resurs> Kreiraj(KreirajResursDto dto);
        Task<List<Resurs>> VratiSve();
        Task<Resurs> VratiPoId(string id);
        Task Azuriraj(string id, AzurirajResursDto dto);
        Task Obrisi(string id);
        Task<List<Resurs>> VratiSlobodne();
        Task RezervisiResurs(string resursId, string dogadjajId, int? kolicina);
        Task <List<Resurs>>VratiZaDogadjaj(string dogadjajId);
        Task PonistiRezervaciju(string resursId, string dogadjajId);
    }
}
