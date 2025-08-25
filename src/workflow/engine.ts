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

    const startTime = Date.now();
    
    try {
      // 1. 计划阶段
      console.log(`📋 步骤1: 制定研究计划...`);
      this.state.plan = await this.executeWithRetry('planner', {
        topic,
        options
      }, '计划制定');
      console.log(`✅ 计划制定完成: ${this.state.plan.subtopics.length}个子主题`);

      // 2. 搜索阶段
      console.log(`🔍 步骤2: 执行搜索...`);
      this.state.sources = await this.executeWithRetry('searcher', {
        plan: this.state.plan,
        options
      }, '搜索执行');
      console.log(`✅ 搜索完成: ${this.state.sources.length}个来源`);

      // 3. 报告生成阶段（Legacy 3-step workflow）
      console.log(`📝 步骤3: 生成研究报告...`);
      const reportResult = await this.executeWithRetry('writer', {
        topic,
        plan: this.state.plan,
        sources: this.state.sources,
        options
      }, '报告生成');
      
      this.state.reportPath = reportResult.path;
      console.log(`✅ 报告生成完成: ${this.state.reportPath}`);

      const duration = Date.now() - startTime;

      return {
        success: true,
        topic,
        reportPath: this.state.reportPath,
        sourcesCount: this.state.sources.length,
        duration
      };

    } catch (error) {
      console.error(`❌ 工作流执行失败:`, error);
      
      // 保存错误状态，用于恢复
      await this.saveErrorState(error);
      
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

  private async executeWithRetry(agentName: string, input: any, stageName: string, maxRetries: number = 2): Promise<any> {
    let lastError: any;
    
    for (let attempt = 1; attempt <= maxRetries; attempt++) {
      try {
        console.log(`🔄 ${stageName} - 尝试 ${attempt}/${maxRetries}`);
        const result = await this.agents.get(agentName)!.execute(input);
        
        if (attempt > 1) {
          console.log(`✅ ${stageName} - 重试成功`);
        }
        
        return result;
        
      } catch (error) {
        lastError = error;
        console.warn(`⚠️ ${stageName} - 尝试 ${attempt} 失败: ${error}`);
        
        if (attempt < maxRetries) {
          // 等待后重试
          const delay = attempt * 1000; // 递增延迟
          console.log(`⏱️ ${stageName} - 等待 ${delay}ms 后重试...`);
          await this.sleep(delay);
        }
      }
    }
    
    throw new Error(`${stageName}在${maxRetries}次尝试后仍失败: ${lastError}`);
  }
  
  private async saveErrorState(error: any): Promise<void> {
    try {
      const errorState = {
        timestamp: new Date().toISOString(),
        topic: this.state.topic,
        currentState: this.state,
        error: {
          message: error.message,
          stack: error.stack
        }
      };
      
      // TODO: 实现错误状态保存逻辑
      console.log(`💾 保存错误状态以便恢复...`);
      
    } catch (saveError) {
      console.warn(`⚠️ 保存错误状态失败: ${saveError}`);
    }
  }
  
  private sleep(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }
}