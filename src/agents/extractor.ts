import { Agent } from './base.js';

export class ExtractorAgent extends Agent {
  name = 'Extractor';
  description = '抽取规约专家。清洗正文、归一元数据、打标签与质量评分。';

  async execute(input: { browsedContent: any[]; options: any }): Promise<any[]> {
    this.log(`开始抽取${input.browsedContent.length}个页面内容`);
    
    const { browsedContent, options } = input;
    const extractedData: any[] = [];
    
    for (const content of browsedContent) {
      try {
        if (content.status !== 'success') {
          // 跳过失败的浏览结果
          continue;
        }
        
        this.log(`抽取内容: ${content.url}`);
        
        // 调用MCP research-tools进行内容抽取
        const extractedItem = await this.extractReadableContent(content);
        
        // 标准化数据格式
        const normalizedItem = await this.normalizeData(extractedItem);
        
        // 质量评分
        const qualityScore = await this.calculateQualityScore(normalizedItem);
        
        const finalItem = {
          ...normalizedItem,
          quality: qualityScore,
          extracted_at: new Date().toISOString(),
          processing_status: 'completed'
        };
        
        extractedData.push(finalItem);
        
      } catch (error) {
        this.log(`抽取失败 ${content.url}: ${error}`);
        extractedData.push({
          ...content,
          error: String(error),
          processing_status: 'failed',
          extracted_at: new Date().toISOString()
        });
      }
    }
    
    // 保存抽取结果
    await this.saveProgress(extractedData, 'extracted-data.json');
    
    return extractedData;
  }
  
  private async extractReadableContent(content: any): Promise<any> {
    // TODO: 实际调用MCP research-tools的extract_readable工具
    // 现在使用模拟实现
    
    const htmlContent = content.page_content?.html_content || '';
    
    // 模拟可读内容抽取
    const readable = {
      title: content.page_content?.title || content.title || '',
      byline: '', // 作者信息
      excerpt: '这是页面内容的摘要...', // 页面摘要
      content_text: this.extractTextFromHtml(htmlContent),
      length: htmlContent.length,
      url: content.url,
      extracted_at: new Date().toISOString()
    };
    
    return readable;
  }
  
  private async normalizeData(item: any): Promise<any> {
    // TODO: 实际调用MCP research-tools的normalize工具
    // 现在使用模拟实现
    
    const url = new URL(item.url);
    const host = url.hostname.replace(/^www\./, '');
    const lang = /[一-龥]/.test(item.content_text || '') ? 'zh' : 'en';
    
    return {
      id: `${item.url}#${item.title?.slice(0, 32) || ''}`,
      url: item.url,
      host,
      title: item.title || '',
      author: item.byline || '',
      lang,
      published_at: null, // TODO: 提取发布时间
      extracted_at: item.extracted_at,
      content_text: item.content_text || '',
      keywords: this.extractKeywords(item.content_text || ''),
    };
  }
  
  private async calculateQualityScore(item: any): Promise<any> {
    // TODO: 实际调用MCP research-tools的quality_score工具
    // 现在使用简化的质量评分逻辑
    
    let score = 0.4;
    const labels: string[] = [];
    const url = item.url || '';
    const text = (item.content_text || '').toLowerCase();
    
    // 权威性检查
    if (/\.gov|\.edu|who\.int|oecd\.org|arxiv\.org|wikipedia\.org/.test(url)) {
      score += 0.2;
      labels.push('authoritative');
    }
    
    // 营销内容检查
    if (/(sponsor|advertorial|promotion|优惠|种草|联盟链接)/.test(text)) {
      score -= 0.2;
      labels.push('marketing');
    }
    
    // 内容长度评分
    const len = item.content_text?.length || 0;
    score += Math.min(0.2, len / 8000 * 0.2);
    
    // 内容新鲜度（模拟）
    score += 0.1; // 假设内容较新
    
    score = Math.max(0, Math.min(1, score));
    
    return { score, labels };
  }
  
  private extractTextFromHtml(html: string): string {
    // 简化的HTML文本提取
    return html
      .replace(/<[^>]*>/g, ' ') // 移除HTML标签
      .replace(/\s+/g, ' ') // 合并空白字符
      .trim();
  }
  
  private extractKeywords(text: string): string[] {
    // 简化的关键词提取
    const words = text.toLowerCase()
      .replace(/[^\w\s\u4e00-\u9fff]/g, ' ')
      .split(/\s+/)
      .filter(word => word.length > 2);
    
    // 简单的词频统计和过滤
    const wordCount = new Map<string, number>();
    words.forEach(word => {
      wordCount.set(word, (wordCount.get(word) || 0) + 1);
    });
    
    return Array.from(wordCount.entries())
      .filter(([word, count]) => count > 1)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([word]) => word);
  }
}