"""Batch revert col-lg-8 col-lg-offset-2 back to col-lg-6 col-lg-offset-3 in all blog pages."""
import os

BLOG_DIR = r"m:\softempire.github.io\blog"
count = 0
for root, dirs, files in os.walk(BLOG_DIR):
    for f in files:
        if f != "index.html":
            continue
        path = os.path.join(root, f)
        with open(path, "r", encoding="utf-8") as fh:
            html = fh.read()
        if "col-lg-8 col-lg-offset-2" in html:
            html = html.replace("col-lg-8 col-lg-offset-2", "col-lg-6 col-lg-offset-3")
            with open(path, "w", encoding="utf-8") as fh:
                fh.write(html)
            count += 1
print(f"Reverted {count} files.")
