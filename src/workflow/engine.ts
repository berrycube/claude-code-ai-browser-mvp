import { Agent } from '../agents/base.js';
import { PlannerAgent } from '../agents/planner.js';
import { SearcherAgent } from '../agents/searcher.js';
import { WriterAgent } from '../agents/writer.js';
import type { ResearchOptions, WorkflowResult } from '../../packages/types/src/index.js';

export class ResearchWorkflow {
  private agents: Map<string, Agent>;
  private state: {
    topic: string;
    options: ResearchOptions;
    plan?: any;
    sources?: any[];
    analysis?: any;
    reportPath?: string;
  };

  constructor() {
    this.agents = new Map();
    this.agents.set('planner', new PlannerAgent());
    this.agents.set('searcher', new SearcherAgent());
    this.agents.set('writer', new WriterAgent());
    
    this.state = {
      topic: '',
      options: { langs: ['zh', 'en'], depth: 2, since: '2024-01-01' }
    };
  }

  async execute(topic: string, options: ResearchOptions): Promise<WorkflowResult> {
    console.log(`🚀 启动工作流: ${topic}`);
    
    this.state.topic = topic;
    this.state.options = options;

    try {
      // 1. 计划阶段
      console.log(`📋 步骤1: 制定研究计划...`);
      this.state.plan = await this.agents.get('planner')!.execute({
        topic,
        options
      });
      console.log(`✅ 计划制定完成: ${this.state.plan.subtopics.length}个子主题`);

      // 2. 搜索阶段
      console.log(`🔍 步骤2: 执行搜索...`);
      this.state.sources = await this.agents.get('searcher')!.execute({
        plan: this.state.plan,
        options
      });
      console.log(`✅ 搜索完成: ${this.state.sources.length}个来源`);

      // 3. 报告生成阶段
      console.log(`📝 步骤3: 生成研究报告...`);
      const reportResult = await this.agents.get('writer')!.execute({
        topic,
        plan: this.state.plan,
        sources: this.state.sources,
        options
      });
      
      this.state.reportPath = reportResult.path;
      console.log(`✅ 报告生成完成: ${this.state.reportPath}`);

      return {
        success: true,
        topic,
        reportPath: this.state.reportPath,
        sourcesCount: this.state.sources.length,
        duration: Date.now() // TODO: 实际计算时长
      };

    } catch (error) {
      console.error(`❌ 工作流执行失败:`, error);
      throw error;
    }
  }

  async pauseForHuman(stage: string, data: any): Promise<void> {
    console.log(`⏸️ 暂停在${stage}阶段，等待人类确认...`);
    // TODO: 实现人机交互逻辑
    // 可以通过stdin读取用户输入，或者集成WebSocket
  }

  getState() {
    return { ...this.state };
  }
}