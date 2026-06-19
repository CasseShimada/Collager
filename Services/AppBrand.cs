using System.Reflection;
using System.Text;
using System.Text.RegularExpressions;

namespace Collager.Services;

public static partial class AppBrand
{
    public static string Name { get; } = Assembly.GetEntryAssembly()?.GetName().Name
        ?? throw new InvalidOperationException("Entry assembly name is required.");

    public static string DownloadFileName => $"{CreateFileSlug(Name)}.png";

    public static string TrayThreadName => $"{Name} tray";

    private static string CreateFileSlug(string value)
    {
        var builder = new StringBuilder(value.Length);

        foreach (var character in value)
        {
            builder.Append(char.IsLetterOrDigit(character) ? character : '-');
        }

        var slug = DuplicateDashes().Replace(builder.ToString().Trim('-'), "-");
        return string.IsNullOrWhiteSpace(slug) ? "collage" : slug;
    }

    [GeneratedRegex("-+")]
    private static partial Regex DuplicateDashes();
}
