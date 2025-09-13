using EventOrganizerAPI.Models;
using EventOrganizerAPI.Servisi;
using MongoDB.Driver;
using System;
using System.Threading.Tasks;

namespace EventOrganizerAPI.Services
{
    public class PrijavaServis
    {
        private readonly IMongoCollection<Karta> _karte;
        private readonly IMongoCollection<Dogadjaj> _dogadjaji;
        private readonly IMongoCollection<Korisnik> _korisnici;
        private readonly KarticaServis _kreditKarticeService;
        private readonly QRKodServis _qrKodServis;
        private readonly IMongoCollection<KupljenaKarta> _kupljeneKarte;

        public PrijavaServis(IMongoDatabase baza, KarticaServis kreditKarticeService, QRKodServis qRKodServis)
        {
            _karte = baza.GetCollection<Karta>("Karte");
            _dogadjaji = baza.GetCollection<Dogadjaj>("Dogadjaji");
            _korisnici = baza.GetCollection<Korisnik>("Korisnici");
            _qrKodServis = qRKodServis;
            _kreditKarticeService = kreditKarticeService;
        }

        // Provera da li događaj postoji i da li je prošao datum
        public async Task<bool> ProveriNevazeciDogadjaj(string dogadjajId)
        {
            var dogadjaj = await _dogadjaji
                .Find(d => d.Id == dogadjajId)
                .FirstOrDefaultAsync();

            if (dogadjaj == null || dogadjaj.DatumKraja < DateTime.Now) // Ako ne postoji ili je prošao datum
                return false;

            return true;
        }

        // Provera da li postoje slobodna mesta ili karte za događaj
        public async Task<bool> ProveriSlobodneKarte(string dogadjajId)
        {
            var dogadjaj = await _dogadjaji
                .Find(d => d.Id == dogadjajId)
                .FirstOrDefaultAsync();

            if (dogadjaj == null || dogadjaj.Kapacitet <= dogadjaj.Prijavljeni.Count)
                return false;

            return true;
        }

        public async Task<int?> ProveriSlobodneKarteBroj(string dogadjajId)
        {
            var dogadjaj = await _dogadjaji
                .Find(d => d.Id == dogadjajId)
                .FirstOrDefaultAsync();

            if (dogadjaj == null)
                return null; // Ako događaj ne postoji, vraćamo null

            // Računamo preostala mesta
            int preostalaMesta = dogadjaj.Kapacitet - dogadjaj.Prijavljeni.Count;

            if (preostalaMesta < 0)
                preostalaMesta = 0; // Osiguravamo da broj ne bude negativan

            return preostalaMesta;
        }

        // Provera da li korisnik ima dovoljno kredita
        public async Task<bool> ProveriDovoljnoKredita(string korisnikId, decimal cenaKarte)
        {
            var kreditKartica = await _kreditKarticeService.VratiStanjeAsync(korisnikId);

            // Ako kreditna kartica ne postoji ili stanje kredita na kartici je manje od cene karte, vraćamo false
            if (kreditKartica == null || kreditKartica < cenaKarte)
            {
                return false;
            }

            // Ako je stanje kredita dovoljno, vraćamo true
            return true;
        }

        // Provera da li je tip karte validan
        public async Task<bool> ProveriValidnuVrstuKarte(string tipKarteId)
        {
            var karta = await _karte
                .Find(k => k.Id == tipKarteId)
                .FirstOrDefaultAsync();

            if (karta == null) // Ako tip karte ne postoji
                return false;

            return true;
        }



        public async Task<string> DajQRKodZaKartuAsync(string korisnikId, string kartaId)
        {
            var korisnik = await _korisnici.Find(k => k.Id == korisnikId).FirstOrDefaultAsync();
            var karta = await _karte.Find(k => k.Id == kartaId).FirstOrDefaultAsync();

            if (korisnik == null || karta == null)
                return null;

            if (!korisnik.Karte.Contains(kartaId))
                return null; // Korisnik nema kupljenu kartu

            // Nađi KupljenuKartu zapis (pretpostavljam da imaš kolekciju _kupljeneKarte)
            var kupljenaKarta = await _kupljeneKarte.Find(k => k.KorisnikId == korisnikId && k.KartaId == kartaId).FirstOrDefaultAsync();
            if (kupljenaKarta == null)
                return null;

            // Generiši QR kod na osnovu Id-a kupljene karte
            return _qrKodServis.GenerisiTrajniQRKod(kupljenaKarta.Id);
        }
    }
}
