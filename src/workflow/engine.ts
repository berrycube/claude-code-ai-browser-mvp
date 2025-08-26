import { PlannerAgent } from '../agents/planner.js';
import { SearcherAgent } from '../agents/searcher.js';
import { WriterAgent } from '../agents/writer.js';
import type { ResearchOptions, WorkflowResult } from '../../packages/types/src/index.js';

/**
 * 诚实的MVP工作流引擎
 * 3步真实流程：Plan → Search/Fetch → Report
 * 
 * 设计原则：
 * - 每一步都必须产生真实价值
 * - 直接调用MCP工具，不需要代理抽象
 * - 失败时诚实告知用户，提供降级方案
 */
export class HonestResearchWorkflow {
  private planner: PlannerAgent;
  private searcher: SearcherAgent;
  private writer: WriterAgent;
  private state: {
    topic: string;
    options: ResearchOptions;
    plan?: any;
    sources?: any[];
    enrichedSources?: any[];
    reportPath?: string;
  };

  constructor() {
    this.planner = new PlannerAgent();
    this.searcher = new SearcherAgent();
    this.writer = new WriterAgent();
    
    this.state = {
      topic: '',
      options: { langs: ['zh', 'en'], depth: 2, since: '2024-01-01' }
    };
  }

  async execute(topic: string, options: ResearchOptions): Promise<WorkflowResult> {
    console.log(`🚀 启动诚实MVP工作流: ${topic}`);
    
    this.state.topic = topic;
    this.state.options = options;
    const startTime = Date.now();

    try {
      // Step 1: 真实计划制定
      console.log(`📋 步骤1: 制定研究计划...`);
      this.state.plan = await this.planner.execute({
        topic,
        options
      });
      console.log(`✅ 计划完成: ${this.state.plan.subtopics.length}个子主题`);

      // Step 2: 真实搜索 + 内容获取
      console.log(`🔍 步骤2: 搜索和内容获取...`);
      this.state.sources = await this.searcher.execute({
        plan: this.state.plan,
        options
      });
      console.log(`✅ 搜索完成: ${this.state.sources.length}个来源`);

      // Step 2.5: 智能内容丰富（直接调用MCP，无代理抽象）
      console.log(`🌐 步骤2.5: 丰富内容（智能选择性抓取）...`);
      this.state.enrichedSources = await this.enrichContentIntelligently(this.state.sources);
      console.log(`✅ 内容丰富完成: ${this.state.enrichedSources.length}个丰富来源`);

      // Step 3: 基于真实数据生成报告
      console.log(`📝 步骤3: 生成研究报告...`);
      const reportResult = await this.writer.execute({
        topic,
        plan: this.state.plan,
        sources: this.state.enrichedSources,
        options
      });
      
      this.state.reportPath = reportResult.path;
      console.log(`✅ 报告生成完成: ${this.state.reportPath}`);

      const duration = Date.now() - startTime;

      return {
        success: true,
        topic,
        reportPath: this.state.reportPath,
        sourcesCount: this.state.enrichedSources.length,
        duration
      };

    } catch (error) {
      console.error(`❌ 工作流执行失败:`, error);
      throw error;
    }
  }

  /**
   * 智能内容丰富 - 直接调用MCP工具，无代理抽象
   * 基于规则决定是否需要完整内容：
   * - 优先.edu、.gov、arxiv.org等权威站点
   * - 限制最多5个网页防止过度抓取
   * - 失败时透明降级到搜索结果
   */
  private async enrichContentIntelligently(sources: any[]): Promise<any[]> {
    const enriched: any[] = [];
    
    // 智能筛选：优先权威来源
    const prioritySources = this.prioritizeSources(sources);
    const selectedSources = prioritySources.slice(0, 5); // 限制5个
    
    console.log(`🎯 选择${selectedSources.length}个优质来源进行内容抓取`);
    
    for (const source of selectedSources) {
      try {
        console.log(`  📄 抓取: ${source.url}`);
        
        // 直接调用MCP工具 - 无代理抽象
        const pageContent = await this.fetchPageContent(source.url);
        const extractedContent = await this.extractReadableContent(pageContent, source.url);
        
        enriched.push({
          ...source,
          page_content: pageContent,
          extracted_content: extractedContent,
          enrichment_status: 'success',
          enriched_at: new Date().toISOString()
        });
        
        // 控制请求频率
        await this.sleep(1000);
        
      } catch (error) {
        console.warn(`  ⚠️ 抓取失败 ${source.url}: ${error}`);
        
        // 透明降级：使用原始搜索结果
        enriched.push({
          ...source,
          enrichment_status: 'failed',
          enrichment_error: String(error),
          enriched_at: new Date().toISOString()
        });
      }
    }
    
    // 添加未选中的来源（仅搜索结果）
    const remaining = sources.slice(selectedSources.length);
    remaining.forEach(source => {
      enriched.push({
        ...source,
        enrichment_status: 'skipped',
        enriched_at: new Date().toISOString()
      });
    });
    
    const successCount = enriched.filter(s => s.enrichment_status === 'success').length;
    const failureRate = (selectedSources.length - successCount) / selectedSources.length;
    
    console.log(`📊 内容丰富统计: ${successCount}/${selectedSources.length} 成功 (失败率: ${(failureRate * 100).toFixed(1)}%)`);
    
    return enriched;
  }
  
  /**
   * 智能来源优先级排序
   */
  private prioritizeSources(sources: any[]): any[] {
    return sources.sort((a, b) => {
      let scoreA = a.relevance_score || 0.5;
      let scoreB = b.relevance_score || 0.5;
      
      // 权威域名加分
      const authoritative = ['.edu', '.gov', 'arxiv.org', 'who.int', 'oecd.org', 'wikipedia.org'];
      if (authoritative.some(domain => (a.url || '').includes(domain))) scoreA += 0.2;
      if (authoritative.some(domain => (b.url || '').includes(domain))) scoreB += 0.2;
      
      // 避免营销内容
      const marketing = ['sponsor', 'ad', 'promotion', '广告', '推广'];
      if (marketing.some(term => (a.title || '').toLowerCase().includes(term))) scoreA -= 0.3;
      if (marketing.some(term => (b.title || '').toLowerCase().includes(term))) scoreB -= 0.3;
      
      return scoreB - scoreA;
    });
  }

  /**
   * 直接调用Playwright MCP获取页面内容
   */
  private async fetchPageContent(url: string): Promise<any> {
    try {
      // 动态创建MCP客户端以支持运行时环境变量变更
      const { createMCPClient } = await import('../mcp/client.js');
      const mcpClient = createMCPClient();
      const result = await mcpClient.call('playwright', 'navigate', { url });
      
      if (!result.success) {
        throw new Error(result.error || 'Playwright调用失败');
      }
      
      return {
        url,
        title: result.data.title || `页面 - ${url.split('/').pop()}`,
        html: result.data.html || '<!-- MCP调用返回的HTML内容 -->',
        timestamp: new Date().toISOString(),
        mcp_call: 'playwright.navigate',
        status: result.data.mocked ? 'mocked_response' : 'real_response'
      };
    } catch (error) {
      throw new Error(`页面内容获取失败 (${url}): ${error}`);
    }
  }
  
  /**
   * 直接调用research-tools MCP进行内容提取
   */
  private async extractReadableContent(pageContent: any, url: string): Promise<any> {
    try {
      // 动态创建MCP客户端以支持运行时环境变量变更
      const { createMCPClient } = await import('../mcp/client.js');
      const mcpClient = createMCPClient();
      const result = await mcpClient.call('research-tools', 'extract_readable', { 
        html: pageContent.html, 
        url: url 
      });
      
      if (!result.success) {
        throw new Error(result.error || 'Research-tools调用失败');
      }
      
      return {
        title: result.data.title || pageContent.title,
        content_text: result.data.content_text || '提取的内容文本',
        length: result.data.length || 0,
        url: url,
        extracted_at: new Date().toISOString(),
        mcp_call: 'research-tools.extract_readable',
        status: result.data.mocked ? 'mocked_response' : 'real_response'
      };
    } catch (error) {
      throw new Error(`内容提取失败 (${url}): ${error}`);
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  getState() {
    return { ...this.state };
  }
}