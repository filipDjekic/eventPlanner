// DogadjajStatistikaDto.cs
using System;

namespace EventOrganizerAPI.Models.DTOs
{
    public class DogadjajStatistikaDto
    {
        public string DogadjajId { get; set; }
        public string NazivDogadjaja { get; set; }
        public string Lokacija { get; set; }
        public DateTime DatumPocetka { get; set; }
        public DateTime DatumKraja { get; set; }
        public int Kapacitet { get; set; }
        public int ProdatihKarata { get; set; }
        public int PrijavljenihUcesnika { get; set; }
        public double PopunjenostProcenat => Kapacitet > 0 ? (double)ProdatihKarata / Kapacitet * 100 : 0;
        public int BrojNotifikacija { get; set; }
        public int BrojNapomena { get; set; }
        public int BrojDana { get; set; }
        public string Organizator { get; set; }
        public string Status { get; set; }
    }
}