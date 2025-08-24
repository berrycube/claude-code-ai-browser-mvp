import { Agent } from './base.js';
import * as fs from 'node:fs/promises';
import * as path from 'node:path';

export class WriterAgent extends Agent {
  name = 'Writer';
  description = '报告生成专家。用模板生成含引用、可复核的决策支持报告（Markdown）。';

  async execute(input: { topic: string; plan: any; sources: any[]; options: any }): Promise<any> {
    this.log(`生成研究报告: ${input.topic}`);
    
    const { topic, plan, sources, options } = input;
    
    // 生成报告内容
    const report = await this.generateReport(topic, plan, sources, options);
    
    // 确定输出路径
    const timestamp = new Date().toISOString().split('T')[0];
    const reportPath = `workspace/reports/${timestamp}-${this.sanitizeFilename(topic)}.md`;
    
    // 创建目录
    await fs.mkdir(path.dirname(reportPath), { recursive: true });
    
    // 写入报告
    await fs.writeFile(reportPath, report, 'utf8');
    
    this.log(`报告已保存: ${reportPath}`);
    
    return {
      path: reportPath,
      content: report,
      wordCount: report.length,
      sourcesUsed: sources.length
    };
  }
  
  private async generateReport(topic: string, plan: any, sources: any[], options: any): Promise<string> {
    const timestamp = new Date().toISOString();
    
    let report = `# ${topic} - 研究报告

> 生成时间: ${timestamp}  
> 搜索语言: ${options.langs.join(', ')}  
> 数据来源: ${sources.length} 个来源  

## 执行摘要

本报告基于 ${sources.length} 个来源，对"${topic}"进行了全面的研究分析。

## 主要发现

`;

    // 根据子主题组织内容
    for (const subtopic of plan.subtopics) {
      report += `### ${subtopic}\n\n`;
      
      // 选择相关的来源
      const relevantSources = sources.slice(0, 2); // 简化逻辑
      
      for (const source of relevantSources) {
        report += `- **${source.title}**: ${source.snippet}  \n`;
        report += `  来源: [${source.url}](${source.url}) (${source.published_at?.split('T')[0] || '未知日期'})\\n\\n`;
      }
    }
    
    report += `## 数据来源详情

| 序号 | 标题 | 来源 | 发布日期 | 相关性 |
|------|------|------|----------|--------|
`;

    sources.forEach((source, index) => {
      const publishDate = source.published_at ? source.published_at.split('T')[0] : '未知';
      const relevance = (source.relevance_score * 100).toFixed(1) + '%';
      report += `| ${index + 1} | ${source.title} | ${source.url} | ${publishDate} | ${relevance} |\\n`;
    });

    report += `
## 方法论

- **搜索查询**: ${plan.searchQueries.length} 个查询词
- **时间范围**: ${options.since} 至今
- **语言覆盖**: ${options.langs.join(', ')}
- **数据质量**: 所有来源经过相关性评分筛选

## 局限性

- 本报告基于公开可获取的在线资料
- 搜索结果可能受搜索引擎算法影响
- 数据时效性以来源发布日期为准

---
*本报告由AI Browser Researcher自动生成 | 生成时间: ${timestamp}*
`;

    return report;
  }
  
  private sanitizeFilename(filename: string): string {
    return filename
      .replace(/[^a-zA-Z0-9\u4e00-\u9fff\-_]/g, '-')
      .replace(/--+/g, '-')
      .substring(0, 50);
  }
}