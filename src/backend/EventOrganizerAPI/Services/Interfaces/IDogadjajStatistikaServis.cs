using EventOrganizerAPI.Models.DTOs;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IDogadjajStatistikaServis
    {
        Task<List<DogadjajStatistikaDto>> PreuzmiSvuStatistikuAsync();
        Task<DogadjajStatistikaDto> PreuzmiStatistikuDogadjajaAsync(string dogadjajId);
        Task<List<DogadjajStatistikaDto>> PreuzmiStatistikuPoOrganizatoruAsync(string organizatorId);
    }
}
