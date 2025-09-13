using Microsoft.AspNetCore.Mvc;
using EventOrganizerAPI.Services.Interfaces;

namespace EventOrganizerAPI.Controllers
{
    [ApiController]
    [Route("api/enums")]
    public class EnumsController : ControllerBase
    {
        private readonly IEnumsService _service;

        public EnumsController(IEnumsService service)
        {
            _service = service;
        }

        /// <summary>GET /api/enums/names — imena svih enum tipova</summary>
        [HttpGet("names")]
        public IActionResult GetEnumNames()
        {
            var names = _service.GetEnumNames();
            return Ok(names);
        }

        /// <summary>GET /api/enums/values/{enumName} — vrednosti jednog enuma</summary>
        [HttpGet("values/{enumName}")]
        public IActionResult GetEnumValues([FromRoute] string enumName)
        {
            var dto = _service.GetEnum(enumName);
            return Ok(dto);
        }

        /// <summary>GET /api/enums/all — svi enumi i vrednosti</summary>
        [HttpGet("all")]
        public IActionResult GetAll()
        {
            var dto = _service.GetAllEnums();
            return Ok(dto);
        }
    }
}
