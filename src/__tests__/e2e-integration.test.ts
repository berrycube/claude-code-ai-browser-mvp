import { describe, it, expect, beforeAll, afterAll } from 'vitest';
import { ProductionMCPClient } from '../mcp/client.js';
import { HonestResearchWorkflow } from '../workflow/engine.js';
import { validateSearchQuality } from '../utils/relevance.js';
import type { ResearchOptions } from '../../packages/types/src/index.js';

/**
 * 端到端集成测试 - 测试真实API集成能力
 * 
 * 注意：这些测试需要真实的API密钥才能完全运行
 * 在CI/CD环境中，这些测试可能会被跳过或使用录制的响应
 */
describe('端到端API集成测试', () => {
  let hasRealAPIKeys: boolean;

  beforeAll(() => {
    // 检查是否有真实的API密钥
    hasRealAPIKeys = !!(
      process.env.BRAVE_API_KEY || 
      process.env.SERPAPI_API_KEY
    );
    
    if (!hasRealAPIKeys) {
      console.log('⚠️ 没有检测到真实API密钥，将使用模拟响应进行测试');
    }
  });

  describe('真实MCP客户端集成', () => {
    it('应该能识别真实API配置状态', () => {
      const realClient = new ProductionMCPClient('real');
      const mockClient = new ProductionMCPClient('mock');
      const testClient = new ProductionMCPClient('test');

      expect(realClient.getMode()).toBe('real');
      expect(mockClient.getMode()).toBe('mock');
      expect(testClient.getMode()).toBe('test');

      // 所有客户端都应该识别基本服务
      expect(realClient.isAvailable('brave-search')).toBe(true);
      expect(realClient.isAvailable('research-tools')).toBe(true);
      expect(realClient.isAvailable('nonexistent')).toBe(false);
    });

    it('应该在真实模式下尝试调用真实API', async () => {
      const client = new ProductionMCPClient('real');
      
      const result = await client.call('brave-search', 'brave_web_search', {
        query: 'TypeScript tutorial'
      });

      // 验证响应结构
      expect(result.mode).toBe('real');
      expect(result.success).toBeDefined();
      expect(result.timestamp).toBeTruthy();
      
      if (hasRealAPIKeys) {
        // 如果有真实API密钥，验证真实响应
        expect(result.success).toBe(true);
        expect(result.data).toBeTruthy();
      } else {
        // 没有API密钥时，应该返回配置错误
        expect(result.success).toBe(false);
        expect(result.error).toContain('未配置');
      }
    });

    it('应该在测试模式下返回预录制的响应', async () => {
      const client = new ProductionMCPClient('test');
      
      const result = await client.call('brave-search', 'brave_web_search', {
        query: 'React hooks guide'
      });

      expect(result.mode).toBe('test');
      expect(result.success).toBe(true);
      expect(result.data.recorded).toBe(true);
      expect(result.data.source).toBe('recorded_real_response');
      
      // 验证预录制数据的质量
      if (result.data.results) {
        const searchQuality = validateSearchQuality(result.data.results, 'React hooks guide');
        expect(searchQuality.avgRelevance).toBeGreaterThan(0.3);
      }
    });
  });

  describe('工作流与真实API的集成', () => {
    it('应该能配置不同的MCP模式', async () => {
      // 测试环境变量配置
      process.env.MCP_MODE = 'test';
      
      const workflow = new HonestResearchWorkflow();
      const topic = 'API集成测试';
      const options: ResearchOptions = {
        langs: ['en'],
        depth: 1,
        since: '2024-01-01'
      };

      const result = await workflow.execute(topic, options);
      
      expect(result.success).toBe(true);
      expect(result.topic).toBe(topic);
      
      // 验证使用了测试模式
      const state = workflow.getState();
      if (state.enrichedSources && state.enrichedSources.length > 0) {
        // 检查是否有测试模式的标识
        const hasTestModeData = state.enrichedSources.some(source => 
          source.page_content?.status === 'mocked_response' ||
          source.extracted_content?.status === 'mocked_response'
        );
        expect(hasTestModeData).toBe(true);
      }
    }, 15000);

    it('应该能处理API调用失败的情况', async () => {
      // 强制使用真实模式但没有API密钥
      process.env.MCP_MODE = 'real';
      delete process.env.BRAVE_API_KEY;
      delete process.env.SERPAPI_API_KEY;
      
      const workflow = new HonestResearchWorkflow();
      const topic = 'API失败测试';
      const options: ResearchOptions = {
        langs: ['en'],
        depth: 1,
        since: '2024-01-01'
      };

      // 应该抛出有意义的错误，而不是返回假数据
      await expect(workflow.execute(topic, options))
        .rejects
        .toThrow(/搜索API都不可用/);
    }, 10000);

    it.skipIf(!hasRealAPIKeys)('应该在有真实API时产生高质量结果', async () => {
      // 仅在有真实API密钥时运行

      process.env.MCP_MODE = 'real';
      
      const workflow = new HonestResearchWorkflow();
      const topic = 'JavaScript ES2024 features';
      const options: ResearchOptions = {
        langs: ['en'],
        depth: 1,
        since: '2024-01-01'
      };

      const result = await workflow.execute(topic, options);
      
      expect(result.success).toBe(true);
      
      // 验证真实API产生的结果质量
      const state = workflow.getState();
      if (state.enrichedSources) {
        const realResults = state.enrichedSources.filter(source => 
          !source.url?.includes('example.com')
        );
        
        expect(realResults.length).toBeGreaterThan(0);
        
        // 验证真实结果的相关性
        const searchQuality = validateSearchQuality(realResults, topic);
        expect(searchQuality.avgRelevance).toBeGreaterThan(0.4);
      }
    }, 60000); // 真实API调用需要更长时间
  });

  describe('契约测试 - 验证API响应格式', () => {
    it('应该验证Brave Search API响应格式', async () => {
      const client = new ProductionMCPClient('test'); // 使用测试模式避免真实API调用
      
      const result = await client.call('brave-search', 'brave_web_search', {
        query: 'test query',
        count: 5
      });

      expect(result.success).toBe(true);
      
      if (result.data.results) {
        // 验证每个搜索结果都有必需字段
        result.data.results.forEach((item: any, index: number) => {
          expect(item.title).toBeTruthy(`结果${index}缺少标题`);
          expect(item.url).toBeTruthy(`结果${index}缺少URL`);
          expect(item.url).toMatch(/^https?:\/\//, `结果${index}URL格式无效`);
          
          // 可选字段验证
          if (item.snippet) {
            expect(typeof item.snippet).toBe('string');
          }
          if (item.published_at) {
            expect(new Date(item.published_at)).toBeInstanceOf(Date);
          }
        });
      }
    });

    it('应该验证Research Tools API响应格式', async () => {
      const client = new ProductionMCPClient('test');
      
      const result = await client.call('research-tools', 'extract_readable', {
        html: '<html><body><h1>Test</h1><p>Content</p></body></html>',
        url: 'https://test.example.com'
      });

      expect(result.success).toBe(true);
      expect(result.data.title).toBeTruthy();
      expect(result.data.content_text).toBeTruthy();
      expect(typeof result.data.length).toBe('number');
      expect(result.data.url).toBeTruthy();
      expect(result.data.extracted_at || result.data.timestamp).toBeTruthy();
    });

    it('应该验证Playwright API响应格式', async () => {
      const client = new ProductionMCPClient('test');
      
      const result = await client.call('playwright', 'navigate', {
        url: 'https://test.example.com'
      });

      expect(result.success).toBe(true);
      expect(result.data.url).toBe('https://test.example.com');
      expect(result.data.title).toBeTruthy();
      expect(result.data.status).toBeTruthy();
      
      if (result.data.html) {
        expect(result.data.html).toContain('<html');
      }
    });
  });

  describe('性能和可靠性测试', () => {
    it('应该在合理时间内完成搜索请求', async () => {
      const client = new ProductionMCPClient('mock'); // 使用mock确保稳定性
      
      const startTime = Date.now();
      const result = await client.call('brave-search', 'brave_web_search', {
        query: 'performance test'
      });
      const duration = Date.now() - startTime;

      expect(result.success).toBe(true);
      expect(duration).toBeLessThan(5000); // 5秒内完成
    });

    it('应该处理并发请求', async () => {
      const client = new ProductionMCPClient('mock');
      
      const queries = [
        'JavaScript',
        'TypeScript', 
        'React',
        'Node.js',
        'Python'
      ];
      
      const promises = queries.map(query => 
        client.call('brave-search', 'brave_web_search', { query })
      );
      
      const results = await Promise.all(promises);
      
      // 所有请求都应该成功
      results.forEach((result, index) => {
        expect(result.success).toBe(true);
        expect(result.server).toBe('brave-search');
      });
      
      // 验证结果的唯一性（不同查询应该有不同结果）
      const uniqueResults = new Set(results.map(r => JSON.stringify(r.data)));
      expect(uniqueResults.size).toBeGreaterThan(1);
    });

    it('应该优雅地处理网络错误', async () => {
      const client = new ProductionMCPClient('real');
      
      // 使用无效的服务器测试错误处理
      const result = await client.call('nonexistent-server', 'test-tool', {
        test: 'data'
      });

      expect(result.success).toBe(false);
      expect(result.error).toContain('不可用或未配置');
      expect(result.mode).toBe('real');
    });
  });

  afterAll(() => {
    // 清理环境变量
    delete process.env.MCP_MODE;
  });
});