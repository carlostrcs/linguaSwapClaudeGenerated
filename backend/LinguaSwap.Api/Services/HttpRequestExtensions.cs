namespace LinguaSwap.Api.Services;

public static class HttpRequestExtensions
{
    /// <summary>
    /// The caller's UI language from the <c>X-UI-Language</c> header, reduced to a bare primary
    /// subtag (<c>pt-BR</c> → <c>pt</c>), or null when the header is absent or blank. Used to localize
    /// entry notes and curated library name/description; a null just means "use the English
    /// fallback". The client (<c>frontend/src/api/client.ts</c>) sends the current UI locale here.
    /// </summary>
    public static string? GetUiLanguage(this HttpRequest request)
    {
        var raw = request.Headers["X-UI-Language"].FirstOrDefault();
        if (string.IsNullOrWhiteSpace(raw)) return null;
        var code = raw.Trim().ToLowerInvariant();
        var separator = code.IndexOfAny(['-', '_']);
        if (separator > 0) code = code[..separator];
        return code.Length is >= 2 and <= 3 ? code : null;
    }
}
