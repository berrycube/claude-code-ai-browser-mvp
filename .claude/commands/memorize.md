---
name: /memorize
description: 将当前研究结论/摘要入库到 Qdrant（语义记忆）。
---
以 memory 子代理身份：从 scratch/summary.json 与 reports/*-draft.md 提炼信息段，调用 qdrant-store 入库（metadata 包含 topic/ids/time/lang/score）。
