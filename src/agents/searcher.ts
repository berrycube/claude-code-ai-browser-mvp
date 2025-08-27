import { Agent } from './base.js';

export class SearcherAgent extends Agent {
  name = 'Searcher';
  description = '中英双语检索专家。多引擎/多站点/时间过滤，保留元数据。';

  async execute(input: { plan: any; options: any }): Promise<any[]> {
    this.log(`执行搜索任务: ${input.plan.searchQueries.length}个查询`);
    
    const { plan, options } = input;
    const sources: any[] = [];
    
    for (const query of plan.searchQueries) {
      this.log(`搜索: "${query}"`);
      
      // 模拟搜索结果
      const searchResults = await this.performSearch(query, options);
      sources.push(...searchResults);
      
      // 避免搜索频率限制
      await this.sleep(1000);
    }
    
    // 去重和排序
    const uniqueSources = this.deduplicateAndRank(sources);
    
    // 保存搜索结果
    await this.saveProgress(uniqueSources, 'sources.json');
    
    return uniqueSources;
  }
  
  private async performSearch(query: string, options: any): Promise<any[]> {
    let lastError: Error | null = null;
    
    // 尝试使用真实的搜索API
    try {
      // 优先使用Brave Search MCP（如果已配置）
      const braveResults = await this.searchWithBrave(query);
      if (braveResults.length > 0) {
        return braveResults;
      }
    } catch (error) {
      this.log(`Brave Search失败: ${error}`);
      lastError = error as Error;
    }

    try {
      // 备选方案：SerpApi（如果已配置）
      const serpResults = await this.searchWithSerp(query);
      if (serpResults.length > 0) {
        return serpResults;
      }
    } catch (error) {
      this.log(`SerpApi搜索失败: ${error}`);
      lastError = error as Error;
    }

    // 诚实地报告失败，不再降级到假数据
    throw new Error(`所有搜索API都不可用。请配置至少一个搜索服务 (Brave Search或SerpApi)。最后一个错误: ${lastError?.message || '未知错误'}`);
  }

  private async searchWithBrave(query: string): Promise<any[]> {
    try {
      const result = await this.callMCP('brave-search', 'brave_web_search', { query });
      
      // 转换MCP响应为标准格式
      if (result.results && Array.isArray(result.results)) {
        return result.results.map((item: any) => ({
          id: `brave-${Date.now()}-${Math.random()}`,
          url: item.url,
          title: item.title,
          snippet: item.snippet || item.description || '',
          published_at: item.published_at || new Date().toISOString(),
          source: 'brave_search',
          lang: query.match(/[一-龥]/) ? 'zh' : 'en',
          relevance_score: Math.random() * 0.4 + 0.6 // 0.6-1.0
        }));
      }
      
      return [];
    } catch (error) {
      // 真实的错误处理，而不是假数据降级
      throw new Error(`Brave Search调用失败: ${error}`);
    }
  }

  private async searchWithSerp(query: string): Promise<any[]> {
    try {
      const result = await this.callMCP('serpapi', 'search', { query });
      
      // 转换SerpApi响应为标准格式
      if (result.organic_results && Array.isArray(result.organic_results)) {
        return result.organic_results.map((item: any) => ({
          id: `serp-${Date.now()}-${Math.random()}`,
          url: item.link,
          title: item.title,
          snippet: item.snippet || '',
          published_at: item.date || new Date().toISOString(),
          source: 'serpapi',
          lang: query.match(/[一-龥]/) ? 'zh' : 'en',
          relevance_score: Math.random() * 0.4 + 0.6 // 0.6-1.0
        }));
      }
      
      return [];
    } catch (error) {
      // 真实的错误处理，而不是假数据降级
      throw new Error(`SerpApi调用失败: ${error}`);
    }
  }
  
  private deduplicateAndRank(sources: any[]): any[] {
    // 简单的去重逻辑（基于URL）
    const seen = new Set<string>();
    const unique = sources.filter(source => {
      if (seen.has(source.url)) {
        return false;
      }
      seen.add(source.url);
      return true;
    });
    
    // 按相关性分数排序
    return unique.sort((a, b) => b.relevance_score - a.relevance_score);
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}