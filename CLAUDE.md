# AI Browser Researcher 项目说明

## 项目概述
集成增强版AI浏览器研究工具，将MVP版与TypeScript/Monorepo/Node Hooks/状态机/Live Dashboard/SQLite功能有机合并。

## 核心特性
- **端到端研究工作流**：计划→检索→浏览→抽取→分析→审计→报告/仪表盘
- **双仪表盘系统**：
  - 实时面板（SSE）：`packages/live-dashboard`
  - 静态仪表盘：`dashboard/generate_dashboard.js`
- **10个子代理**：Planner/Searcher/Browser/Extractor/Analyst/Critic/Writer/Facilitator/Dashboarder/Memory
- **记忆能力**：Qdrant向量数据库支持语义检索
- **合规控制**：Node Hooks + 策略文件统一管理

## 项目架构
```
packages/
├─ mcp-research-tools/     # TypeScript MCP核心工具
├─ hooks/                  # Node Hooks策略控制
├─ live-dashboard/         # SSE实时面板
└─ types/                  # 共享类型定义

workspace/                 # 数据存储
├─ sources/               # 检索数据(.jsonl)
├─ reports/               # 生成报告(.md)
├─ snapshots/             # 页面快照
└─ runs/                  # 运行记录

config/                    # 配置文件
├─ policy.json            # 访问策略
├─ retention.json         # 数据保留
└─ sites.json             # 站点配置
```

## 工作流程
1. `/research "主题" --langs=zh,en --depth=2 --since=2024-01-01`
2. `/report --out=workspace/reports/$(date +%F)-主题.md`
3. `/dashboard --out=workspace/reports/$(date +%F)-主题-dashboard.html`
4. `/memorize "研究结论入库"`
5. `/remember "查询历史研究"`

## 依赖要求
- pnpm 9.7.0+
- Node.js (TypeScript构建)
- Chrome浏览器 (Playwright)
- 可选：Qdrant向量数据库
- 可选：SerpApi或Brave Search API

## 合规边界
- 遵守robots.txt和站点ToS
- 不绕过付费墙/风控/验证码
- 所有报告附带来源/时间戳/快照
- 敏感信息不记录到日志

## 开发模式
- 所有命令在项目根目录执行
- 使用pnpm workspace管理多包
- TypeScript严格模式
- Git工作流管理