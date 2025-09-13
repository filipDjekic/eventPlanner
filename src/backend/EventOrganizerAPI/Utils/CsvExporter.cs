using EventOrganizerAPI.Models;
using Microsoft.AspNetCore.DataProtection.KeyManagement;
using System.Reflection;
using System.Text;

namespace EventOrganizerAPI.Utils
{
    public class CsvExporter
    {
        public static string ExportToCsv(List<Korisnik> korisnici)
        {
            var sb = new StringBuilder();
            sb.AppendLine("Id, Name, Email");
            foreach(var korisnik in korisnici)
            {
                var id = korisnik.Id.ToString();
                var korisnickoIme = korisnik.KorisnickoIme;//Ovde moze postojati problem u slucaju da u imenu ima
                var email = korisnik.Email;

                sb.AppendLine($"{id},{korisnickoIme},{email}");
            }
            return sb.ToString();
        }

    }
    
}
