// DogadjajStatistikaKontroler.cs
using EventOrganizerAPI.Models.DTOs;
using EventOrganizerAPI.Services;
using EventOrganizerAPI.Services.Interfaces;
using Microsoft.AspNetCore.Mvc;
using System.Collections.Generic;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Controllers
{
    [Route("api/dogadjaj-statistika")]
    [ApiController]
    public class DogadjajStatistikaController : ControllerBase
    {
        private readonly IDogadjajStatistikaServis _statistikaServis;

        public DogadjajStatistikaController(IDogadjajStatistikaServis statistikaServis)
        {
            _statistikaServis = statistikaServis;
        }

        [HttpGet("svi")]
        public async Task<ActionResult<List<DogadjajStatistikaDto>>> PreuzmiSvuStatistiku()
        {
            var statistika = await _statistikaServis.PreuzmiSvuStatistikuAsync();
            return Ok(statistika);
        }

        [HttpGet("statistika/{dogadjajId}")]
        public async Task<ActionResult<DogadjajStatistikaDto>> PreuzmiStatistikuDogadjaja(string dogadjajId)
        {
            var statistika = await _statistikaServis.PreuzmiStatistikuDogadjajaAsync(dogadjajId);
            if (statistika == null) return NotFound();

            return Ok(statistika);
        }

        [HttpGet("organizator-statistika/{organizatorId}")]
        public async Task<ActionResult<List<DogadjajStatistikaDto>>> PreuzmiStatistikuPoOrganizatoru(string organizatorId)
        {
            var statistika = await _statistikaServis.PreuzmiStatistikuPoOrganizatoruAsync(organizatorId);
            return Ok(statistika);
        }

        [HttpGet("export/{dogadjajId}")]
        public async Task<IActionResult> IzveziStatistikuDogadjaja(string dogadjajId)
        {
            var statistika = await _statistikaServis.PreuzmiStatistikuDogadjajaAsync(dogadjajId);
            if (statistika == null) return NotFound();

            // Generisanje CSV sadržaja
            var csvContent = GenerisiCsv(statistika);

            return File(System.Text.Encoding.UTF8.GetBytes(csvContent), "text/csv", $"statistika_{dogadjajId}.csv");
        }

        private string GenerisiCsv(DogadjajStatistikaDto statistika)
        {
            var csv = new System.Text.StringBuilder();
            csv.AppendLine("Naziv;Vrednost");
            csv.AppendLine($"ID dogadjaja;{statistika.DogadjajId}");
            csv.AppendLine($"Naziv dogadjaja;{statistika.NazivDogadjaja}");
            csv.AppendLine($"Lokacija;{statistika.Lokacija}");
            csv.AppendLine($"Datum pocetka;{statistika.DatumPocetka}");
            csv.AppendLine($"Datum kraja;{statistika.DatumKraja}");
            csv.AppendLine($"Kapacitet;{statistika.Kapacitet}");
            csv.AppendLine($"Prodatih karata;{statistika.ProdatihKarata}");
            csv.AppendLine($"Prijavljenih ucesnika;{statistika.PrijavljenihUcesnika}");
            csv.AppendLine($"Popunjenost (%);{statistika.PopunjenostProcenat}");
            csv.AppendLine($"Broj notifikacija;{statistika.BrojNotifikacija}");
            csv.AppendLine($"Broj napomena;{statistika.BrojNapomena}");
            csv.AppendLine($"Broj dana;{statistika.BrojDana}");
            csv.AppendLine($"Organizator;{statistika.Organizator}");
            csv.AppendLine($"Status;{statistika.Status}");

            return csv.ToString();
        }
    }
}