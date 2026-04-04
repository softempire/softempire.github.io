---
title: "Cmder路径斜杠"
date: 2026-04-04T10:18:42+08:00
draft: false
---

![alt text](/images/ad8cfd487e8e.png)

:: 自动把路径里的 \ 转成 /
doskey cd=cd $* & set "_p=$*" & set "_p=%_p:\=/%" & cd "%_p%"
doskey git=git $*
doskey gadd=git add $* & set "_p=$*" & set "_p=%_p:\=/%" & git add "%_p%"
