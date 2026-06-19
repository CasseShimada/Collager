using MeiTool.Models;
using MeiTool.Services;
using Microsoft.AspNetCore.Http.Features;
using System.Globalization;
using System.Text.Json;

var appArgs = args
    .Where(argument => !string.Equals(argument, "--no-open", StringComparison.OrdinalIgnoreCase))
    .ToArray();
var openBrowserOnStart = appArgs.Length == args.Length;
var builder = WebApplication.CreateBuilder(appArgs);
const long MaxUploadBytes = 256L * 1024 * 1024;

builder.WebHost.ConfigureKestrel(options =>
{
    options.Limits.MaxRequestBodySize = MaxUploadBytes;
});

builder.Services.AddSingleton<CollageRenderer>();
builder.Services.Configure<FormOptions>(options =>
{
    options.MultipartBodyLengthLimit = MaxUploadBytes;
});

var app = builder.Build();

app.Use(async (context, next) =>
{
    if (context.Request.Path == "/" || context.Request.Path == "/index.html")
    {
        var indexPath = Path.Combine(app.Environment.WebRootPath, "index.html");
        var html = await File.ReadAllTextAsync(indexPath, context.RequestAborted);
        html = html.Replace("__APP_NAME__", AppBrand.Name, StringComparison.Ordinal);
        context.Response.ContentType = "text/html";
        await context.Response.WriteAsync(html, context.RequestAborted);
        return;
    }

    await next();
});

app.UseStaticFiles();

app.MapPost("/api/collage", async (HttpRequest request, CollageRenderer renderer) =>
{
    if (!request.HasFormContentType)
    {
        return Results.BadRequest(new { error = "请使用表单上传图片。" });
    }

    IFormCollection form;
    try
    {
        form = await request.ReadFormAsync();
    }
    catch (BadHttpRequestException)
    {
        return Results.BadRequest(new { error = "上传图片过大，请减少图片数量或压缩后重试。" });
    }
    catch (InvalidDataException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }

    var imageFiles = form.Files
        .Where(file => file.Length > 0)
        .ToList();

    if (imageFiles.Count == 0)
    {
        return Results.BadRequest(new { error = "请至少选择一张图片。" });
    }

    if (imageFiles.Count > 31)
    {
        return Results.BadRequest(new { error = "一次最多支持 31 张图片。" });
    }

    var options = new CollageOptions
    {
        OutputWidth = ReadInt(form, "width", 1080, 400, 6000),
        OutputHeight = ReadInt(form, "height", 1920, 400, 6000),
        Gap = ReadInt(form, "gap", 18, 0, 120),
        OuterPadding = ReadInt(form, "padding", 28, 0, 200),
        CornerRadius = ReadInt(form, "radius", 18, 0, 80),
        BackgroundColor = ColorParser.Parse(form["background"], "#ffffff"),
        Mode = Enum.TryParse<CollageMode>(form["mode"], true, out var mode) ? mode : CollageMode.Auto,
        TemplateId = string.IsNullOrWhiteSpace(form["template"]) ? "auto" : form["template"].ToString(),
        TemplateColumns = ReadInt(form, "templateColumns", 6, 1, 24),
        TemplateRows = ReadInt(form, "templateRows", 6, 1, 24),
        EqualGridRatio = ReadDouble(form, "equalGridRatio", 1, 0.35, 2.8),
        TemplateCells = ReadTemplateCells(form["templateCells"]),
        Placements = ReadPlacements(form["placements"])
    };

    try
    {
        await using var output = new MemoryStream();
        await renderer.RenderAsync(imageFiles, options, output, request.HttpContext.RequestAborted);
        return Results.File(output.ToArray(), "image/png", AppBrand.DownloadFileName);
    }
    catch (InvalidDataException ex)
    {
        return Results.BadRequest(new { error = ex.Message });
    }
});

app.MapFallback(async (HttpContext context, IWebHostEnvironment environment) =>
{
    if (Path.HasExtension(context.Request.Path))
    {
        return Results.NotFound();
    }

    var indexPath = Path.Combine(environment.WebRootPath, "index.html");
    var html = await File.ReadAllTextAsync(indexPath);
    html = html.Replace("__APP_NAME__", AppBrand.Name, StringComparison.Ordinal);
    return Results.Content(html, "text/html");
});

using var trayIcon = new TrayIconService(app);
trayIcon.Start();
if (openBrowserOnStart)
{
    app.Lifetime.ApplicationStarted.Register(trayIcon.OpenApp);
}

app.Run();

static int ReadInt(IFormCollection form, string key, int fallback, int min, int max)
{
    if (!int.TryParse(form[key], out var value))
    {
        return fallback;
    }

    return Math.Clamp(value, min, max);
}

static double ReadDouble(IFormCollection form, string key, double fallback, double min, double max)
{
    if (!double.TryParse(form[key], CultureInfo.InvariantCulture, out var value))
    {
        return fallback;
    }

    return Math.Clamp(value, min, max);
}

static IReadOnlyList<ImagePlacement> ReadPlacements(string? value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return [];
    }

    try
    {
        return JsonSerializer.Deserialize<List<ImagePlacement>>(
            value,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];
    }
    catch (JsonException)
    {
        return [];
    }
}

static IReadOnlyList<TemplateCell> ReadTemplateCells(string? value)
{
    if (string.IsNullOrWhiteSpace(value))
    {
        return [];
    }

    try
    {
        return JsonSerializer.Deserialize<List<TemplateCell>>(
            value,
            new JsonSerializerOptions { PropertyNameCaseInsensitive = true }) ?? [];
    }
    catch (JsonException)
    {
        return [];
    }
}
