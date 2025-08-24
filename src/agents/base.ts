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
    // TODO: 实现MCP工具调用
    this.log(`调用MCP: ${server}.${tool}`);
    throw new Error('MCP调用未实现');
  }
}