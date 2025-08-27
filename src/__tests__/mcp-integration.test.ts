import { describe, it, expect, vi } from 'vitest';
import { ProductionMCPClient, type MCPClient, type MCPCallResult } from '../mcp/client.js';
import { SearcherAgent } from '../agents/searcher.js';

describe('MCP集成真实性验证', () => {
  it('应该提供结构化的MCP响应而非随机假数据', async () => {
    const client = new ProductionMCPClient('mock');
    
    // 测试搜索调用
    const searchResult = await client.call('brave-search', 'brave_web_search', { 
      query: '人工智能发展' 
    });
    
    expect(searchResult.success).toBe(true);
    expect(searchResult.server).toBe('brave-search');
    expect(searchResult.tool).toBe('brave_web_search');
    expect(searchResult.timestamp).toBeTruthy();
    
    // 验证响应结构，不是随机假数据
    expect(searchResult.data.mocked).toBe(true); // 明确标识为模拟
    expect(searchResult.data.results).toBeDefined();
    expect(Array.isArray(searchResult.data.results)).toBe(true);
    
    if (searchResult.data.results.length > 0) {
      const firstResult = searchResult.data.results[0];
      expect(firstResult.title).toContain('人工智能发展'); // 包含查询内容
      expect(firstResult.url).toMatch(/^https:\/\//); // 有效URL格式
      expect(firstResult.snippet).toBeTruthy();
    }
  });

  it('应该验证内容提取工具的调用参数', async () => {
    const client = new ProductionMCPClient('mock');
    
    const extractResult = await client.call('research-tools', 'extract_readable', {
      html: '<html><body><h1>测试标题</h1><p>测试内容</p></body></html>',
      url: 'https://example.com/test'
    });
    
    expect(extractResult.success).toBe(true);
    expect(extractResult.server).toBe('research-tools');
    expect(extractResult.tool).toBe('extract_readable');
    
    // 验证参数被正确传递
    expect(extractResult.data.params.html).toBeTruthy();
    expect(extractResult.data.params.url).toBe('https://example.com/test');
  });

  it('应该报告不可用的服务器', async () => {
    const client = new ProductionMCPClient('mock');
    
    const result = await client.call('nonexistent-server', 'some-tool', {});
    
    expect(result.success).toBe(false);
    expect(result.error).toContain('不可用或未配置');
    expect(client.isAvailable('nonexistent-server')).toBe(false);
  });

  it('应该在搜索失败时抛出错误而非返回假数据', async () => {
    // 创建一个总是失败的MCP客户端
    const failingClient: MCPClient = {
      call: vi.fn().mockResolvedValue({
        success: false,
        error: '搜索服务不可用',
        server: 'brave-search',
        tool: 'brave_web_search',
        timestamp: new Date().toISOString()
      }),
      isAvailable: vi.fn().mockReturnValue(true)
    };

    // 创建使用失败客户端的SearcherAgent
    const searcher = new SearcherAgent();
    
    // Mock掉callMCP方法，让它抛出错误
    const mockCallMCP = vi.spyOn(searcher as any, 'callMCP')
      .mockRejectedValue(new Error('MCP调用失败: 搜索服务不可用'));

    const plan = {
      searchQueries: ['测试查询']
    };
    const options = { langs: ['zh'] };

    // 应该抛出错误，而不是返回假数据
    await expect(searcher.execute({ plan, options }))
      .rejects
      .toThrow(/搜索API都不可用/);
    
    // 验证确实尝试了MCP调用
    expect(mockCallMCP).toHaveBeenCalled();
  });

  it('应该区分模拟响应和真实响应标识', async () => {
    const client = new ProductionMCPClient('mock');
    
    const result = await client.call('playwright', 'navigate', { 
      url: 'https://example.com' 
    });
    
    expect(result.success).toBe(true);
    expect(result.data.mocked).toBe(true); // 当前是模拟响应
    expect(result.data.note).toContain('模拟响应'); // 诚实标识
    
    // 验证为真实MCP集成做好了结构准备
    expect(result.data.server).toBe('playwright');
    expect(result.data.tool).toBe('navigate');
    expect(result.data.params.url).toBe('https://example.com');
  });

  it('应该验证可用服务器列表', () => {
    const client = new ProductionMCPClient('mock');
    
    // 验证已配置的服务器
    expect(client.isAvailable('playwright')).toBe(true);
    expect(client.isAvailable('research-tools')).toBe(true);
    expect(client.isAvailable('brave-search')).toBe(true);
    expect(client.isAvailable('serpapi')).toBe(true);
    expect(client.isAvailable('filesystem')).toBe(true);
    expect(client.isAvailable('qdrant')).toBe(true);
    
    // 验证未配置的服务器
    expect(client.isAvailable('unknown-server')).toBe(false);
  });
});