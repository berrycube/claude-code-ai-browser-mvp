---
name: /report
description: 生成最终决策支持报告（Markdown）。
---
调用 subagent:writer 使用 templates/report.md.hbs 渲染，输出 reports/<date>-<slug>.md。
