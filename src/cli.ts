#!/usr/bin/env node

import { program } from 'commander';
import { HonestResearchWorkflow } from './workflow/honest-engine.js';
import { ResearchWorkflow } from './workflow/engine.js';

program
  .name('ai-research')
  .description('AI Browser Researcher CLI')
  .version('2.1.0');

program
  .command('research')
  .description('启动端到端研究工作流（诚实MVP版本）')
  .argument('<topic>', '研究主题')
  .option('--langs <langs>', '语言筛选', 'zh,en')
  .option('--depth <depth>', '搜索深度', '2')
  .option('--since <date>', '时间过滤', '2024-01-01')
  .option('--debug', '显示详细调试信息')
  .action(async (topic: string, options) => {
    console.log(`🔍 开始研究（诚实MVP）: ${topic}`);
    if (options.debug) {
      console.log(`📋 参数: ${JSON.stringify(options)}`);
      console.log(`💡 使用诚实工作流：3步真实流程，无模拟代理`);
    }
    
    const workflow = new HonestResearchWorkflow();
    
    try {
      const result = await workflow.execute(topic, {
        langs: options.langs.split(','),
        depth: parseInt(options.depth),
        since: options.since
      });
      
      console.log(`✅ 研究完成: ${result.reportPath}`);
      console.log(`📊 统计: ${result.sourcesCount}个来源，耗时${result.duration}ms`);
    } catch (error) {
      console.error(`❌ 研究失败:`, error);
      process.exit(1);
    }
  });

program
  .command('research:legacy')
  .description('启动端到端研究工作流（遗留5步版本，含模拟代理）')
  .argument('<topic>', '研究主题')
  .option('--langs <langs>', '语言筛选', 'zh,en')
  .option('--depth <depth>', '搜索深度', '2')  
  .option('--since <date>', '时间过滤', '2024-01-01')
  .action(async (topic: string, options) => {
    console.log(`🔍 开始研究（遗留版本）: ${topic}`);
    console.log(`⚠️ 警告：此版本包含模拟代理，仅用于对比测试`);
    console.log(`📋 参数: ${JSON.stringify(options)}`);
    
    const workflow = new ResearchWorkflow();
    
    try {
      const result = await workflow.execute(topic, {
        langs: options.langs.split(','),
        depth: parseInt(options.depth),
        since: options.since
      });
      
      console.log(`✅ 研究完成: ${result.reportPath}`);
    } catch (error) {
      console.error(`❌ 研究失败:`, error);
      process.exit(1);
    }
  });

program
  .command('dashboard')
  .description('生成静态仪表盘')
  .option('--out <path>', '输出路径', 'workspace/reports/dashboard.html')
  .action(async (options) => {
    console.log(`📊 生成仪表盘: ${options.out}`);
    // TODO: 实现仪表盘生成逻辑
  });

// 记忆功能暂时移除 - 避免模拟实现
// TODO: 当Qdrant MCP集成完成后重新添加
// program.command('memorize') - 已删除模拟实现
// program.command('remember') - 已删除模拟实现

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export { program };