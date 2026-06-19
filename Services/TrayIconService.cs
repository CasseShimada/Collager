using System.Diagnostics;
using System.Drawing;
using Forms = System.Windows.Forms;

namespace MeiTool.Services;

public sealed class TrayIconService : IDisposable
{
    private readonly WebApplication _app;
    private readonly AppUpdateService _updates;
    private readonly Thread _thread;
    private TrayApplicationContext? _context;
    private bool _disposed;

    public TrayIconService(WebApplication app, AppUpdateService updates)
    {
        _app = app;
        _updates = updates;
        _thread = new Thread(RunTray)
        {
            IsBackground = true,
            Name = AppBrand.TrayThreadName
        };
        _thread.SetApartmentState(ApartmentState.STA);
    }

    public void Start()
    {
        _updates.StatusChanged += OnUpdateStatusChanged;
        _thread.Start();
        _app.Lifetime.ApplicationStopping.Register(Dispose);
    }

    private void RunTray()
    {
        Forms.Application.EnableVisualStyles();
        Forms.Application.SetCompatibleTextRenderingDefault(false);
        _context = new TrayApplicationContext(OpenApp, CheckForUpdates, StopApp);
        Forms.Application.Run(_context);
    }

    public void OpenApp()
    {
        var url = _app.Urls.FirstOrDefault() ?? "http://localhost:5123";
        Process.Start(new ProcessStartInfo
        {
            FileName = url,
            UseShellExecute = true
        });
    }

    private void StopApp()
    {
        _app.Lifetime.StopApplication();
        _context?.ExitThread();
    }

    private void CheckForUpdates()
    {
        _ = Task.Run(() => _updates.CheckAndInstallAsync(AppUpdateCheckReason.Manual));
    }

    private void OnUpdateStatusChanged(object? sender, AppUpdateStatus status)
    {
        if (status.ShowNotification)
        {
            _context?.ShowMessage(status.Message);
        }
    }

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _updates.StatusChanged -= OnUpdateStatusChanged;
        _context?.ExitThread();
    }

    private sealed class TrayApplicationContext : Forms.ApplicationContext
    {
        private readonly Forms.NotifyIcon _notifyIcon;
        private readonly Forms.Control _messageTarget;

        public TrayApplicationContext(Action openApp, Action checkForUpdates, Action stopApp)
        {
            var openItem = new Forms.ToolStripMenuItem($"打开 {AppBrand.Name}", null, (_, _) => openApp());
            var updateItem = new Forms.ToolStripMenuItem("检查更新", null, (_, _) => checkForUpdates());
            var exitItem = new Forms.ToolStripMenuItem("退出", null, (_, _) => stopApp());
            _messageTarget = new Forms.Control();
            _messageTarget.CreateControl();

            _notifyIcon = new Forms.NotifyIcon
            {
                Icon = SystemIcons.Application,
                Text = AppBrand.Name,
                Visible = true,
                ContextMenuStrip = new Forms.ContextMenuStrip()
            };

            _notifyIcon.ContextMenuStrip.Items.Add(openItem);
            _notifyIcon.ContextMenuStrip.Items.Add(updateItem);
            _notifyIcon.ContextMenuStrip.Items.Add(new Forms.ToolStripSeparator());
            _notifyIcon.ContextMenuStrip.Items.Add(exitItem);
            _notifyIcon.DoubleClick += (_, _) => openApp();
        }

        public void ShowMessage(string message)
        {
            if (_messageTarget.IsDisposed)
            {
                return;
            }

            _messageTarget.BeginInvoke(() =>
            {
                _notifyIcon.BalloonTipTitle = AppBrand.Name;
                _notifyIcon.BalloonTipText = message;
                _notifyIcon.ShowBalloonTip(5000);
            });
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _notifyIcon.Visible = false;
                _notifyIcon.Dispose();
                _messageTarget.Dispose();
            }

            base.Dispose(disposing);
        }
    }
}
