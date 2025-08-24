# AI Browser Researcher — 集成增强版（Alpha）

> 基于Claude Code + MCP协议的AI研究工具，支持端到端研究工作流和斜线命令触发。
> 当前处于**Alpha开发阶段**，核心工作流已可用。

## 当前可用功能 ✅

- **CLI命令系统**：完整的命令行工具和斜线命令支持
- **基础工作流**：计划制定 → 搜索执行 → 报告生成（3个核心代理）
- **Node Hooks控制**：策略文件管理访问控制和合规检查
- **Live Dashboard服务**：实时面板基础架构（`packages/live-dashboard`）
- **模板系统**：Handlebars模板渲染报告和仪表盘

## 开发中功能 🔄

- **完整代理系统**：7个额外代理（Browser/Extractor/Analyst/Critic/Facilitator/Dashboarder/Memory）
- **向量记忆能力**：Qdrant集成的语义检索（/memorize、/remember）
- **静态仪表盘生成**：数据可视化和汇总展示
- **真实搜索API集成**：SerpApi/Brave Search替换模拟数据

## 快速开始

### 基础安装
```bash
# 安装依赖
pnpm install

# 构建项目  
pnpm build

# 验证安装
pnpm lint
```

### 配置MCP服务（在Claude Code中）
```bash
# 必需：文件系统访问
claude mcp add filesystem npx -y @modelcontextprotocol/server-filesystem -- "$PWD"

# 必需：研究工具
claude mcp add research-tools node packages/mcp-research-tools/dist/index.js

# 可选：网页浏览
claude mcp add playwright npx @playwright/mcp@latest -- --browser chrome --caps pdf

# 可选：搜索API（需要API密钥）
# claude mcp add brave-search npx -y @modelcontextprotocol/server-brave-search --env BRAVE_API_KEY=$BRAVE_API_KEY
```

### 使用工作流
```bash
# 方式1：直接使用pnpm命令
pnpm research "AI发展趋势" --depth=2

# 方式2：在Claude Code中使用斜线命令
/research "AI发展趋势" --depth=2 --langs=zh,en
/dashboard --out=workspace/reports/dashboard.html

# 查看生成的报告
ls workspace/reports/
```

### 启动实时仪表盘（可选）
```bash
pnpm start:live  # 访问 http://localhost:7788
```

## 项目架构

```
├─ src/                           # 核心工作流实现
│  ├─ cli.ts                      # 命令行入口
│  ├─ workflow/engine.ts          # 工作流引擎  
│  └─ agents/                     # 代理实现
│     ├─ base.ts                  # 代理基类
│     ├─ planner.ts              # 计划制定代理
│     ├─ searcher.ts             # 搜索执行代理
│     └─ writer.ts               # 报告生成代理
├─ packages/                      # TypeScript子包
│  ├─ mcp-research-tools/         # MCP研究工具
│  ├─ hooks/                      # Node Hooks策略控制  
│  ├─ live-dashboard/             # 实时仪表盘
│  └─ types/                      # 类型定义
├─ .claude/                       # Claude Code配置
│  ├─ settings.json               # Hooks配置和权限管理
│  ├─ agents/*.md                 # 代理描述（10个）
│  └─ commands/*.md               # 斜线命令定义
├─ templates/                     # Handlebars模板
├─ workspace/                     # 工作区数据（被ignore）
│  ├─ reports/*.md                # 生成的研究报告
│  ├─ sources/*.jsonl             # 搜索数据
│  └─ snapshots/                  # 页面快照
└─ config/policy.json             # 访问策略配置
```

## 合规与边界
- 尊重站点 ToS/robots.txt，不绕过付费墙/风控/验证码。遇到此类阻断，系统会**暂停**并请求你处理。
- 报告必须附**来源/时间戳/快照**，可复核；敏感信息不写入日志/报告。
