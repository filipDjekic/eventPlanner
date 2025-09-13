
using System.Collections.Generic;
using EventOrganizerAPI.DTOs.Enums;

namespace EventOrganizerAPI.Services.Interfaces
{
    public interface IEnumsService
    {
        /// <summary>Vrati imena svih enum tipova (po imenu tipa).</summary>
        List<string> GetEnumNames();

        /// <summary>Vrati vrednosti za konkretan enum po imenu (case-insensitive).</summary>
        EnumResponseDto GetEnum(string enumName);

        /// <summary>Vrati sve enume i njihove vrednosti.</summary>
        AllEnumsResponseDto GetAllEnums();
    }
}
