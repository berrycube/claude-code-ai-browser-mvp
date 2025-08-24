import { Agent } from './base.js';

export class BrowserAgent extends Agent {
  name = 'Browser';
  description = '浏览执行专家。通过 Playwright MCP 导航/点击/滚动/导出快照。';

  async execute(input: { sources: any[]; options: any }): Promise<any[]> {
    this.log(`开始浏览${input.sources.length}个来源`);
    
    const { sources, options } = input;
    const browsedContent: any[] = [];
    
    for (const source of sources.slice(0, 5)) { // 限制浏览前5个来源
      try {
        this.log(`浏览: ${source.url}`);
        
        // 调用Playwright MCP进行网页浏览
        const pageContent = await this.browseUrl(source.url);
        
        if (pageContent) {
          browsedContent.push({
            ...source,
            page_content: pageContent,
            browsed_at: new Date().toISOString(),
            status: 'success'
          });
        }
        
        // 避免过于频繁的请求
        await this.sleep(2000);
        
      } catch (error) {
        this.log(`浏览失败 ${source.url}: ${error}`);
        browsedContent.push({
          ...source,
          error: String(error),
          status: 'failed',
          browsed_at: new Date().toISOString()
        });
      }
    }
    
    // 保存浏览结果
    await this.saveProgress(browsedContent, 'browsed-content.json');
    
    return browsedContent;
  }
  
  private async browseUrl(url: string): Promise<any> {
    try {
      // TODO: 实际的MCP调用实现
      // 现在返回模拟内容，后续集成真实的Playwright MCP
      
      // 模拟导航到页面
      this.log(`导航到: ${url}`);
      
      // 模拟页面快照
      const snapshot = {
        url,
        title: `页面标题 - ${url.split('/').pop()}`,
        html_content: `<html><body><h1>模拟页面内容</h1><p>这是从 ${url} 获取的模拟内容。在真实实现中，这里会是通过Playwright MCP获取的实际页面内容。</p></body></html>`,
        screenshot_path: null, // 后续实现屏幕截图
        timestamp: new Date().toISOString()
      };
      
      return snapshot;
      
    } catch (error) {
      this.log(`浏览器错误: ${error}`);
      throw error;
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}