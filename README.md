# AI Browser Researcher — 集成增强版（Integrated Edition）

> 将 **第一版(MVP)** 与 **第二版(TypeScript/Monorepo/Node Hooks/状态机/Live Dashboard/SQLite 可选)**
> **有机合并**：去重并保留两者优点；新增 **Qdrant 向量检索 MCP** 的最小配置与**记忆工作流**（/memorize、/remember）。

## 重要特性
- **端到端研究工作流**：计划→检索→浏览→抽取→分析→审计→报告/仪表盘；关键节点**暂停请示人类**。
- **双仪表盘**：
  - 实时面板（SSE）：`packages/live-dashboard`（观察运行进度/暂停点）；
  - 静态仪表盘（HTML）：`dashboard/generate_dashboard.js`（从 sources 汇总）。
- **子代理 + Slash 命令**：Planner/Searcher/Browser/Extractor/Analyst/Critic/Writer/Facilitator/Dashboarder/Memory。
- **记忆能力（Qdrant MCP）**：把研究结论/要点入库（/memorize），随时语义检索召回（/remember）。
- **合规可控**：Node Hooks + 策略文件统一管理“允许/询问/暂停/拒绝”；默认**保守**。

## 快速开始
```bash
# 1) 启用 pnpm & 安装依赖
corepack enable || true
corepack prepare pnpm@9.7.0 --activate || true
pnpm install
pnpm build

# 验证构建成功
pnpm lint

# 2) 接入必要 MCP（项目作用域）
# 浏览器（Playwright）
claude mcp add playwright npx @playwright/mcp@latest -- --browser chrome --caps pdf
# 文件系统
claude mcp add filesystem npx -y @modelcontextprotocol/server-filesystem -- "$PWD"
# 自研研究工具（本仓 dist）
claude mcp add research-tools node packages/mcp-research-tools/dist/index.js
# 可选：SerpApi 搜索
# export SERPAPI_API_KEY=xxx
# claude mcp add serpapi --env SERPAPI_API_KEY=$SERPAPI_API_KEY -- npx -y @ilyazub/serpapi-mcp-server
# 可选：Brave Search（官方 MCP）
# claude mcp add brave-search npx -y @modelcontextprotocol/server-brave-search --env BRAVE_API_KEY=$BRAVE_API_KEY
# 可选：Qdrant 记忆（向量检索）— 本地或云端
# 本地（uvx 运行，使用本机 Qdrant DB 路径）
# claude mcp add qdrant #   -e QDRANT_LOCAL_PATH="$PWD/workspace/qdrant" #   -e COLLECTION_NAME="research-memory" #   -e EMBEDDING_MODEL="sentence-transformers/all-MiniLM-L6-v2" #   -- uvx mcp-server-qdrant
# 远端（QDRANT_URL + API KEY）
# claude mcp add qdrant #   -e QDRANT_URL="https://<your-qdrant-host>:6333" #   -e QDRANT_API_KEY="<key>" #   -e COLLECTION_NAME="research-memory" #   -e EMBEDDING_MODEL="sentence-transformers/all-MiniLM-L6-v2" #   -- uvx mcp-server-qdrant

# 3) （可选）启动 Live Dashboard
pnpm --filter live-dashboard start  # http://localhost:7788

# 4) 与 Claude 交互（在仓库根目录）：
/research "你的主题" --langs=zh,en --depth=2 --since=2024-01-01
/report --out=workspace/reports/$(date +%F)-主题.md
/dashboard --out=workspace/reports/$(date +%F)-主题-dashboard.html
/memorize "将当前研究结论入库（Qdrant）"
/remember "查询：过去 90 天关于 {子主题} 的要点"
```

> Qdrant MCP 依赖 `uvx` 运行器（Astral 工具链）或 Docker；若尚未安装，可参考官方说明。你也可使用托管 Qdrant 服务。

## 目录结构（关键）
```
.
├─ package.json / pnpm-workspace.yaml / tsconfig.base.json
├─ .mcp.json                      # 统一 MCP 声明（含 qdrant / brave-search 可选）
├─ .claude/
│  ├─ settings.json               # Node Hooks（Pre/Post/Stop）+ permission ask
│  ├─ agents/*                    # 包含 memory 子代理
│  └─ commands/*                  # 包含 /memorize /remember
├─ packages/
│  ├─ mcp-research-tools/         # TypeScript MCP：抽取/规约/质量分/渲染/DB/状态机/日志
│  ├─ hooks/                      # Node Hooks：策略评估 + 决策
│  ├─ live-dashboard/             # SSE 实时面板
│  └─ types/                      # 共享类型
├─ templates/                     # report.md.hbs / dashboard.html.hbs
├─ dashboard/generate_dashboard.js# 静态仪表盘生成器（兼容一版）
├─ workspace/                     # sources/*.jsonl / reports/*.md / snapshots/* / runs/*
├─ config/                        # policy.json / retention.json / sites.json / policies.md
└─ scripts/                       # install_integrated.sh / check.sh
```

## 合规与边界
- 尊重站点 ToS/robots.txt，不绕过付费墙/风控/验证码。遇到此类阻断，系统会**暂停**并请求你处理。
- 报告必须附**来源/时间戳/快照**，可复核；敏感信息不写入日志/报告。
