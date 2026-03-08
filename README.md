# 博客写作指南

这份指南说明了如何在本博客仓库中创建、编辑和发布博客文章。

## 一、 如何创建新文章

1. **运行创建脚本**
   在仓库根目录下执行：
   ```cmd
   CreatePost.bat my-new-post
   ```
   脚本会执行 `hugo new post/my-new-post.md`，并自动用 VS Code 打开新文件。

2. **编辑内容**
   - 修改 Front Matter 中的 `title` 为文章展示标题。
   - 在 `---` 标记下方撰写正文（Markdown 格式）。

## 二、 如何处理图片

1. **直接放在文章旁边**
   将图片文件放在 `content/post/` 目录下（与 `.md` 文件同级），然后在 Markdown 中引用：
   ```markdown
   ![描述](my-image.png)
   ```
   发布时 `PublishBlog.py` 会自动将图片重命名并复制到 `/images/` 目录，同时更新 `.md` 文件中的引用路径。

2. **已在 `/images/` 目录中的图片**
   直接使用绝对路径引用：
   ```markdown
   ![描述](/images/test-image.jpg)
   ```

## 三、 发布文章

使用 `PublishBlog.bat` 一键完成发布（生成 HTML、更新首页列表、git 提交推送）。

### 自动模式（推荐）

自动检测所有新增或已修改的文章并发布：
```cmd
PublishBlog.bat
```

### 指定文章

发布一篇或多篇指定文章：
```cmd
PublishBlog.bat AI
PublishBlog.bat AI Antigravity
```

发布流程会自动完成：
- 处理图片（重命名、复制到 `/images/`）
- 将 Markdown 转换为 HTML，生成 `blog/<name>/index.html`
- 更新根目录 `index.html` 的文章列表
- 执行 `git add / commit / push` 推送到 GitHub

## 四、 文章页面特性

- **页面宽度**：文章内容区域最大宽度为 750px
- **图片左对齐**：文章中的图片默认左对齐显示
- **图片点击放大**：点击文章中的任意图片，会弹出全屏遮罩层显示原始尺寸的图片，点击遮罩层任意位置关闭
