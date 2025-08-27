export abstract class Agent {
  abstract name: string;
  abstract description: string;
  
  abstract execute(input: any): Promise<any>;
  
  protected log(message: string): void {
    console.log(`[${this.name}] ${message}`);
  }
  
  protected async saveProgress(data: any, filename?: string): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const path = await import('path');
      
      // 确保工作区目录存在
      const workspaceDir = path.join(process.cwd(), 'workspace', 'runs');
      await fs.mkdir(workspaceDir, { recursive: true });
      
      // 生成唯一文件名
      const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
      const finalFilename = filename || `${this.name.toLowerCase()}-progress-${timestamp}.json`;
      const filePath = path.join(workspaceDir, finalFilename);
      
      // 保存数据，包含元数据
      const progressData = {
        agent: this.name,
        timestamp: new Date().toISOString(),
        data,
        filename: finalFilename
      };
      
      await fs.writeFile(filePath, JSON.stringify(progressData, null, 2), 'utf-8');
      this.log(`保存进度: ${filePath}`);
    } catch (error) {
      this.log(`保存进度失败: ${error}`);
    }
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