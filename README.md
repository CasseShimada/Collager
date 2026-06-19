# Collager

Collager 是一款本地图片拼图软件。你可以把多张图片快速排成一张 PNG 拼图，并在生成前调整排版、裁剪、间距、圆角和背景色。

Collager 是免费开源软件，仅在 GitHub 免费发布。任何公开售卖 Collager 的行为均为骗局。遇到问题或有建议，可以通过 GitHub Issue 反馈。

## 安装与启动

推荐使用安装版：

1. 打开 [GitHub Releases](https://github.com/CasseShimada/Collager/releases)。
2. 下载最新版 `Collager-Setup.exe`。
3. 双击安装文件。
4. 安装完成后，从桌面快捷方式或开始菜单打开 Collager。

如果你下载的是免安装压缩包，请解压后双击 `Collager.exe`。

启动后，Collager 会自动打开浏览器操作页面。软件会在后台静默运行，不显示命令行窗口。你可以在 Windows 右下角托盘图标中重新打开页面或退出软件。

## 基本使用

1. 拖入图片，或点击左侧区域选择图片。
2. 需要更多图片时，可以继续添加；重复图片会自动跳过。
3. 在左侧选择排版方式。
4. 根据需要调整画布大小、间距、边距、圆角和背景色。
5. 在右侧预览中检查并调整图片位置。
6. 点击“生成拼图”，PNG 文件会直接下载到浏览器的下载位置。

Collager 会自动保存上次使用的画布和排版设置。刷新浏览器页面后，这些设置会恢复；已选择的图片不会恢复，需要重新选择。

## 排版方式

Collager 提供三类排版：

- 自动网格：根据图片原始比例自动安排每张图片的大小。
- 等格网格：所有图片使用相同大小的格子，并可调整格子比例。
- 模板：根据当前图片数量显示可用模板，包括软件自带模板和自定义模板。

没有合适模板时，可以直接使用自动网格或等格网格。

## 预览操作

右侧预览区支持这些操作：

- 鼠标滚轮：缩放整个预览画布。
- 按住预览空白处拖动：移动画布。
- 拖动图片：调整图片裁剪位置。
- 长按图片后拖动到另一张图片上：交换两张图片的位置。
- 悬浮在图片上点击右上角 `x`：删除该图片。
- 悬浮在图片上滚轮：缩放该图片的裁剪范围。

## 更新软件

Collager 会在页面中提示可用的新版本，但不会强制更新。只有点击页面中的“立即更新”后，软件才会下载并安装更新。

你也可以手动更新：

1. 打开 [GitHub Releases](https://github.com/CasseShimada/Collager/releases)。
2. 下载最新版 `Collager-Setup.exe`。
3. 双击安装文件，覆盖安装已有版本。

## 自定义模板

Collager 支持添加自定义模板。模板文件放在：

```text
%LOCALAPPDATA%\Collager\templates
```

第一次启动新版 Collager 后，这个目录会自动生成一个示例模板。你可以复制示例文件，改成自己的模板。新增或修改模板后，刷新浏览器页面即可看到新模板。

模板文件使用 JSON 格式。示例：

```json
{
  "id": "my-four-panel",
  "name": "我的四格",
  "imageCount": 4,
  "columns": 6,
  "rows": 6,
  "icon": "icon.svg",
  "cells": [
    { "column": 0, "row": 0, "columnSpan": 4, "rowSpan": 4 },
    { "column": 4, "row": 0, "columnSpan": 2, "rowSpan": 2 },
    { "column": 4, "row": 2, "columnSpan": 2, "rowSpan": 2 },
    { "column": 0, "row": 4, "columnSpan": 6, "rowSpan": 2 }
  ]
}
```

字段说明：

- `id`：模板编号，不要和其他模板重复。
- `name`：模板在软件中显示的名称。
- `imageCount`：这个模板适用的图片数量。
- `columns`、`rows`：模板使用的网格大小。
- `icon`：模板图标，可省略；支持 PNG、JPG、WEBP、GIF、SVG。
- `cells`：每张图片在网格中的位置和大小。

`cells` 的数量必须和 `imageCount` 一致。只有选择对应数量的图片时，该模板才会显示。

## 配置文件

Collager 的配置文件位于：

```text
%LOCALAPPDATA%\Collager\config.json
```

如果需要修改启动端口，可以编辑这个文件中的 `port` 值。修改后需要重启 Collager 才会生效。
