using EventOrganizerAPI.DTOs;

namespace EventOrganizerAPI.Services
{
    public interface INotifikacijaServis
    {
        Task PosaljiNotifikaciju(KreirajNotifikacijuDto dto);
    }
}
