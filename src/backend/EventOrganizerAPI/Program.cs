using EventOrganizerAPI.Config;
using EventOrganizerAPI.Services;
using EventOrganizerAPI.Services.Interfaces;
using EventOrganizerAPI.Servisi;
using Microsoft.AspNetCore.Authentication.JwtBearer;
using Microsoft.IdentityModel.Tokens;
using MongoDB.Driver;
using System.Text;
using QuestPDF;
using System.Linq;                 // za FirstOrDefault
using System.Diagnostics;          // za Process.Start

namespace EventOrganizerAPI
{
    public class Program
    {
        public static void Main(string[] args)
        {
            // ======== DODAJ LICENCU ZA QUESTPDF ========
            QuestPDF.Settings.License = QuestPDF.Infrastructure.LicenseType.Community;

            var builder = WebApplication.CreateBuilder(args);

            // ============================
            // 1. MongoDB konekcija
            // ============================
            builder.Services.AddSingleton<IMongoClient>(sp =>
                new MongoClient(builder.Configuration.GetConnectionString("MongoDb")));

            builder.Services.AddSingleton(sp =>
            {
                var client = sp.GetRequiredService<IMongoClient>();
                return client.GetDatabase("OrganizatorDogadjajaDB");
            });

            builder.Services.Configure<MongoDbSettings>(builder.Configuration.GetSection("MongoDbSettings"));

            // ============================
            // 2. JWT autentifikacija
            // ============================
            builder.Services.AddAuthentication(JwtBearerDefaults.AuthenticationScheme)
                .AddJwtBearer(options =>
                {
                    options.TokenValidationParameters = new TokenValidationParameters
                    {
                        ValidateIssuer = true,
                        ValidateAudience = true,
                        ValidateLifetime = true,
                        ValidateIssuerSigningKey = true,
                        ValidIssuer = builder.Configuration["Jwt:Issuer"],
                        ValidAudience = builder.Configuration["Jwt:Audience"],
                        IssuerSigningKey = new SymmetricSecurityKey(
                            Encoding.ASCII.GetBytes(builder.Configuration["Jwt:SecretKey"]!))
                    };
                });

            builder.Services.AddAuthorization(options =>
            {
                options.AddPolicy("VerifikovanEmail", policy =>
                    policy.RequireClaim("verifikovan_email", "true"));
            });

            // ============================
            // 3. CORS konfiguracija
            // ============================
            builder.Services.AddCors(options =>
            {
                options.AddPolicy("AllowAll", policy =>
                {
                    policy.WithOrigins("http://localhost:3000", "http://localhost:8081")
                          .AllowAnyHeader()
                          .AllowAnyMethod()
                          .AllowCredentials();
                });
            });

            // ============================
            // 4. Swagger konfiguracija
            // ============================
            builder.Services.AddEndpointsApiExplorer();
            builder.Services.AddSwaggerGen(c =>
            {
                c.SwaggerDoc("v1", new Microsoft.OpenApi.Models.OpenApiInfo
                {
                    Title = "Event Organizer API",
                    Version = "v1"
                });

                c.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                {
                    Name = "Authorization",
                    Type = Microsoft.OpenApi.Models.SecuritySchemeType.ApiKey,
                    Scheme = "Bearer",
                    BearerFormat = "JWT",
                    In = Microsoft.OpenApi.Models.ParameterLocation.Header,
                    Description = "Unesi JWT token u formatu: Bearer {token}"
                });

                c.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
                {
                    {
                        new Microsoft.OpenApi.Models.OpenApiSecurityScheme
                        {
                            Reference = new Microsoft.OpenApi.Models.OpenApiReference
                            {
                                Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
                                Id = "Bearer"
                            }
                        },
                        Array.Empty<string>()
                    }
                });

                c.SupportNonNullableReferenceTypes();
                c.MapType<IFormFile>(() => new Microsoft.OpenApi.Models.OpenApiSchema
                {
                    Type = "string",
                    Format = "binary"
                });
                c.CustomSchemaIds(type => type.FullName);
            });

            // ============================
            // 5. Registracija servisa
            // ============================
            builder.Services.AddSingleton<ITokenServis, TokenServis>();
            builder.Services.AddSingleton<KarticaServis>();
            builder.Services.AddSingleton<QRKodServis>();
            builder.Services.AddSingleton<PrisustvoServis>();

            builder.Services.AddScoped<KorisnikServis>();
            builder.Services.AddScoped<IOrganizatorServis, OrganizatorServis>();
            builder.Services.AddScoped<IDobavljacServis, DobavljacServis>();
            builder.Services.AddScoped<IDogadjajServis, DogadjajServis>();
            builder.Services.AddScoped<INapomenaServis, NapomenaServis>();
            builder.Services.AddScoped<INotifikacijeServis, NotifikacijaServis>();
            builder.Services.AddScoped<IKartaServis, KartaServis>();
            builder.Services.AddScoped<CenovnikServis>();
            builder.Services.AddScoped<CenovnikStavkaServis>();
            builder.Services.AddScoped<LokacijaServis>();
            builder.Services.AddScoped<PodrucjeServis>();
            builder.Services.AddScoped<IRasporedServis, RasporedServis>();
            builder.Services.AddScoped<IAktivnostiServis, AktivnostiServis>();
            builder.Services.AddScoped<PrijavaServis>();
            builder.Services.AddScoped<EmailServis>();
            builder.Services.AddScoped<IAuthServis, AuthServis>();
            builder.Services.AddScoped<IKorisnikServis, KorisnikServis>();
            builder.Services.AddScoped<IDanDogadjajaServis, DanDogadjajaServis>();
            builder.Services.AddScoped<IResursServis, ResursServis>();
            builder.Services.AddScoped<PdfServis>();

            builder.Services.AddControllers();

            // ============================
            // 6. Pokretanje aplikacije
            // ============================
            builder.WebHost.UseUrls("http://localhost:5246");
            var app = builder.Build();

            app.Urls.Add("http://localhost:5246");

            app.UseCors("AllowAll");

            // --- Swagger uvek uključen i na root-u ---
            app.UseSwagger();
            app.UseSwaggerUI(c =>
            {
                c.SwaggerEndpoint("/swagger/v1/swagger.json", "Event Organizer API v1");
                c.RoutePrefix = string.Empty; // Swagger UI na /
            });

            // (Opcionalno) Automatski otvori browser na Swagger UI u DEV okruženju
            if (app.Environment.IsDevelopment())
            {
                _ = Task.Run(async () =>
                {
                    await Task.Delay(1000);
                    try
                    {
                        var url = app.Urls.FirstOrDefault() ?? "http://localhost:5246";
                        Process.Start(new ProcessStartInfo
                        {
                            FileName = url,
                            UseShellExecute = true
                        });
                    }
                    catch { /* ignoriši ako smo u kontejneru/bez GUI-a */ }
                });
            }

            //app.UseHttpsRedirection();
            app.UseStaticFiles();
            app.UseAuthentication();
            app.UseAuthorization();

            app.MapControllers();

            app.Run();
        }
    }
}
