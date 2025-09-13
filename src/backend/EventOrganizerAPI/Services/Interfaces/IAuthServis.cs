using EventOrganizerAPI.DTOs.Auth;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IAuthServis
    {
        Task<LoginOdgovorDto?> LoginKorisnika(LoginDto dto);
        Task<LoginOdgovorDto?> LoginOrganizatora(LoginDto dto);
        Task<LoginOdgovorDto?> LoginDobavljaca(LoginDto dto);

        Task<bool> RegistrujKorisnika(RegistracijaDto dto);
        Task<bool> RegistrujOrganizatora(RegistracijaDto dto);
        Task<bool> RegistrujDobavljaca(RegistracijaDto dto);

        Task VerifikujMail(string id, string uloga);
    }
}
