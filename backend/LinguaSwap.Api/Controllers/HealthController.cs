using Microsoft.AspNetCore.Mvc;

namespace LinguaSwap.Api.Controllers;

/// <summary>
/// A simple endpoint to confirm the API is running. Visit /api/health.
/// </summary>
[ApiController]
[Route("api/[controller]")]
public class HealthController : ControllerBase
{
    [HttpGet]
    public IActionResult Get() => Ok(new { status = "ok", service = "LinguaSwap.Api" });
}
