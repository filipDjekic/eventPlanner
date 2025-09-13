using System.Collections.Generic;
using EventOrganizerAPI.Models.Enums;

namespace EventOrganizerAPI.Models
{
    public class Lokacija
    {
        public string Id { get; set; } // Jedinstveni ID lokacije
        public string DogadjajId { get; set; } // ID događaja kojem lokacija pripada
        public string Naziv { get; set; } // Naziv lokacije (npr. WC, bina, štand)
        public string Opis { get; set; } // Detaljan opis lokacije (ako je potreban)
        public double XKoordinata { get; set; } // X koordinata na mapi
        public double YKoordinata { get; set; } // Y koordinata na mapi
        public string URLSlikeMape { get; set; } // URL slike mape sa označenim lokacijama (ako je potrebno)

        // Cenovnik za lokaciju
        public string Cenovnik { get; set; } // ID cenovnika za lokaciju
        public string Podrucje { get; set; } // ID podrucja

        public string HEXboja { get; set; }

        public TipLokacijeEnum TipLokacije { get; set; } // tip lokacije enum

        // Lista ID-jeva resursa vezanih za lokaciju
        public List<string> Resursi { get; set; } = new();
    }

}
