#!/usr/bin/env node

import { program } from 'commander';
import { ResearchWorkflow } from './workflow/engine.js';

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
  .action(async (topic: string, options) => {
    console.log(`🔍 开始研究: ${topic}`);
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

program
  .command('memorize')
  .description('存储研究结论到向量数据库')
  .argument('<content>', '要记忆的内容')
  .action(async (content: string) => {
    console.log(`🧠 存储记忆: ${content.slice(0, 50)}...`);
    // TODO: 实现向量存储逻辑
  });

program
  .command('remember')
  .description('查询历史研究记录')
  .argument('<query>', '查询内容')
  .action(async (query: string) => {
    console.log(`🔍 搜索记忆: ${query}`);
    // TODO: 实现向量检索逻辑
  });

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export { program };