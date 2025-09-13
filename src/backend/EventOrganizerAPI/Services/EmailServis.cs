using EventOrganizerAPI.Models;
using System.Net.Mail;
using System.Net;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class EmailServis
    {
        private readonly IConfiguration _configuration;

        public EmailServis(IConfiguration configuration)
        {
            _configuration = configuration;
        }

        public async Task PosaljiVerifikacioniEmail(Organizator organizator)
        {
            var link = KreirajVerifikacioniLink(organizator.Id, "organizator");
            var body = $"Kliknite na link kako biste verifikovali email:\n{link}";
            await PosaljiEmail(organizator.Email, "Verifikacija emaila", body);
        }

        public async Task PosaljiVerifikacioniEmail(Korisnik korisnik)
        {
            var link = KreirajVerifikacioniLink(korisnik.Id, "korisnik");
            var body = $"Kliknite na link kako biste verifikovali email:\n{link}";
            await PosaljiEmail(korisnik.Email, "Verifikacija emaila", body);
        }

        public async Task PosaljiVerifikacioniEmail(Dobavljac dobavljac)
        {
            var link = KreirajVerifikacioniLink(dobavljac.Id, "dobavljac");
            var body = $"Kliknite na link kako biste verifikovali email:\n{link}";
            await PosaljiEmail(dobavljac.Email, "Verifikacija emaila", body);
        }

        private string KreirajVerifikacioniLink(string id, string uloga)
        {
            var baseUrl = _configuration["App:BaseUrl"]?.TrimEnd('/');
            return $"{baseUrl}/api/auth/verifikuj-mail?id={id}&uloga={uloga}";
        }

        public async Task PosaljiEmail(string toEmail, string naslov, string sadrzaj)
        {
            var smtpServer = _configuration["EmailSettings:SmtpServer"];
            var port = int.Parse(_configuration["EmailSettings:Port"]);
            var fromEmail = _configuration["EmailSettings:From"];
            var password = _configuration["EmailSettings:Password"];

            using var smtpClient = new SmtpClient(smtpServer, port)
            {
                Credentials = new NetworkCredential(fromEmail, password),
                EnableSsl = true
            };

            var mail = new MailMessage
            {
                From = new MailAddress(fromEmail, "Event Organizer"),
                Subject = naslov,
                Body = sadrzaj,
                IsBodyHtml = false
            };

            mail.To.Add(toEmail);

            await smtpClient.SendMailAsync(mail);
        }
        public async Task PosaljiEmailSaPdf(string toEmail, string naslov, string sadrzaj, byte[] pdfBytes, string pdfNaziv)
        {
            var fromEmail = "no-reply@eventorganizerapi.local";
            var smtpClient = new SmtpClient("localhost", 1025) { EnableSsl = false };

            var message = new MailMessage
            {
                From = new MailAddress(fromEmail, "Event Organizer"),
                Subject = naslov,
                Body = sadrzaj,
                IsBodyHtml = false
            };
            message.To.Add(toEmail);

            using var pdfStream = new MemoryStream(pdfBytes);
            var attachment = new Attachment(pdfStream, pdfNaziv, "application/pdf");
            message.Attachments.Add(attachment);

            await smtpClient.SendMailAsync(message);
        }
    }
}
