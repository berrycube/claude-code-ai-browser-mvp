export abstract class Agent {
  abstract name: string;
  abstract description: string;
  
  abstract execute(input: any): Promise<any>;
  
  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }
  
  protected async saveProgress(data: any, filename?: string): Promise<void> {
    // TODO: 实现进度保存到workspace/runs/
    this.log(`保存进度: ${filename || 'progress.json'}`);
  }
  
  protected async callMCP(server: string, tool: string, params: any): Promise<any> {
    this.log(`调用MCP: ${server}.${tool}`);
    
    // 动态创建MCP客户端以支持运行时环境变量变更
    const { createMCPClient } = await import('../mcp/client.js');
    const client = createMCPClient();
    const result = await client.call(server, tool, params);
    
    if (!result.success) {
      throw new Error(`MCP调用失败: ${result.error}`);
    }
    
    return result.data;
  }
}