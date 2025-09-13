using EventOrganizerAPI.Dtos.Dogadjaj;
using EventOrganizerAPI.DTOs.Dogadjaj;
using EventOrganizerAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IDogadjajServis
    {
        Task<Dogadjaj> KreirajDogadjaj(KreirajDogadjajDto dto);
        Task<List<PrikazDogadjajDto>> VratiSveDogadjaje();
        Task<Dogadjaj> VratiPoId(string id);
        Task AzurirajDogadjaj(AzurirajDogadjajDto dto);
        Task ObrisiDogadjaj(string id);
        Task<List<Dogadjaj>> Pretrazi(PretraziDogadjajDto dto);
        Task<string> SacuvajSliku(IFormFile slika, string dogadjajId);
        Task DodajResurseDogadjaju(DodajResurseDogadjajuDto dto);
    }
}
