# 博客写作指南

这份指南说明了如何在本博客仓库中创建新的博客文章（Post）以及如何在文章中插入图片。

## 一、 如何创建新文章

我们使用仓库中提供的脚本快速创建新文章，并自动用 VS Code 打开准备编辑。

1. **打开命令行**
   在当前仓库根目录（即包含 `CreatePost.bat` 和 `hugo.exe` 的目录）下打开命令行（Command Prompt 或 PowerShell）。

2. **运行自动创建脚本**
   使用 `CreatePost.bat` 脚本加上你想创建的文章的**文件名（英文或拼音推荐，不要带后缀）**：
   ```cmd
   CreatePost.bat my-new-post
   ```

3. **编辑内容**
   脚本会自动执行 `hugo new post/my-new-post.md`，并在 VS Code 中为你打开新生成的 Markdown 文件（位于 `content/post/my-new-post.md`）。
   - 文件开头会有一段（Front Matter，如 `title`, `date` 等），请根据实际需求修改 `title` 为文章的展示标题。
   - 在 `---` 或者 `+++` 标记的配置块下方撰写你的正文。

## 二、 如何处理图片

在 Hugo 博客写作中，图片的管理有一套标准的机制：

1. **存放图片**
   你应当把所有的文章配套图片存放到包含静态资源的 `static` 目录中。为了组织清晰，建议存入 `static/images/` 目录。（编译后，这些图片会在网站根目录下的 `images/` 中可用，也就是目前你在根目录下看到的 `images` 文件夹）。

2. **在文章中引用**
   如果你把图片 `test-image.jpg` 放在了 `static/images/test-image.jpg`，那么在 Markdown 文件中插入该图片时，你应该使用**相对于网站根目录的绝对路径**：
   ```markdown
   ![我的图片描述](/images/test-image.jpg)
   ```
   **注意**：前面的 `/` 非常重要，它确保图片总是从网站根目录下的 `images` 文件夹读取，而不会因为文章 URL 路径的变化而失效。

## 三、 本地预览与发布

### 1. 本地预览（可选）
在根目录运行命令启动本地服务器：
```cmd
hugo server -D
```
然后打开浏览器访问 `http://localhost:1313` 查看效果。`-D` 参数表示连同草稿一起显示。确认无误后，可以使用 `Ctrl+C` 停止服务器。

### 2. 生成静态页面并发布
当你写完 Markdown 文章并准备发布时，请确保文章 front matter 中的 `draft: true` 已经被改为 `draft: false`（或者直接删除该行）。然后执行以下步骤：

**第一步：生成网页**
在当前目录下运行 hugo 生成最新的静态文件：
```cmd
hugo
```
*这将会把 Markdown 转换成 HTML 并更新根目录下的各个页面.*

**第二步：提交到 GitHub**
接下来将所有变动提交并推送到 GitHub 仓库来完成发布：
```cmd
git add .
git commit -m "Add new post"
git push
```

稍等片刻，GitHub Pages 就会自动更新，你的新文章就会在博客上对外可见了！
