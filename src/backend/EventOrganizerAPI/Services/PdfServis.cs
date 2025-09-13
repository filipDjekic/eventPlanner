using QuestPDF.Fluent;
using QuestPDF.Helpers;
using QuestPDF.Infrastructure;
using System.IO;

namespace EventOrganizerAPI.Services
{
    public class PdfServis
    {
        public byte[] GenerisiKartuPdf(string nazivKarte, string korisnikIme, string qrSvg)
        {
            var document = QuestPDF.Fluent.Document.Create(container =>
            {
                container.Page(page =>
                {
                    page.Margin(40);
                    page.Size(PageSizes.A6);
                    page.Header().Text($"Karta: {nazivKarte}").FontSize(18).Bold();
                    page.Content().Column(col =>
                    {
                        col.Item().Text($"Korisnik: {korisnikIme}").FontSize(14);
                        col.Item().Width(200).Height(200).Svg(qrSvg);
                    });
                });
            });

            using var ms = new MemoryStream();
            document.GeneratePdf(ms);
            return ms.ToArray();
        }
    }
}