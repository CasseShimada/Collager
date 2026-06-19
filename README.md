# Collager

Collager 是一款本地运行的图片拼图工具，用来把多张图片快速整理成一张清晰、可下载的 PNG 拼图。

它适合整理截图、作品集、参考图、旅行照片或社交媒体配图。图片在本机处理，浏览器负责选择图片、预览布局和调整细节；你可以使用自动排版，也可以切换到固定模板或等格网格，让大量图片保持整齐。

## 启动 Collager

普通用户可以直接双击已打包文件夹中的程序：

```text
Collager.exe
```

双击后 Collager 会静默启动本地服务，不显示命令行窗口；随后打开浏览器页面，并在 Windows 右下角托盘显示快捷入口。可以从托盘菜单再次打开页面或退出程序。
exe 版本会在启动后自动检查 GitHub Release 更新；也可以在托盘菜单中点击“检查更新”。发现新版本后会下载更新包、重启程序并替换本地文件。

如果你拿到的是源码，可以先在项目目录中打包：

```powershell
.\scripts\package-windows.ps1
```

打包完成后运行：

```text
.\dist\Collager\Collager.exe
```

打包脚本还会生成可上传到 GitHub Release 的更新包：

```text
.\dist\Collager-win-x64.zip
```

发布新版时，更新 `MeituCollage.csproj` 中的版本号，创建高于当前版本的 Release tag（例如 `v1.0.1`），并上传 `Collager-win-x64.zip`。已安装的 exe 版本会根据 Release tag 自动更新。

也可以生成可双击安装的安装文件：

```powershell
.\scripts\build-installer.ps1
```

生成位置：

```text
.\dist\Collager-Setup.exe
```

安装器会覆盖安装到当前用户目录 `%LOCALAPPDATA%\Programs\Collager`，并创建开始菜单、桌面快捷方式和卸载项。已有 Collager 正在运行时，安装器会先结束旧进程再覆盖文件。

开发或临时使用时，也可以保留命令行入口：

```powershell
dotnet run --urls http://localhost:5123
```

然后在浏览器打开：

```text
http://localhost:5123
```

如果希望后台隐藏窗口运行已打包版本：

```powershell
Start-Process -WindowStyle Hidden `
  -FilePath ".\dist\Collager\Collager.exe" `
  -ArgumentList "--urls", "http://localhost:5123", "--no-open"
```

也可以直接给 exe 传入命令行参数：

```powershell
.\dist\Collager\Collager.exe --urls http://localhost:5123
```

停止后台进程：

```powershell
Stop-Process -Name Collager
```

## 用户端使用方式

1. 启动 Collager。
2. 在浏览器中打开 Collager 页面。
3. 拖入图片，或点击选择图片。可以继续追加图片，重复图片会自动跳过。
4. 在左侧选择排版方式：
   - 自动网格：根据图片比例自动组织布局。
   - 等格网格：所有图片使用相同大小的格子，可调整格子比例。
   - 模板：按当前图片数量选择预设版式。
5. 在右侧预览中调整图片：
   - 滚轮缩放图片。
   - 拖动图片调整裁剪位置。
   - 长按后拖动可交换图片位置。
6. 设置画布比例、宽度、高度、间距、边距、圆角和背景色。默认画布为竖版 1080 x 1920。
7. 点击“下载 PNG”保存最终拼图。
