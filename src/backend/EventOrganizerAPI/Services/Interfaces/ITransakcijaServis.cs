using EventOrganizerAPI.DTOs;
using EventOrganizerAPI.Models;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface ITransakcijaServis
    {
        Task<StanjeKarticeDto> PrikaziStanjeAsync(string karticaId);
        Task<Transakcija> KreirajTransakcijuAsync(KreirajTransakcijaDto dto);
    }
}
