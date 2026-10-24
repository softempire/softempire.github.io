---
title: "SMLib"
date: 2026-10-24T19:27:12+08:00
draft: false
---

SMLib 是 NVIDIA 的 B-rep（边界表示）几何建模内核，2026 年 10 月以 Apache-2.0 开源，对外发布名义是 USD BRep——即"把精确 CAD 几何接进 OpenUSD 生态"的那一层（报道、中文报道、FilamentFeed）。

关键定位：它补的是"内核"这一格，不是渲染或网格处理库。同类位置是 Parasolid、ACIS、OpenCASCADE——负责精确曲面求交、布尔、圆角、拓扑合法性这些脏活。差别在于 SMLib 现在免费且宽松许可，并且原生往 USD 上靠。

能力范围（按官方手册章节）
手册目录显示至少覆盖（Introduction、Topology、Fillets、Polygon Modeling）：

B-rep 拓扑模型：body / shell / face / loop / edge / vertex 的层级与查询
精确几何：解析曲面 + NURBS 一类的自由曲面表示
建模操作：布尔、圆角（Fillets 独立成章，说明这是重点能力）
多边形建模：网格侧的能力，和 B-rep 并存
序列化/交换：走 USD BRep schema

![alt text](/images/5e84454fb4f5.png)
