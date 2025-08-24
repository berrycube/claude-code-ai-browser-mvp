# AI Browser Researcher 开发指南

## 当前实现状态

### ✅ 已完成
- CLI命令系统（src/cli.ts）
- 工作流引擎（src/workflow/engine.ts）
- 3个核心代理：Planner、Searcher、Writer
- Node Hooks策略控制
- TypeScript monorepo架构

### 🔄 开发中  
- 7个额外代理实现
- Qdrant向量存储集成
- 静态仪表盘生成逻辑
- 真实搜索API替换模拟数据

## 技术债务跟踪

### 高优先级 (P0)
- [ ] 实现Browser和Extractor代理（网页内容抓取）
- [ ] 完成Analyst和Critic代理（内容分析和审计）
- [ ] 集成真实搜索API（SerpApi/Brave Search）

### 中优先级 (P1)
- [ ] 实现/memorize和/remember命令的后端逻辑
- [ ] 添加Qdrant向量数据库集成
- [ ] 完善错误处理和重试机制

### 低优先级 (P2)
- [ ] 实现Facilitator和Dashboarder代理
- [ ] 静态仪表盘生成器完善
- [ ] 性能优化和并发控制

## 开发规范

### 代码组织
- 所有命令在项目根目录执行
- 使用pnpm workspace管理多包
- TypeScript严格模式，完整类型定义
- Git特性分支工作流

### 代理开发模式
```typescript
// 新代理实现模板
export class NewAgent extends Agent {
  name = 'NewAgent';
  description = '代理功能描述';
  
  async execute(input: any): Promise<any> {
    // 实现代理逻辑
    this.log('代理执行中...');
    await this.saveProgress(result);
    return result;
  }
}
```

### 工作流扩展
在 `src/workflow/engine.ts` 中添加新的工作流步骤：
```typescript
// 4. 新步骤
const newResult = await this.agents.get('newagent')!.execute({
  previousResult,
  options
});
```

### MCP工具集成
新MCP工具需要在 `.mcp.json` 中声明，并在代理中通过 `callMCP()` 调用。

## 合规要求
- 遵守robots.txt和站点ToS
- 不绕过付费墙/风控系统
- 所有数据附带来源和时间戳
- 敏感信息不写入日志

## 测试和验证
```bash
# 构建检查
pnpm build && pnpm type-check

# 功能测试
pnpm research "测试主题" --depth=1

# 查看生成结果
ls workspace/reports/
```