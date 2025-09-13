using EventOrganizerAPI.Models.Enums;
using System;
using System.Collections.Generic;

namespace EventOrganizerAPI.DTOs.RasporedAktivnosti
{
    public class PrikaziAktivnostDto
    {
        public string Id { get; set; }
        public string Naziv { get; set; }
        public string Opis { get; set; }
        public DateTime DatumVremePocetka { get; set; }
        public DateTime DatumVremeKraja { get; set; }
        public string Lokacija { get; set; }
        public string Dan { get; set; }
        public string Dogadjaj { get; set; }
        public TipAktivnosti Tip { get; set; }
        public List<string> Notifikacije { get; set; }
        public List<string> Resursi { get; set; }
    }
}
