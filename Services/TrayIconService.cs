using System.Diagnostics;
using System.Drawing;
using Forms = System.Windows.Forms;

namespace MeiTool.Services;

public sealed class TrayIconService : IDisposable
{
    private readonly WebApplication _app;
    private readonly Thread _thread;
    private TrayApplicationContext? _context;
    private bool _disposed;

    public TrayIconService(WebApplication app)
    {
        _app = app;
        _thread = new Thread(RunTray)
        {
            IsBackground = true,
            Name = AppBrand.TrayThreadName
        };
        _thread.SetApartmentState(ApartmentState.STA);
    }

    public void Start()
    {
        _thread.Start();
        _app.Lifetime.ApplicationStopping.Register(Dispose);
    }

    private void RunTray()
    {
        Forms.Application.EnableVisualStyles();
        Forms.Application.SetCompatibleTextRenderingDefault(false);
        _context = new TrayApplicationContext(OpenApp, StopApp);
        Forms.Application.Run(_context);
    }

    private void OpenApp()
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

    public void Dispose()
    {
        if (_disposed)
        {
            return;
        }

        _disposed = true;
        _context?.ExitThread();
    }

    private sealed class TrayApplicationContext : Forms.ApplicationContext
    {
        private readonly Forms.NotifyIcon _notifyIcon;

        public TrayApplicationContext(Action openApp, Action stopApp)
        {
            var openItem = new Forms.ToolStripMenuItem($"打开 {AppBrand.Name}", null, (_, _) => openApp());
            var exitItem = new Forms.ToolStripMenuItem("退出", null, (_, _) => stopApp());

            _notifyIcon = new Forms.NotifyIcon
            {
                Icon = SystemIcons.Application,
                Text = AppBrand.Name,
                Visible = true,
                ContextMenuStrip = new Forms.ContextMenuStrip()
            };

            _notifyIcon.ContextMenuStrip.Items.Add(openItem);
            _notifyIcon.ContextMenuStrip.Items.Add(new Forms.ToolStripSeparator());
            _notifyIcon.ContextMenuStrip.Items.Add(exitItem);
            _notifyIcon.DoubleClick += (_, _) => openApp();
        }

        protected override void Dispose(bool disposing)
        {
            if (disposing)
            {
                _notifyIcon.Visible = false;
                _notifyIcon.Dispose();
            }

            base.Dispose(disposing);
        }
    }
}
