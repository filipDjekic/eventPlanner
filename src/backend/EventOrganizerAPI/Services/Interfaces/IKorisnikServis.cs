using EventOrganizerAPI.DTOs.Korisnik;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IKorisnikServis
    {
        Task<List<PrikaziKorisnikDto>> VratiSve();
        Task<PrikaziKorisnikDto?> VratiPoId(string id);
        Task Azuriraj(AzurirajKorisnikDto dto);
        Task Obrisi(string id);
        Task<bool> KupiKartuAsync(KupovinaKarteDto dto);
        Task DodajBalans(DodajBalansDto dto);
    }
}
