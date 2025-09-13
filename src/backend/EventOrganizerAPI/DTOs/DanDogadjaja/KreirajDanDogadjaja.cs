using System;
using System.Collections.Generic;

namespace EventOrganizerAPI.DTOs.DanDogadjaja
{
    public class KreirajDanDogadjaja
    {
        public string Naziv { get; set; }
        public string Opis { get; set; }
        public DateTime DatumOdrzavanja { get; set; }
        public string Dogadjaj { get; set; }

        public List<string>? Podrucja { get; set; }
        public List<string>? Aktivnosti { get; set; }
    }
}
