# Collager

Collager 是一款本地运行的图片拼图工具，用来把多张图片快速整理成一张清晰、可下载的 PNG 拼图。

它适合整理截图、作品集、参考图、旅行照片或社交媒体配图。图片在本机处理，浏览器负责选择图片、预览布局和调整细节；你可以使用自动排版，也可以切换到固定模板或等格网格，让大量图片保持整齐。

## 启动 Collager

开发或临时使用时，可以在项目目录中运行：

```powershell
dotnet run --urls http://localhost:5123
```

然后在浏览器打开：

```text
http://localhost:5123
```

如果希望后台运行，先编译 Release 版本：

```powershell
dotnet build -c Release
```

再用隐藏窗口启动：

```powershell
Start-Process -WindowStyle Hidden `
  -FilePath ".\bin\Release\net8.0-windows\Collager.exe" `
  -ArgumentList "--urls", "http://localhost:5123"
```

启动后仍然通过浏览器访问：

```text
http://localhost:5123
```

Collager 会在 Windows 右下角托盘显示快捷入口，可以从托盘菜单打开页面或退出程序。也可以用命令停止后台进程：

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
6. 设置宽度、高度、间距、边距、圆角和背景色。
7. 点击“下载 PNG”保存最终拼图。
