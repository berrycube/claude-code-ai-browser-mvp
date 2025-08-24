# 迁移指南

## 渐进式重构后的变更说明

### 🔄 Hooks模块变更

#### 新的统一模块
新增了 `packages/hooks/src/index.ts` 作为所有hooks功能的统一入口。

#### 向后兼容性
现有的单独文件仍然保留，作为wrapper：
- `pretool-guard.ts` → 调用 `executePreToolGuard()`
- `posttool-detect.ts` → 调用 `executePostToolDetect()`
- `stop-checkpoint.ts` → 调用 `executeStopCheckpoint()`
- `policy.ts` → 重新导出 `loadPolicy()`

#### 推荐用法
```typescript
// 新的推荐方式
import { executePreToolGuard, loadPolicy } from "packages/hooks/src/index.js";

// 旧方式仍然工作（向后兼容）
import { loadPolicy } from "packages/hooks/src/policy.js";
```

### 🎯 类型定义统一

#### SourceRecord 类型更新
`packages/types/src/index.ts` 中的 `SourceRecord` 现在所有字段都是可选的，与实际使用保持一致。

#### 使用统一类型
```typescript
// 推荐
import type { SourceRecord } from "packages/types/src/index.js";

// 不再推荐：在db.ts中重复定义
```

### 🗑️ 已删除的内容

#### 移除的文件
- `packages/mcp-research-tools/src/state/research.machine.ts` (未使用的xstate状态机)
- `config/retention.json` (未被引用)
- `config/sites.json` (未被引用)

#### 移除的依赖
- `xstate` (从mcp-research-tools)
- `vitest` (从根目录，未使用)

### 📋 废弃计划

#### 计划在 v3.0.0 中移除
- `packages/hooks/src/pretool-guard.ts` wrapper
- `packages/hooks/src/posttool-detect.ts` wrapper
- `packages/hooks/src/stop-checkpoint.ts` wrapper

建议在此之前迁移到统一的 `packages/hooks/src/index.ts` 模块。

### 🔍 验证迁移

#### 构建验证
```bash
pnpm build
pnpm type-check
```

#### 功能验证
```bash
# 测试Live Dashboard
node packages/live-dashboard/dist/server.js

# 测试hooks
echo '{"url":"https://example.com"}' | node packages/hooks/dist/pretool-guard.js
```

### ❓ 常见问题

#### Q: wrapper文件什么时候会被移除？
A: 计划在v3.0.0版本移除，会提前6个月通知。

#### Q: 类型定义变更会影响现有代码吗？
A: 不会，所有字段改为可选使类型更加灵活，现有代码继续工作。

#### Q: 为什么hooks中使用console.log而不是logger？
A: 这些是MCP协议的标准输出，必须使用console.log，不能替换为结构化日志。

### 📞 获取帮助

如果迁移过程中遇到问题，请：
1. 检查构建和类型错误
2. 参考此文档的示例代码
3. 查看 `REFACTOR_PLAN.md` 了解更多背景