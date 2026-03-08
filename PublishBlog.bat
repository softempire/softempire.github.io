@echo off
REM 发布所有新写的博客文章
REM 用法: 直接双击运行 或 在命令行运行 PublishBlog.bat
REM 也可以指定文章名: PublishBlog.bat AI Antigravity

if "%1"=="" (
    python "%~dp0PublishBlog.py" --all
) else (
    python "%~dp0PublishBlog.py" %*
)
pause
