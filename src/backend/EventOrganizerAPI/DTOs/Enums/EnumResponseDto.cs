
using System.Collections.Generic;

namespace EventOrganizerAPI.DTOs.Enums
{
    public class EnumResponseDto
    {
        public string EnumName { get; set; } = string.Empty;
        public List<EnumValueDto> Values { get; set; } = new List<EnumValueDto>();
    }

    public class AllEnumsResponseDto
    {
        public Dictionary<string, List<EnumValueDto>> Enums { get; set; } = new Dictionary<string, List<EnumValueDto>>();
    }
}
