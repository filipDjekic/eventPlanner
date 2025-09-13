using EventOrganizerAPI.Dtos.Karta;
using EventOrganizerAPI.DTOs.Karta;
using EventOrganizerAPI.DTOs.Korisnik;
using EventOrganizerAPI.Models;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IKartaServis
    {
        Task<Karta> KreirajKartu(KreirajKartuDto dto);
        Task<Karta> VratiBesplatnuKartu(string dogadjajId);
        Task<List<PrikazKartaDto>> VratiSveKarte();
        Task<Karta> VratiKartuPoId(string id);
        Task AzurirajKartu(AzurirajKartuDto dto);
        Task ObrisiKartu(string id);
        Task<KupljenaKarta> VratiKupljenuKartuPoId(string id);
        Task<KupljenaKarta> KreirajKupljenuKartuAsync(string idKarte, string korisnikId);
        Task OznaciKartuIskoriscenom(string kupljenaKartaId);
    }
}