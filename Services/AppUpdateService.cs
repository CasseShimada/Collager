using System.Diagnostics;
using System.IO.Compression;
using System.Reflection;
using System.Text;
using System.Text.Json;
using System.Text.Json.Serialization;

namespace MeiTool.Services;

public enum AppUpdateCheckReason
{
    Automatic,
    Manual
}

public sealed record AppUpdateStatus(string Message, bool ShowNotification);

public sealed class AppUpdateService : IDisposable
{
    private const string LatestReleaseUrl = "https://api.github.com/repos/CasseShimada/Collager/releases/latest";
    private const string WindowsAssetName = "Collager-win-x64.zip";

    private readonly HttpClient _httpClient;
    private readonly IHostApplicationLifetime _lifetime;
    private readonly ILogger<AppUpdateService> _logger;
    private readonly SemaphoreSlim _updateLock = new(1, 1);
    private bool _disposed;

    public AppUpdateService(IHostApplicationLifetime lifetime, ILogger<AppUpdateService> logger)
    {
        _lifetime = lifetime;
        _logger = logger;
        _httpClient = new HttpClient();
        _httpClient.DefaultRequestHeaders.UserAgent.ParseAdd($"{AppBrand.Name}/{CurrentVersion}");
        _httpClient.DefaultRequestHeaders.Accept.ParseAdd("application/vnd.github+json");
    }

    public event EventHandler<AppUpdateStatus>? StatusChanged;

    public Version CurrentVersion { get; } = GetCurrentVersion();

    public async Task CheckAndInstallAsync(AppUpdateCheckReason reason, CancellationToken cancellationToken = default)
    {
        var isManual = reason == AppUpdateCheckReason.Manual;

        if (!OperatingSystem.IsWindows())
        {
            Publish("自动更新仅支持 Windows exe 版本。", isManual);
            return;
        }

        var processPath = Environment.ProcessPath;
        if (string.IsNullOrWhiteSpace(processPath) ||
            !string.Equals(Path.GetFileName(processPath), $"{AppBrand.Name}.exe", StringComparison.OrdinalIgnoreCase))
        {
            Publish("当前运行方式不支持自动更新，请使用已打包的 exe 版本。", isManual);
            return;
        }

        if (!await _updateLock.WaitAsync(0, cancellationToken))
        {
            Publish("更新检查正在进行中。", isManual);
            return;
        }

        try
        {
            Publish("正在检查更新...", isManual);
            var release = await GetLatestReleaseAsync(cancellationToken);
            if (release is null)
            {
                Publish("没有找到可用的远端版本。", isManual);
                return;
            }

            if (!TryParseVersion(release.TagName, out var latestVersion))
            {
                Publish($"无法识别远端版本号：{release.TagName}", isManual);
                return;
            }

            if (latestVersion <= CurrentVersion)
            {
                Publish($"当前已是最新版本：{CurrentVersion}", isManual);
                return;
            }

            var asset = SelectWindowsAsset(release);
            if (asset is null)
            {
                Publish($"发现 {release.TagName}，但 Release 中没有 {WindowsAssetName}。", true);
                return;
            }

            Publish($"发现新版本 {release.TagName}，正在下载...", true);
            var packagePath = await DownloadPackageAsync(asset, latestVersion, cancellationToken);
            var payloadPath = ExtractPackage(packagePath, latestVersion);
            Publish("更新已下载，正在重启并安装...", true);
            StartInstaller(processPath, payloadPath);
            _lifetime.StopApplication();
        }
        catch (OperationCanceledException) when (cancellationToken.IsCancellationRequested)
        {
            throw;
        }
        catch (Exception ex)
        {
            _logger.LogWarning(ex, "Failed to update {AppName}.", AppBrand.Name);
            Publish($"更新失败：{ex.Message}", isManual);
        }
        finally
        {
            _updateLock.Release();
        }
    }

    private async Task<GitHubRelease?> GetLatestReleaseAsync(CancellationToken cancellationToken)
    {
        using var response = await _httpClient.GetAsync(LatestReleaseUrl, cancellationToken);
        if (!response.IsSuccessStatusCode)
        {
            _logger.LogWarning("GitHub release check failed with status {StatusCode}.", response.StatusCode);
            return null;
        }

        await using var stream = await response.Content.ReadAsStreamAsync(cancellationToken);
        return await JsonSerializer.DeserializeAsync<GitHubRelease>(stream, cancellationToken: cancellationToken);
    }

    private async Task<string> DownloadPackageAsync(GitHubAsset asset, Version version, CancellationToken cancellationToken)
    {
        var updateRoot = CreateUpdateDirectory(version);
        var packagePath = Path.Combine(updateRoot, WindowsAssetName);

        using var response = await _httpClient.GetAsync(asset.BrowserDownloadUrl, HttpCompletionOption.ResponseHeadersRead, cancellationToken);
        response.EnsureSuccessStatusCode();

        await using var input = await response.Content.ReadAsStreamAsync(cancellationToken);
        await using var output = File.Create(packagePath);
        await input.CopyToAsync(output, cancellationToken);
        return packagePath;
    }

    private static string ExtractPackage(string packagePath, Version version)
    {
        var updateRoot = CreateUpdateDirectory(version);
        var payloadPath = Path.Combine(updateRoot, "payload");

        if (Directory.Exists(payloadPath))
        {
            Directory.Delete(payloadPath, true);
        }

        Directory.CreateDirectory(payloadPath);
        ZipFile.ExtractToDirectory(packagePath, payloadPath, true);
        return payloadPath;
    }

    private static string CreateUpdateDirectory(Version version)
    {
        var updateRoot = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
            AppBrand.Name,
            "updates",
            version.ToString());

        Directory.CreateDirectory(updateRoot);
        return updateRoot;
    }

    private static GitHubAsset? SelectWindowsAsset(GitHubRelease release)
    {
        return release.Assets.FirstOrDefault(asset =>
                string.Equals(asset.Name, WindowsAssetName, StringComparison.OrdinalIgnoreCase)) ??
            release.Assets.FirstOrDefault(asset =>
                asset.Name.EndsWith(".zip", StringComparison.OrdinalIgnoreCase) &&
                asset.Name.Contains("win-x64", StringComparison.OrdinalIgnoreCase));
    }

    private static void StartInstaller(string processPath, string payloadPath)
    {
        var targetPath = AppContext.BaseDirectory.TrimEnd(Path.DirectorySeparatorChar, Path.AltDirectorySeparatorChar);
        var exeName = Path.GetFileName(processPath);
        var scriptPath = Path.Combine(Path.GetTempPath(), $"{AppBrand.Name}-install-update-{Guid.NewGuid():N}.ps1");
        var argsBase64 = Convert.ToBase64String(Encoding.UTF8.GetBytes(string.Join('\n', Environment.GetCommandLineArgs().Skip(1))));

        File.WriteAllText(scriptPath, CreateInstallerScript(), Encoding.UTF8);

        var startInfo = new ProcessStartInfo
        {
            FileName = "powershell.exe",
            WorkingDirectory = targetPath,
            UseShellExecute = false,
            CreateNoWindow = true,
            WindowStyle = ProcessWindowStyle.Hidden
        };

        startInfo.ArgumentList.Add("-NoProfile");
        startInfo.ArgumentList.Add("-ExecutionPolicy");
        startInfo.ArgumentList.Add("Bypass");
        startInfo.ArgumentList.Add("-File");
        startInfo.ArgumentList.Add(scriptPath);
        startInfo.ArgumentList.Add("-ProcessId");
        startInfo.ArgumentList.Add(Environment.ProcessId.ToString());
        startInfo.ArgumentList.Add("-Source");
        startInfo.ArgumentList.Add(payloadPath);
        startInfo.ArgumentList.Add("-Target");
        startInfo.ArgumentList.Add(targetPath);
        startInfo.ArgumentList.Add("-ExeName");
        startInfo.ArgumentList.Add(exeName);
        startInfo.ArgumentList.Add("-ArgsBase64");
        startInfo.ArgumentList.Add(argsBase64);

        Process.Start(startInfo);
    }

    private static string CreateInstallerScript()
    {
        return """
param(
    [int]$ProcessId,
    [string]$Source,
    [string]$Target,
    [string]$ExeName,
    [string]$ArgsBase64
)

$ErrorActionPreference = "Stop"

try {
    Wait-Process -Id $ProcessId -Timeout 60
} catch {
}

Start-Sleep -Milliseconds 500

$appSource = $Source
if (-not (Test-Path -LiteralPath (Join-Path $appSource $ExeName))) {
    $candidate = Get-ChildItem -LiteralPath $Source -Directory |
        Where-Object { Test-Path -LiteralPath (Join-Path $_.FullName $ExeName) } |
        Select-Object -First 1

    if ($candidate) {
        $appSource = $candidate.FullName
    }
}

if (-not (Test-Path -LiteralPath (Join-Path $appSource $ExeName))) {
    throw "更新包中没有找到 $ExeName"
}

Get-ChildItem -LiteralPath $appSource -Force | ForEach-Object {
    Copy-Item -LiteralPath $_.FullName -Destination $Target -Recurse -Force
}

$argsText = [System.Text.Encoding]::UTF8.GetString([System.Convert]::FromBase64String($ArgsBase64))
$argumentList = @()
if (-not [string]::IsNullOrWhiteSpace($argsText)) {
    $argumentList = $argsText -split "`n"
}

Start-Process -FilePath (Join-Path $Target $ExeName) -ArgumentList $argumentList -WorkingDirectory $Target -WindowStyle Hidden
""";
    }

    private static bool TryParseVersion(string value, out Version version)
    {
        var normalized = value.Trim().TrimStart('v', 'V');
        var suffixIndex = normalized.IndexOf('-', StringComparison.Ordinal);
        if (suffixIndex >= 0)
        {
            normalized = normalized[..suffixIndex];
        }

        return Version.TryParse(normalized, out version!);
    }

    private static Version GetCurrentVersion()
    {
        var informationalVersion = Assembly
            .GetEntryAssembly()?
            .GetCustomAttribute<AssemblyInformationalVersionAttribute>()?
            .InformationalVersion;

        if (!string.IsNullOrWhiteSpace(informationalVersion))
        {
            var metadataIndex = informationalVersion.IndexOf('+', StringComparison.Ordinal);
            var versionText = metadataIndex >= 0 ? informationalVersion[..metadataIndex] : informationalVersion;
            if (TryParseVersion(versionText, out var version))
            {
                return version;
            }
        }

        return Assembly.GetEntryAssembly()?.GetName().Version ?? new Version(1, 0, 0);
    }

    private void Publish(string message, bool showNotification)
    {
        StatusChanged?.Invoke(this, new AppUpdateStatus(message, showNotification));
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _updateLock.Dispose();
        _httpClient.Dispose();
    }

    private sealed class GitHubRelease
    {
        [JsonPropertyName("tag_name")]
        public string TagName { get; set; } = "";

        [JsonPropertyName("assets")]
        public List<GitHubAsset> Assets { get; set; } = [];
    }

    private sealed class GitHubAsset
    {
        [JsonPropertyName("name")]
        public string Name { get; set; } = "";

        [JsonPropertyName("browser_download_url")]
        public string BrowserDownloadUrl { get; set; } = "";
    }
}
