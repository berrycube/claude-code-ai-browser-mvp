import { PlannerAgent } from '../agents/planner.js';
import { SearcherAgent } from '../agents/searcher.js';
import { WriterAgent } from '../agents/writer.js';
import { spawn } from 'child_process';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';
import type { ResearchOptions, WorkflowResult } from '../../packages/types/src/index.js';

/**
 * 诚实的MVP工作流引擎
 * 
 * 设计原则：
 * 1. 删除模拟代理，直接调用MCP工具
 * 2. 专注核心价值链：Plan → Search/Browse → Report
 * 3. 每个步骤都产生真实价值
 * 4. 透明的降级策略
 */
export class HonestResearchWorkflow {
  private planner: PlannerAgent;
  private searcher: SearcherAgent;
  private writer: WriterAgent;
  
  // MCP工具调用缓存
  private mcpProcesses: Map<string, any> = new Map();
  
  constructor() {
    // 只保留有真实实现的代理
    this.planner = new PlannerAgent();
    this.searcher = new SearcherAgent();
    this.writer = new WriterAgent();
  }

  async execute(topic: string, options: ResearchOptions): Promise<WorkflowResult> {
    console.log(`🚀 启动诚实的研究工作流: ${topic}`);
    const startTime = Date.now();
    
    try {
      // Step 1: 制定研究计划（真实实现）
      console.log(`\n📋 步骤1/3: 制定研究计划...`);
      const plan = await this.planner.execute({ topic, options });
      console.log(`✅ 计划完成: ${plan.subtopics.length}个子主题`);
      
      // Step 2: 搜索和智能浏览（合并步骤）
      console.log(`\n🔍 步骤2/3: 搜索并智能获取内容...`);
      const sources = await this.searchAndEnrich(plan, options);
      console.log(`✅ 获取${sources.length}个来源，其中${sources.filter(s => s.enriched).length}个包含完整内容`);
      
      // Step 3: 生成研究报告（真实实现）
      console.log(`\n📝 步骤3/3: 生成研究报告...`);
      const report = await this.writer.execute({
        topic,
        plan,
        sources,
        extractedData: sources, // 直接使用enriched sources
        options
      });
      
      const duration = Date.now() - startTime;
      console.log(`\n✅ 工作流完成！用时: ${(duration/1000).toFixed(1)}秒`);
      
      return {
        success: true,
        topic,
        reportPath: report.path,
        sourcesCount: sources.length,
        duration
      };
      
    } catch (error) {
      console.error(`❌ 工作流失败:`, error);
      throw error;
    }
  }
  
  /**
   * 搜索并智能获取内容
   * 直接调用MCP工具，不通过代理抽象
   */
  private async searchAndEnrich(plan: any, options: ResearchOptions): Promise<any[]> {
    // Step 2a: 执行搜索（真实API或模拟）
    const searchResults = await this.searcher.execute({ plan, options });
    
    // Step 2b: 智能决策是否需要获取完整内容
    const enrichedSources = await Promise.all(
      searchResults.map(async (source, index) => {
        // 智能决策：只对高价值来源获取完整内容
        if (this.shouldEnrichSource(source, index)) {
          try {
            // 直接调用MCP工具获取内容
            const enrichedData = await this.enrichSourceWithMCP(source);
            return {
              ...source,
              ...enrichedData,
              enriched: true
            };
          } catch (error) {
            console.warn(`⚠️ 无法获取完整内容 ${source.url}: ${error}`);
            // 降级：使用搜索snippet
            return {
              ...source,
              enriched: false,
              fallback_reason: String(error)
            };
          }
        }
        
        // 低价值来源：直接使用搜索结果
        return {
          ...source,
          enriched: false,
          skip_reason: 'low_priority'
        };
      })
    );
    
    return enrichedSources;
  }
  
  /**
   * 智能决策是否需要获取完整内容
   */
  private shouldEnrichSource(source: any, index: number): boolean {
    // 决策规则（可配置）
    const rules = {
      maxSourcesToEnrich: 5,        // 最多获取5个完整内容
      minSnippetLength: 100,        // snippet太短才需要完整内容
      priorityDomains: [             // 优先获取的域名
        'wikipedia.org',
        'arxiv.org',
        '.gov',
        '.edu'
      ]
    };
    
    // 规则1：限制数量
    if (index >= rules.maxSourcesToEnrich) {
      return false;
    }
    
    // 规则2：snippet已经足够
    if (source.snippet && source.snippet.length > rules.minSnippetLength * 3) {
      return false; // snippet已经很详细
    }
    
    // 规则3：优先域名
    const url = source.url || '';
    const isPriority = rules.priorityDomains.some(domain => url.includes(domain));
    if (isPriority) {
      return true;
    }
    
    // 规则4：snippet太短
    return !source.snippet || source.snippet.length < rules.minSnippetLength;
  }
  
  /**
   * 直接调用MCP research-tools获取和处理内容
   * 不通过Browser/Extractor代理抽象
   */
  private async enrichSourceWithMCP(source: any): Promise<any> {
    try {
      // Step 1: 获取网页HTML（可以用playwright MCP或fetch）
      const html = await this.fetchHtml(source.url);
      
      // Step 2: 调用MCP research-tools的extract_readable
      const extracted = await this.callMcpTool('research-tools', 'extract_readable', {
        html,
        url: source.url
      });
      
      // Step 3: 调用MCP research-tools的normalize
      const normalized = await this.callMcpTool('research-tools', 'normalize', {
        item: {
          ...source,
          ...extracted,
          content_text: extracted.content_text || extracted.text
        }
      });
      
      // Step 4: 调用MCP research-tools的quality_score
      const quality = await this.callMcpTool('research-tools', 'quality_score', {
        item: normalized
      });
      
      return {
        ...normalized,
        quality,
        extraction_method: 'mcp_research_tools',
        extracted_at: new Date().toISOString()
      };
      
    } catch (error) {
      console.warn(`MCP工具调用失败: ${error}`);
      throw error;
    }
  }
  
  /**
   * 简单的HTML获取（后续可以集成playwright MCP）
   */
  private async fetchHtml(url: string): Promise<string> {
    // 方案1：直接用fetch（适合静态页面）
    try {
      const response = await fetch(url, {
        headers: {
          'User-Agent': 'Mozilla/5.0 (compatible; ResearchBot/1.0)'
        }
      });
      
      if (!response.ok) {
        throw new Error(`HTTP ${response.status}`);
      }
      
      return await response.text();
      
    } catch (fetchError) {
      // 方案2：降级使用搜索引擎缓存（如果可用）
      console.warn(`直接获取失败，尝试其他方法: ${fetchError}`);
      
      // TODO: 可以集成playwright MCP处理动态页面
      // return await this.callMcpTool('playwright', 'navigate', { url });
      
      throw fetchError;
    }
  }
  
  /**
   * 通用的MCP工具调用接口
   */
  private async callMcpTool(serverName: string, toolName: string, args: any): Promise<any> {
    // 简化实现：通过子进程调用MCP服务器
    // 真实实现应该使用MCP SDK的客户端
    
    return new Promise((resolve, reject) => {
      const mcpPath = path.join(process.cwd(), 'packages', serverName, 'dist', 'index.js');
      
      // 构造MCP调用请求
      const request = {
        jsonrpc: '2.0',
        method: 'tools/call',
        params: {
          name: toolName,
          arguments: args
        },
        id: Date.now()
      };
      
      // 调用MCP服务器
      const child = spawn('node', [mcpPath], {
        stdio: ['pipe', 'pipe', 'pipe']
      });
      
      let output = '';
      
      child.stdout.on('data', (data) => {
        output += data.toString();
      });
      
      child.stderr.on('data', (data) => {
        console.error(`MCP错误: ${data}`);
      });
      
      child.on('close', (code) => {
        if (code === 0) {
          try {
            const result = JSON.parse(output);
            resolve(result);
          } catch (e) {
            // 如果不是JSON，返回原始输出
            resolve(output);
          }
        } else {
          reject(new Error(`MCP工具调用失败，退出码: ${code}`));
        }
      });
      
      // 发送请求
      child.stdin.write(JSON.stringify(request));
      child.stdin.end();
    });
  }
  
  /**
   * 获取工作流状态（用于调试）
   */
  getMetrics() {
    return {
      approach: 'honest_mvp',
      steps: 3,
      agents: ['planner', 'searcher', 'writer'],
      mcp_tools: ['extract_readable', 'normalize', 'quality_score'],
      description: '诚实的MVP：直接调用MCP工具，无模拟代理'
    };
  }
}

// 导出工厂函数
export function createHonestWorkflow() {
  return new HonestResearchWorkflow();
}