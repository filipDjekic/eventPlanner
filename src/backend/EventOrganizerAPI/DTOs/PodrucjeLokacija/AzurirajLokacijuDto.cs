using System;
using System.Collections.Generic;

namespace EventOrganizerAPI.DTOs.PodrucjeLokacija
{
    public class AzurirajLokacijuDto
    {
        public string Id { get; set; }
        public string? DogadjajId { get; set; }
        public string? Naziv { get; set; }
        public string? Opis { get; set; }
        public double? XKoordinata { get; set; }
        public double? YKoordinata { get; set; }
        public string? URLSlikeMape { get; set; }
        public string? CenovnikId { get; set; }
        public string? PodrucjeId { get; set; }
        public string? HEXboja { get; set; }
        public string? TipLokacije { get; set; }
        public List<string>? Resursi { get; set; }
    }
}
