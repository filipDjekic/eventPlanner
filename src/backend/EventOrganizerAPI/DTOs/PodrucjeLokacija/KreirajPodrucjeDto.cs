using System;
using System.Collections.Generic;

namespace EventOrganizerAPI.DTOs.PodrucjeLokacija
{
    public class PodrucjeKreirajDto
    {
        public string DogadjajId { get; set; }
        public string DanId { get; set; }
        public List<string> Lokacije { get; set; }
        public string Naziv { get; set; }
        public List<List<double>> Koordinate { get; set; }

        public string HEXboja { get; set; }
    }
}
