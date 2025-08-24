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
  .option('--tags <tags>', '标签（逗号分隔）', '')
  .option('--category <category>', '分类', 'general')
  .action(async (content: string, options) => {
    console.log(`🧠 存储记忆: ${content.slice(0, 50)}...`);
    
    try {
      const result = await memorizeContent(content, {
        tags: options.tags ? options.tags.split(',').map((t: string) => t.trim()) : [],
        category: options.category
      });
      
      console.log(`✅ 记忆已存储: ID=${result.id}`);
    } catch (error) {
      console.error(`❌ 存储失败: ${error}`);
      process.exit(1);
    }
  });

program
  .command('remember')
  .description('查询历史研究记录')
  .argument('<query>', '查询内容')
  .option('--limit <limit>', '返回结果数量', '5')
  .option('--threshold <threshold>', '相似度阈值', '0.7')
  .action(async (query: string, options) => {
    console.log(`🔍 搜索记忆: ${query}`);
    
    try {
      const results = await rememberContent(query, {
        limit: parseInt(options.limit),
        threshold: parseFloat(options.threshold)
      });
      
      if (results.length === 0) {
        console.log(`📭 没有找到相关记忆`);
        return;
      }
      
      console.log(`🎯 找到 ${results.length} 条相关记忆:`);
      results.forEach((result, index) => {
        console.log(`\n${index + 1}. [相似度: ${result.score.toFixed(3)}]`);
        console.log(`   内容: ${result.content.slice(0, 100)}...`);
        console.log(`   标签: ${result.tags.join(', ')}`);
        console.log(`   时间: ${result.timestamp}`);
      });
      
    } catch (error) {
      console.error(`❌ 查询失败: ${error}`);
      process.exit(1);
    }
  });

// 记忆功能实现
async function memorizeContent(content: string, options: any) {
  try {
    // 尝试使用Qdrant MCP
    return await memorizeWithQdrant(content, options);
  } catch (error) {
    console.warn(`⚠️ Qdrant存储失败，使用本地SQLite: ${error}`);
    return await memorizeWithSQLite(content, options);
  }
}

async function rememberContent(query: string, options: any) {
  try {
    // 尝试使用Qdrant MCP
    return await rememberWithQdrant(query, options);
  } catch (error) {
    console.warn(`⚠️ Qdrant查询失败，使用本地SQLite: ${error}`);
    return await rememberWithSQLite(query, options);
  }
}

async function memorizeWithQdrant(content: string, options: any) {
  // TODO: 实际调用Qdrant MCP
  // const result = await callMCP('qdrant', 'insert', { content, metadata: options });
  throw new Error('Qdrant MCP未配置');
}

async function rememberWithQdrant(query: string, options: any) {
  // TODO: 实际调用Qdrant MCP  
  // const results = await callMCP('qdrant', 'search', { query, ...options });
  throw new Error('Qdrant MCP未配置');
}

async function memorizeWithSQLite(content: string, options: any) {
  // 简化的SQLite存储实现
  const id = `mem-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
  
  // TODO: 实际的SQLite存储
  // 现在返回模拟结果
  console.log(`📝 使用SQLite本地存储 (模拟)`);
  
  return {
    id,
    content,
    timestamp: new Date().toISOString(),
    ...options
  };
}

async function rememberWithSQLite(query: string, options: any) {
  // 简化的SQLite查询实现
  console.log(`🔍 使用SQLite本地查询 (模拟)`);
  
  // TODO: 实际的SQLite查询和文本相似度计算
  // 现在返回模拟结果
  return [
    {
      id: 'mem-example-1',
      content: `关于"${query}"的研究记录，这是一个模拟的记忆条目，展示了如何存储和检索研究结论。`,
      tags: ['research', 'example'],
      category: 'general',
      timestamp: new Date().toISOString(),
      score: 0.85
    }
  ];
}

if (import.meta.url === `file://${process.argv[1]}`) {
  program.parse();
}

export { program };