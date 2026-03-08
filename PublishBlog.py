"""
PublishBlog.py - 一键发布博客文章

用法:
    python PublishBlog.py --all           自动检测并发布所有未发布的文章
    python PublishBlog.py AI              发布指定文章
    python PublishBlog.py AI Antigravity  发布多篇文章

功能:
    1. 读取 content/post/<name>.md 中的 front matter 和正文
    2. 在 blog/<name>/ 下生成 index.html 博客页面
    3. 自动更新根目录 index.html 的文章列表
    4. 执行 git add / commit / push 完成发布
"""

import os
import re
import sys
import shutil
import uuid
import subprocess
from datetime import datetime

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
os.chdir(SCRIPT_DIR)

# ============================================================
# 博客页面 HTML 模板
# ============================================================
BLOG_PAGE_TEMPLATE = r'''<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="utf-8" />
  <meta name="generator" content="Hugo 0.59.1" />

  <meta http-equiv="X-UA-Compatible" content="IE=edge" />
  <meta name="viewport" content="width=device-width, initial-scale=1" />
  <meta name="author" content="DingZQ" />
  <meta property="og:url" content="https://www.dingzhiqiang.com/blog/{slug}/" />
  <link rel="canonical" href="https://www.dingzhiqiang.com/blog/{slug}/" /><script type="application/ld+json">
  {{
      "@context" : "http://schema.org",
      "@type" : "BlogPosting",
      "mainEntityOfPage": {{
           "@type": "WebPage",
           "@id": "https:\/\/www.dingzhiqiang.com\/"
      }},
      "articleSection" : "post",
      "name" : "{title}",
      "headline" : "{title}",
      "description" : "{description}",
      "inLanguage" : "en-US",
      "author" : "DingZQ",
      "creator" : "DingZQ",
      "publisher": "DingZQ",
      "accountablePerson" : "DingZQ",
      "copyrightHolder" : "DingZQ",
      "copyrightYear" : "{year}",
      "datePublished": "{date_full}",
      "dateModified" : "{date_full}",
      "url" : "https:\/\/www.dingzhiqiang.com\/blog\/{slug}\/",
      "keywords" : [  ]
  }}
</script>
<title>{title} - Zhiqiang&#39;s Blog</title>
  <meta property="og:title" content="{title} - Zhiqiang&#39;s Blog" />
  <meta property="og:type" content="article" />
  <meta name="description" content="{description}" />

  <link rel="stylesheet" href="/css/flexboxgrid-6.3.1.min.css" />
  <link rel="stylesheet"
    href="/css/github-markdown.min.css" />
  <link rel="stylesheet" href="/css/highlight/tomorrow.min.css" />
  <link rel="stylesheet" href="/css/index.css">
  <link href="/index.xml" rel="alternate" type="application/rss+xml" title="Zhiqiang&#39;s Blog">
  
  <link href="https://fonts.googleapis.com/css?family=Arvo|Permanent+Marker" rel="stylesheet">
  

  
</head>


<body>
  <article class="post " id="article">
    <div class="row">
      <div class="col-xs-12 col-sm-10 col-md-8 col-sm-offset-1 col-md-offset-2 col-lg-6 col-lg-offset-3">
        <div class="site-header">
          
<header>
  <div class="signatures site-title">
    <a href="/">无敌的丁苏</a>
  </div>
</header>
<div class="row end-xs">
  
  
</div>
<div class="header-line"></div>

        </div>
        <header class="post-header">
          <h1 class="post-title">{title}</h1>
          
          <div class="row post-desc">
            <div class="col-xs-6">
              
              <time class="post-date" datetime="{date_full}">
                {date_display}
              </time>
              
            </div>
            <div class="col-xs-6">
              
              <div class="post-author">
                <a target="_blank" href="https://www.dingzhiqiang.com/">@DingZQ</a>
              </div>
              
            </div>
          </div>
          
        </header>

        <div class="post-content markdown-body">
          {content_html}
        </div>
        

        

        
        
        <div style="height: 50px;"></div>
        
        

        <div class="site-footer">
  
  
</div>

      </div>
    </div>
  </article>

  <script src="/js/highlight.pack.js"></script>


<script>
  hljs.initHighlightingOnLoad();
  
  
  
    
    
  
</script>

<div class="lightbox-overlay" id="lightbox-overlay" onclick="this.classList.remove('active')">
  <img id="lightbox-img" src="" alt="" />
</div>
<script>
  document.querySelectorAll('.post-content img').forEach(function(img) {{
    img.addEventListener('click', function() {{
      var overlay = document.getElementById('lightbox-overlay');
      document.getElementById('lightbox-img').src = this.src;
      overlay.classList.add('active');
    }});
  }});
</script>

</body>

</html>
'''

# ============================================================
# index.html 中的文章条目模板
# ============================================================
POST_ENTRY_TEMPLATE = '''
            <div class="row post-line">
              <div class="posts-date col-xs-2">
                <time datetime="{date_full}">{date_short}</time>
              </div>
              <div class="posts-title col-xs-10">
                <a href="/blog/{slug}/">{title}</a>
              </div>
            </div>
'''

# ============================================================
# 解析 Markdown 文件
# ============================================================
def parse_markdown(filepath):
    """解析 markdown 文件，返回 front matter 字典和正文内容"""
    with open(filepath, 'r', encoding='utf-8') as f:
        content = f.read()

    fm_match = re.match(r'^---\s*\n(.*?)\n---\s*\n(.*)', content, re.DOTALL)
    if not fm_match:
        print(f"  错误: 无法解析 {filepath} 的 front matter")
        return None, None

    fm_text = fm_match.group(1)
    body = fm_match.group(2).strip()

    meta = {}
    for line in fm_text.strip().split('\n'):
        if ':' in line:
            key, val = line.split(':', 1)
            meta[key.strip()] = val.strip().strip('"').strip("'")

    return meta, body


def markdown_to_html(md_text):
    """简易 Markdown 转 HTML"""
    lines = md_text.split('\n')
    html_parts = []
    in_code_block = False
    code_lang = ''
    code_lines = []

    for line in lines:
        if line.startswith('```'):
            if not in_code_block:
                in_code_block = True
                code_lang = line[3:].strip()
                code_lines = []
            else:
                in_code_block = False
                code_content = '\n'.join(code_lines)
                if code_lang:
                    html_parts.append(f'<pre><code class="{code_lang}">{code_content}</code></pre>')
                else:
                    html_parts.append(f'<pre><code>{code_content}</code></pre>')
            continue

        if in_code_block:
            code_lines.append(line)
            continue

        if line.startswith('######'):
            html_parts.append(f'<h6>{line[6:].strip()}</h6>')
        elif line.startswith('#####'):
            html_parts.append(f'<h5>{line[5:].strip()}</h5>')
        elif line.startswith('####'):
            html_parts.append(f'<h4>{line[4:].strip()}</h4>')
        elif line.startswith('###'):
            html_parts.append(f'<h3>{line[3:].strip()}</h3>')
        elif line.startswith('##'):
            html_parts.append(f'<h2>{line[2:].strip()}</h2>')
        elif line.startswith('#'):
            html_parts.append(f'<h1>{line[1:].strip()}</h1>')
        elif line.strip() == '':
            continue
        elif line.startswith('- '):
            html_parts.append(f'<li>{line[2:].strip()}</li>')
        elif line.startswith('!['):
            img_match = re.match(r'!\[(.*?)\]\((.*?)\)', line)
            if img_match:
                alt, src = img_match.group(1), img_match.group(2)
                html_parts.append(f'<img src="{src}" alt="{alt}" />')
            else:
                html_parts.append(f'<p>{line}</p>')
        else:
            line = re.sub(r'\[(.*?)\]\((.*?)\)', r'<a href="\2">\1</a>', line)
            line = re.sub(r'`([^`]+)`', r'<code>\1</code>', line)
            line = re.sub(r'\*\*(.*?)\*\*', r'<strong>\1</strong>', line)
            line = re.sub(r'\*(.*?)\*', r'<em>\1</em>', line)
            html_parts.append(f'<p>{line}</p>')

    return '\n          '.join(html_parts)


def parse_date(date_str):
    """解析日期字符串，返回 datetime 对象"""
    date_str = re.sub(r'([+-]\d{2}):(\d{2})$', r'\1\2', date_str)
    try:
        return datetime.strptime(date_str, '%Y-%m-%dT%H:%M:%S%z')
    except ValueError:
        try:
            return datetime.strptime(date_str[:19], '%Y-%m-%dT%H:%M:%S')
        except ValueError:
            return datetime.now()


def update_index_html(slug, title, dt):
    """更新 index.html，将新文章添加到对应年份的 section 中"""
    index_path = os.path.join(SCRIPT_DIR, 'index.html')
    with open(index_path, 'r', encoding='utf-8') as f:
        html = f.read()

    year = str(dt.year)
    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    date_short = f"{months[dt.month - 1]} {dt.day:02d}"
    date_full = dt.strftime('%Y-%m-%d %H:%M:%S') + ' CST'

    if f'href="/blog/{slug}/"' in html:
        print(f"  文章 {slug} 已在 index.html 中，跳过更新列表")
        return

    new_entry = POST_ENTRY_TEMPLATE.format(
        date_full=date_full,
        date_short=date_short,
        slug=slug,
        title=title
    )

    year_pattern = f'<h1 class="site-date-catalog">{year}</h1>'
    if year_pattern in html:
        insert_pos = html.index(year_pattern) + len(year_pattern)
        while insert_pos < len(html) and html[insert_pos] in '\r\n \t':
            insert_pos += 1
        html = html[:insert_pos] + new_entry + html[insert_pos:]
    else:
        new_section = f'''          <section>
            <h1 class="site-date-catalog">{year}</h1>
{new_entry}
          </section>
'''
        marker = '<div id="posts-list">\r\n'
        if marker not in html:
            marker = '<div id="posts-list">\n'
        if marker in html:
            insert_pos = html.index(marker) + len(marker)
            html = html[:insert_pos] + new_section + html[insert_pos:]
        else:
            print("  警告: 未找到 posts-list 标记，无法更新 index.html")
            return

    with open(index_path, 'w', encoding='utf-8') as f:
        f.write(html)
    print(f"  已更新 index.html 列表")


def create_blog_page(slug, title, dt, content_html, description):
    """创建博客文章 HTML 页面"""
    blog_dir = os.path.join(SCRIPT_DIR, 'blog', slug)
    os.makedirs(blog_dir, exist_ok=True)

    months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun',
              'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
    date_display = f"{dt.day:02d} {months[dt.month - 1]} {dt.year}"
    date_full = dt.strftime('%Y-%m-%d %H:%M:%S') + ' +0800 CST'

    page_html = BLOG_PAGE_TEMPLATE.format(
        slug=slug,
        title=title,
        description=description,
        year=dt.year,
        date_full=date_full,
        date_display=date_display,
        content_html=content_html
    )

    output_path = os.path.join(blog_dir, 'index.html')
    with open(output_path, 'w', encoding='utf-8') as f:
        f.write(page_html)
    print(f"  已生成 blog/{slug}/index.html")


def git_publish(post_names):
    """执行 git add, commit, push"""
    print("\n正在提交到 GitHub...")
    subprocess.run(['git', 'add', '.'], cwd=SCRIPT_DIR)
    msg = f'Publish post: {", ".join(post_names)}'
    subprocess.run(['git', 'commit', '-m', msg], cwd=SCRIPT_DIR)
    result = subprocess.run(['git', 'push'], cwd=SCRIPT_DIR, capture_output=True, text=True)
    if result.returncode == 0:
        print("  已推送到 GitHub！稍等片刻，博客即可对外可见。")
    else:
        print(f"  Git push 输出: {result.stdout}{result.stderr}")
        print("  请检查网络连接或 SSH 密钥配置。")


def find_unpublished_posts():
    """扫描 content/post/ 目录，找出尚未在 blog/ 目录中生成页面的文章"""
    post_dir = os.path.join(SCRIPT_DIR, 'content', 'post')
    if not os.path.isdir(post_dir):
        print("错误: content/post/ 目录不存在")
        return []

    unpublished = []
    for filename in os.listdir(post_dir):
        if not filename.endswith('.md'):
            continue
        post_name = filename[:-3]  # 去掉 .md 后缀
        slug = post_name.lower()
        blog_page = os.path.join(SCRIPT_DIR, 'blog', slug, 'index.html')
        if not os.path.exists(blog_page):
            unpublished.append(post_name)
        else:
            # 检查 md 文件是否比 html 文件更新
            md_path = os.path.join(post_dir, filename)
            if os.path.getmtime(md_path) > os.path.getmtime(blog_page):
                unpublished.append(post_name)

    return unpublished


def process_images(post_name, md_path):
    """处理文章中的图片：将 content/post/ 下的本地图片重命名并复制到 images/ 目录，更新 md 引用"""
    post_dir = os.path.dirname(md_path)
    images_dir = os.path.join(SCRIPT_DIR, 'images')
    os.makedirs(images_dir, exist_ok=True)

    with open(md_path, 'r', encoding='utf-8') as f:
        content = f.read()

    IMAGE_EXTS = ('.png', '.jpg', '.jpeg', '.gif', '.bmp', '.webp', '.svg')
    modified = False

    # 匹配 markdown 图片语法 ![alt](path)
    def replace_image(match):
        nonlocal modified
        alt = match.group(1)
        img_path = match.group(2)

        # 跳过已经是 /images/ 开头的或者 http 开头的远程图片
        if img_path.startswith('/images/') or img_path.startswith('http'):
            return match.group(0)

        # 获取图片文件的完整路径
        full_img_path = os.path.join(post_dir, img_path)
        if not os.path.exists(full_img_path):
            print(f"  警告: 图片文件不存在 {full_img_path}，跳过")
            return match.group(0)

        # 生成随机文件名，保留原始扩展名
        ext = os.path.splitext(img_path)[1].lower()
        if ext not in IMAGE_EXTS:
            return match.group(0)

        random_name = uuid.uuid4().hex[:12] + ext
        dest_path = os.path.join(images_dir, random_name)

        # 复制图片到 images/ 目录
        shutil.copy2(full_img_path, dest_path)
        print(f"  图片: {img_path} -> /images/{random_name}")

        # 删除原始图片文件
        os.remove(full_img_path)

        modified = True
        return f'![{alt}](/images/{random_name})'

    new_content = re.sub(r'!\[(.*?)\]\((.*?)\)', replace_image, content)

    if modified:
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(new_content)
        print(f"  已更新 {post_name}.md 中的图片引用")


def publish_post(post_name):
    """发布单篇文章"""
    md_path = os.path.join(SCRIPT_DIR, 'content', 'post', f'{post_name}.md')
    if not os.path.exists(md_path):
        print(f"  错误: 找不到文件 {md_path}")
        return False

    print(f"\n========== 发布文章: {post_name} ==========")

    # 1. 处理图片：重命名并复制到 images/ 目录
    process_images(post_name, md_path)

    # 2. 解析 Markdown
    meta, body = parse_markdown(md_path)
    if meta is None:
        return False

    title = meta.get('title', post_name)
    date_str = meta.get('date', '')
    draft = meta.get('draft', 'false').lower()

    if draft == 'true':
        print(f"  注意: {post_name} 标记为草稿，自动改为 draft: false")
        with open(md_path, 'r', encoding='utf-8') as f:
            md_content = f.read()
        md_content = md_content.replace('draft: true', 'draft: false')
        with open(md_path, 'w', encoding='utf-8') as f:
            f.write(md_content)

    dt = parse_date(date_str) if date_str else datetime.now()
    slug = post_name.lower()

    # 3. 转换 Markdown 为 HTML
    content_html = markdown_to_html(body)

    # 取正文第一行作为 description
    first_line = body.split('\n')[0].strip() if body else title
    description = first_line[:200]

    # 4. 生成博客页面
    create_blog_page(slug, title, dt, content_html, description)

    # 5. 更新 index.html 列表
    update_index_html(slug, title, dt)

    return True


def main():
    # --all 模式: 自动检测未发布的文章
    if len(sys.argv) == 2 and sys.argv[1] == '--all':
        post_names = find_unpublished_posts()
        if not post_names:
            print("没有检测到需要发布的新文章。")
            print("(所有 content/post/*.md 都已经有对应的 blog 页面且未被修改)")
            return
        print(f"检测到 {len(post_names)} 篇需要发布的文章: {', '.join(post_names)}")
    elif len(sys.argv) >= 2:
        post_names = sys.argv[1:]
    else:
        # 默认也是 --all 模式
        post_names = find_unpublished_posts()
        if not post_names:
            print("没有检测到需要发布的新文章。")
            print("(所有 content/post/*.md 都已经有对应的 blog 页面且未被修改)")
            return
        print(f"检测到 {len(post_names)} 篇需要发布的文章: {', '.join(post_names)}")

    published = []
    for name in post_names:
        if publish_post(name):
            published.append(name)

    if published:
        git_publish(published)
        print(f"\n✅ 成功发布 {len(published)} 篇文章！")
    else:
        print("\n没有文章被成功发布。")


if __name__ == '__main__':
    main()
