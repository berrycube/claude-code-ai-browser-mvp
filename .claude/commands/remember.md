---
name: /remember
description: 从 Qdrant 记忆中召回与主题相关的要点。
---
以 memory 子代理身份：调用 qdrant-find 检索，将结果写入 scratch/memory_hits.json，并在后续分析/报告中引用。
