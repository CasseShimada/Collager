using System.Diagnostics;
using System.IO.Compression;
using System.Reflection;
using System.Runtime.InteropServices;
using Forms = System.Windows.Forms;

namespace CollagerInstaller;

internal static class Program
{
    private const string AppName = "Collager";
    private const string PayloadResourceName = "CollagerPayload.zip";

    [STAThread]
    private static int Main(string[] args)
    {
        Forms.Application.EnableVisualStyles();
        Forms.Application.SetCompatibleTextRenderingDefault(false);

        try
        {
            var options = InstallOptions.Parse(args);
            var installDir = options.InstallDir ?? Path.Combine(
                Environment.GetFolderPath(Environment.SpecialFolder.LocalApplicationData),
                "Programs",
                AppName);

            Install(installDir);

            if (!options.Quiet)
            {
                var choice = Forms.MessageBox.Show(
                    $"{AppName} 已安装完成。\n\n安装位置：{installDir}\n\n是否现在启动？",
                    $"{AppName} 安装完成",
                    Forms.MessageBoxButtons.YesNo,
                    Forms.MessageBoxIcon.Information);

                if (choice == Forms.DialogResult.Yes)
                {
                    StartApp(installDir);
                }
            }
            else if (options.StartAfterInstall)
            {
                StartApp(installDir);
            }

            return 0;
        }
        catch (Exception ex)
        {
            Forms.MessageBox.Show(
                $"安装失败：{ex.Message}",
                $"{AppName} 安装失败",
                Forms.MessageBoxButtons.OK,
                Forms.MessageBoxIcon.Error);
            return 1;
        }
    }

    private static void Install(string installDir)
    {
        StopRunningApp();
        Directory.CreateDirectory(installDir);

        var tempDir = Path.Combine(Path.GetTempPath(), $"{AppName}-Setup-{Guid.NewGuid():N}");
        Directory.CreateDirectory(tempDir);

        try
        {
            var zipPath = Path.Combine(tempDir, $"{AppName}.zip");
            using (var payload = Assembly.GetExecutingAssembly().GetManifestResourceStream(PayloadResourceName)
                ?? throw new InvalidOperationException("安装器没有包含应用文件。"))
            using (var output = File.Create(zipPath))
            {
                payload.CopyTo(output);
            }

            var extractDir = Path.Combine(tempDir, "payload");
            ZipFile.ExtractToDirectory(zipPath, extractDir);
            var sourceDir = FindAppSourceDirectory(extractDir);

            ClearDirectory(installDir);
            CopyDirectory(sourceDir, installDir);
            CreateShortcuts(installDir);
            WriteUninstallEntry(installDir);
        }
        finally
        {
            TryDeleteDirectory(tempDir);
        }
    }

    private static void StopRunningApp()
    {
        foreach (var process in Process.GetProcessesByName(AppName))
        {
            try
            {
                process.CloseMainWindow();
                if (!process.WaitForExit(2500))
                {
                    process.Kill(entireProcessTree: true);
                    process.WaitForExit(5000);
                }
            }
            catch
            {
            }
            finally
            {
                process.Dispose();
            }
        }
    }

    private static string FindAppSourceDirectory(string extractDir)
    {
        if (File.Exists(Path.Combine(extractDir, $"{AppName}.exe")))
        {
            return extractDir;
        }

        var candidate = Directory
            .EnumerateDirectories(extractDir, "*", SearchOption.AllDirectories)
            .FirstOrDefault(directory => File.Exists(Path.Combine(directory, $"{AppName}.exe")));

        return candidate ?? throw new InvalidOperationException($"更新包中没有找到 {AppName}.exe。");
    }

    private static void ClearDirectory(string directory)
    {
        foreach (var file in Directory.EnumerateFiles(directory))
        {
            File.SetAttributes(file, FileAttributes.Normal);
            File.Delete(file);
        }

        foreach (var childDirectory in Directory.EnumerateDirectories(directory))
        {
            Directory.Delete(childDirectory, recursive: true);
        }
    }

    private static void CopyDirectory(string source, string destination)
    {
        foreach (var directory in Directory.EnumerateDirectories(source, "*", SearchOption.AllDirectories))
        {
            Directory.CreateDirectory(Path.Combine(destination, Path.GetRelativePath(source, directory)));
        }

        foreach (var file in Directory.EnumerateFiles(source, "*", SearchOption.AllDirectories))
        {
            var relativePath = Path.GetRelativePath(source, file);
            var target = Path.Combine(destination, relativePath);
            Directory.CreateDirectory(Path.GetDirectoryName(target)!);
            File.Copy(file, target, overwrite: true);
        }
    }

    private static void CreateShortcuts(string installDir)
    {
        var exePath = Path.Combine(installDir, $"{AppName}.exe");
        var startMenuDir = Path.Combine(
            Environment.GetFolderPath(Environment.SpecialFolder.StartMenu),
            "Programs",
            AppName);

        Directory.CreateDirectory(startMenuDir);
        CreateShortcut(Path.Combine(startMenuDir, $"{AppName}.lnk"), exePath, installDir);
        CreateShortcut(Path.Combine(Environment.GetFolderPath(Environment.SpecialFolder.DesktopDirectory), $"{AppName}.lnk"), exePath, installDir);
    }

    private static void CreateShortcut(string shortcutPath, string targetPath, string workingDirectory)
    {
        var shellType = Type.GetTypeFromProgID("WScript.Shell")
            ?? throw new InvalidOperationException("无法创建 Windows 快捷方式。");
        dynamic shell = Activator.CreateInstance(shellType)
            ?? throw new InvalidOperationException("无法创建 Windows 快捷方式。");
        dynamic shortcut = shell.CreateShortcut(shortcutPath);
        shortcut.TargetPath = targetPath;
        shortcut.WorkingDirectory = workingDirectory;
        shortcut.IconLocation = targetPath;
        shortcut.Save();

        Marshal.FinalReleaseComObject(shortcut);
        Marshal.FinalReleaseComObject(shell);
    }

    private static void WriteUninstallEntry(string installDir)
    {
        var uninstallScript = Path.Combine(installDir, "Uninstall-Collager.ps1");
        File.WriteAllText(
            uninstallScript,
            """
$ErrorActionPreference = "SilentlyContinue"
Get-Process -Name "Collager" | Stop-Process -Force
Remove-Item -LiteralPath "$env:APPDATA\Microsoft\Windows\Start Menu\Programs\Collager" -Recurse -Force
Remove-Item -LiteralPath "$env:USERPROFILE\Desktop\Collager.lnk" -Force
Remove-Item -LiteralPath "HKCU:\Software\Microsoft\Windows\CurrentVersion\Uninstall\Collager" -Recurse -Force
Remove-Item -LiteralPath "$env:LOCALAPPDATA\Programs\Collager" -Recurse -Force
""");

        using var key = Microsoft.Win32.Registry.CurrentUser.CreateSubKey(
            @"Software\Microsoft\Windows\CurrentVersion\Uninstall\Collager");

        key.SetValue("DisplayName", AppName);
        key.SetValue("DisplayVersion", Assembly.GetExecutingAssembly().GetName().Version?.ToString(3) ?? "1.0.0");
        key.SetValue("Publisher", "CasseShimada");
        key.SetValue("InstallLocation", installDir);
        key.SetValue("DisplayIcon", Path.Combine(installDir, $"{AppName}.exe"));
        key.SetValue("UninstallString", $"powershell.exe -ExecutionPolicy Bypass -File \"{uninstallScript}\"");
        key.SetValue("QuietUninstallString", $"powershell.exe -ExecutionPolicy Bypass -File \"{uninstallScript}\"");
        key.SetValue("NoModify", 1, Microsoft.Win32.RegistryValueKind.DWord);
        key.SetValue("NoRepair", 1, Microsoft.Win32.RegistryValueKind.DWord);
    }

    private static void StartApp(string installDir)
    {
        Process.Start(new ProcessStartInfo
        {
            FileName = Path.Combine(installDir, $"{AppName}.exe"),
            WorkingDirectory = installDir,
            UseShellExecute = true
        });
    }

    private static void TryDeleteDirectory(string directory)
    {
        try
        {
            Directory.Delete(directory, recursive: true);
        }
        catch
        {
        }
    }

    private sealed record InstallOptions(bool Quiet, bool StartAfterInstall, string? InstallDir)
    {
        public static InstallOptions Parse(string[] args)
        {
            var quiet = args.Any(argument =>
                string.Equals(argument, "/quiet", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(argument, "--quiet", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(argument, "/silent", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(argument, "--silent", StringComparison.OrdinalIgnoreCase));
            var noStart = args.Any(argument =>
                string.Equals(argument, "/no-start", StringComparison.OrdinalIgnoreCase) ||
                string.Equals(argument, "--no-start", StringComparison.OrdinalIgnoreCase));
            var installDir = args
                .Select(argument => argument.StartsWith("/dir=", StringComparison.OrdinalIgnoreCase) ||
                    argument.StartsWith("--install-dir=", StringComparison.OrdinalIgnoreCase)
                    ? argument[(argument.IndexOf('=') + 1)..].Trim('"')
                    : null)
                .FirstOrDefault(value => !string.IsNullOrWhiteSpace(value));

            return new InstallOptions(quiet, quiet && !noStart, installDir);
        }
    }
}
