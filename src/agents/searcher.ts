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
    // TODO: 集成真实的搜索API (SerpApi/Brave Search)
    // 现在返回模拟数据
    return [
      {
        id: `search-${Date.now()}-${Math.random()}`,
        url: `https://example.com/article-${Math.floor(Math.random() * 1000)}`,
        title: `关于${query}的研究文章`,
        snippet: `这是一篇关于${query}的详细分析文章，涵盖了相关的技术发展和应用场景。`,
        published_at: new Date(Date.now() - Math.random() * 365 * 24 * 3600 * 1000).toISOString(),
        source: 'mock_search',
        lang: query.match(/[一-龥]/) ? 'zh' : 'en',
        relevance_score: Math.random() * 0.4 + 0.6 // 0.6-1.0
      }
    ];
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