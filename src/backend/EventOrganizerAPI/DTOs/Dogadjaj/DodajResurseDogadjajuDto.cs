using System;
using System.Collections.Generic;

namespace EventOrganizerAPI.DTOs.Dogadjaj
{
    public class DodajResurseDogadjajuDto
    {
        public string DogadjajId { get; set; }
        public List<string> ResursiIds { get; set; } = new List<string>();
    }
}