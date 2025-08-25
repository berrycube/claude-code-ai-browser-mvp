#!/usr/bin/env node

import { program } from 'commander';
import { HonestResearchWorkflow } from './workflow/engine.js';

program
  .name('ai-research')
  .description('AI Browser Researcher CLI')
  .version('2.1.0');

program
  .command('research')
  .description('启动端到端研究工作流')
  .argument('<topic>', '研究主题')
  .option('--langs <langs>', '语言筛选', 'zh,en')
  .option('--depth <depth>', '搜索深度', '2')
  .option('--since <date>', '时间过滤', '2024-01-01')
  .option('--debug', '显示详细调试信息')
  .action(async (topic: string, options) => {
    console.log(`🔍 开始研究: ${topic}`);
    if (options.debug) {
      console.log(`📋 参数: ${JSON.stringify(options)}`);
      console.log(`💡 工作流：Plan → Search/Enrich → Report (3步)`);
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

// 功能已完全集成到主research命令
// Legacy和Dashboard命令已移除以避免代码重复和维护负担
// 未来功能将在验证价值后重新添加

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export { program };