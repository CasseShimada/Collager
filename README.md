# Collager

Collager 是一款本地运行的图片拼图工具，用来把多张图片整理成一张清晰的 PNG 拼图。

图片在本机处理，浏览器只作为操作界面使用。你可以选择自动网格、等格网格或按图片数量显示的模板，在预览中调整裁剪、缩放、交换和删除图片，然后一键生成下载。

Collager 是免费开源软件，仅在 GitHub 免费发布。任何公开售卖 Collager 的行为均为骗局。遇到 bug 或有建议，可以通过 GitHub Issue 反馈。

## 启动 Collager

推荐下载并运行 GitHub Release 中的安装文件：

```text
Collager-Setup.exe
```

安装后从桌面快捷方式或开始菜单打开 Collager。

如果拿到的是免安装文件夹，请双击：

```text
Collager.exe
```

启动后 Collager 会静默运行本地服务，不显示命令行窗口，并自动打开浏览器页面。Windows 右下角托盘会显示 Collager 图标，可以从托盘菜单重新打开页面或退出程序。

正式打包版本不提供命令行启动入口，不需要传入端口或后台参数。

Collager 会在本机保存配置文件：

```text
%LOCALAPPDATA%\Collager\config.json
```

可以在配置文件中修改启动端口：

```json
{
  "port": 5123
}
```

端口修改后需要重启 Collager 才会生效。浏览器页面中的画布、模板和参数设置也会保存到这个配置文件；刷新页面时会恢复上次设置，但不会恢复已选择的图片。

## 通过 GitHub 更新

Collager 会在浏览器页面提示 GitHub Release 更新，但不会强制更新。只有点击页面中的“立即更新”后，才会下载更新包、重启程序并替换本地文件。

也可以手动更新：

1. 打开 [GitHub Releases](https://github.com/CasseShimada/Collager/releases)。
2. 下载最新版 `Collager-Setup.exe`。
3. 双击安装文件覆盖安装已有版本。

开发者发布新版时，更新 `MeituCollage.csproj` 中的版本号，创建高于当前版本的 tag，例如 `v1.0.1`，并推送到 GitHub。GitHub Actions 会自动编译 `Collager-win-x64.zip` 和 `Collager-Setup.exe`，并发布到对应 Release。

## 使用方法

1. 启动 Collager，等待浏览器页面打开。
2. 拖入图片，或点击选择图片。可以继续追加图片，重复图片会自动跳过。
3. 在左侧选择排版方式：
   - 自动网格：根据图片原始比例自动组织布局。
   - 等格网格：所有图片使用相同大小的格子，可调整格子比例。
   - 模板：按当前图片数量显示对应模板。
4. 设置画布比例、宽度、高度、间距、边距、圆角和背景色。默认画布为竖版 1080 x 1920。
   这些设置会自动保存，刷新浏览器页面后会恢复。
5. 在右侧预览中调整图片：
   - 空白处滚轮缩放整个预览。
   - 悬浮在图片上滚轮缩放该图片裁剪。
   - 拖动图片调整裁剪位置。
   - 长按后拖动可交换图片位置。
   - 悬浮在图片上点击右上角 `×` 删除图片。
6. 点击“生成拼图”，Collager 会直接下载 PNG 文件。
