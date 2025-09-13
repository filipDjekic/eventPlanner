using EventOrganizerAPI.DTOs;
using EventOrganizerAPI.Models;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IKarticaServis
    {
        Task<KreditKartica> KreirajAsync(KreirajKarticaDto dto);
        Task<decimal> VratiStanjeAsync(string karticaId);
        Task<bool> PromeniStanjeAsync(PromenaStanjaKarticeDto dto);
    }
}
