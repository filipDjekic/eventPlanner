using EventOrganizerAPI.Models;

public interface ITokenServis
{
    string GenerisiToken(Korisnik korisnik);
    string GenerisiToken(Organizator organizator);
    string GenerisiToken(Dobavljac dobavljac);
}
