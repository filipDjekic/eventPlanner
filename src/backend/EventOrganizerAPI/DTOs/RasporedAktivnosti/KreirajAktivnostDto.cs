using EventOrganizerAPI.Models.Enums;
using System;

namespace EventOrganizerAPI.DTOs.RasporedAktivnosti
{
    public class KreirajAktivnostDto
    {
        public string Naziv { get; set; }
        public string Opis { get; set; }
        public DateTime DatumVremePocetka { get; set; }
        public DateTime DatumVremeKraja { get; set; }
        public string Lokacija { get; set; }
        public string Dan { get; set; }
        public string Dogadjaj { get; set; }
        public TipAktivnosti Tip { get; set; }
    }
}
