using EventOrganizerAPI.Models;
using EventOrganizerAPI.DTOs.DanDogadjaja;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IDanDogadjajaServis
    {
        Task<DanDogadjaja> Kreiraj(KreirajDanDogadjaja dto);
        Task<List<DanDogadjaja>> VratiSve();
        Task<DanDogadjaja> VratiPoId(string id);
        Task Azuriraj(string id, IzmeniDanDogadjaja dto);
        Task Obrisi(string id);
    }
}
