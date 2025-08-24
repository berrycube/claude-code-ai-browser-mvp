import { Agent } from './base.js';

export class PlannerAgent extends Agent {
  name = 'Planner';
  description = '研究规划专家。把高层目标拆解为阶段计划与暂停点。';

  async execute(input: { topic: string; options: any }): Promise<any> {
    this.log(`制定研究计划: ${input.topic}`);
    
    const { topic, options } = input;
    
    // 简单的计划生成逻辑
    const plan = {
      topic,
      subtopics: this.generateSubtopics(topic),
      searchQueries: this.generateSearchQueries(topic, options.langs),
      timeline: this.generateTimeline(options.depth),
      checkpoints: ['搜索完成后', '内容抽取后', '分析完成后']
    };
    
    // 保存计划
    await this.saveProgress(plan, 'plan.json');
    
    return plan;
  }
  
  private generateSubtopics(topic: string): string[] {
    // 简单的子主题生成
    return [
      `${topic}的现状分析`,
      `${topic}的发展趋势`,
      `${topic}的关键技术`,
      `${topic}的应用场景`,
      `${topic}的挑战与机遇`
    ];
  }
  
  private generateSearchQueries(topic: string, langs: string[]): string[] {
    const queries: string[] = [];
    
    for (const lang of langs) {
      if (lang === 'zh') {
        queries.push(
          `${topic} 现状 发展`,
          `${topic} 技术趋势 2024`,
          `${topic} 应用 案例`
        );
      } else if (lang === 'en') {
        queries.push(
          `${topic} current state development`,
          `${topic} technology trends 2024`,
          `${topic} applications use cases`
        );
      }
    }
    
    return queries;
  }
  
  private generateTimeline(depth: number): any {
    return {
      estimated_hours: depth * 0.5,
      phases: [
        { name: '计划制定', duration: '5分钟' },
        { name: '信息搜索', duration: `${depth * 10}分钟` },
        { name: '内容抽取', duration: '10分钟' },
        { name: '分析整理', duration: '15分钟' },
        { name: '报告生成', duration: '10分钟' }
      ]
    };
  }
}