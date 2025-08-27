/**
 * 搜索相关性验证算法
 * 用于真正验证业务逻辑而非数据结构
 */

export interface SearchResult {
  title: string;
  snippet?: string;
  url: string;
  relevance_score?: number;
}

/**
 * 计算搜索结果与查询的相关性分数 (0-1)
 * 这是真正的业务逻辑验证
 */
export function calculateRelevance(result: SearchResult, query: string): number {
  // 输入验证
  if (!result || !query || typeof query !== 'string' || query.trim().length === 0) {
    return 0;
  }

  // 基本结果验证
  if (!result.title && !result.snippet && !result.url) {
    return 0;
  }

  const queryTerms = extractKeyTerms(query);
  if (queryTerms.length === 0) {
    return 0;
  }
  
  // 权重配置
  const weights = {
    title: 0.5,
    snippet: 0.3,
    url: 0.2
  };
  
  // 计算各部分的匹配分数
  const titleScore = calculateTermMatchScore(result.title || '', queryTerms);
  const snippetScore = calculateTermMatchScore(result.snippet || '', queryTerms);
  const urlScore = calculateTermMatchScore(result.url || '', queryTerms);
  
  // 加权总分
  const totalScore = (
    titleScore * weights.title +
    snippetScore * weights.snippet +
    urlScore * weights.url
  );
  
  // 确保返回值在有效范围内
  return Math.max(0, Math.min(totalScore, 1.0));
}

/**
 * 提取查询中的关键词
 */
export function extractKeyTerms(query: string): string[] {
  // 更精准的停用词列表
  const stopWords = new Set([
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一', '一个', '与',
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for', 'of', 'with', 'by'
    // 移除了"技术"等实际有意义的词
  ]);
  
  return query
    .toLowerCase()
    .replace(/[^\w\u4e00-\u9fff\s]/g, ' ') // 保留中英文字符
    .split(/\s+/)
    .filter(term => term.length > 1 && !stopWords.has(term))
    .slice(0, 15); // 增加关键词数量限制
}

/**
 * 计算文本中关键词的匹配分数
 */
export function calculateTermMatchScore(text: string, terms: string[]): number {
  if (!text || terms.length === 0) return 0;
  
  const lowerText = text.toLowerCase();
  let matchedTerms = 0;
  let totalMatches = 0;
  
  for (const term of terms) {
    if (lowerText.includes(term)) {
      matchedTerms++;
      
      // 计算词频（TF）
      const regex = new RegExp(term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), 'gi');
      const matches = lowerText.match(regex);
      totalMatches += matches ? matches.length : 0;
    }
  }
  
  // 改进的匹配算法
  const coverageScore = matchedTerms / terms.length; // 关键词覆盖率
  const frequencyScore = Math.min(totalMatches / terms.length, 3) / 3; // 增加词频权重
  
  // 给覆盖率更高的权重
  return (coverageScore * 0.8) + (frequencyScore * 0.2);
}

/**
 * 验证搜索结果质量
 * 这是业务逻辑验证，而不是数据结构验证
 */
export function validateSearchQuality(results: SearchResult[], query: string): {
  isValid: boolean;
  avgRelevance: number;
  issues: string[];
} {
  if (!results || results.length === 0) {
    return {
      isValid: false,
      avgRelevance: 0,
      issues: ['没有搜索结果']
    };
  }
  
  const issues: string[] = [];
  let totalRelevance = 0;
  
  // 计算每个结果的相关性
  const relevanceScores = results.map((result, index) => {
    const relevance = calculateRelevance(result, query);
    totalRelevance += relevance;
    
    // 检查质量问题
    if (relevance < 0.2) {
      issues.push(`结果${index + 1}相关性过低 (${(relevance * 100).toFixed(1)}%): ${result.title}`);
    }
    
    if (!result.title || result.title.length < 5) {
      issues.push(`结果${index + 1}标题过短或缺失`);
    }
    
    if (result.url?.includes('example.com') && !result.url?.includes('test') && !result.url?.includes('docs')) {
      issues.push(`结果${index + 1}使用了假的example.com域名`);
    }
    
    return relevance;
  });
  
  const avgRelevance = totalRelevance / results.length;
  
  // 整体质量检查
  if (avgRelevance < 0.3) {
    issues.push(`整体相关性过低 (${(avgRelevance * 100).toFixed(1)}%)`);
  }
  
  // 检查结果多样性（避免重复）
  const uniqueTitles = new Set(results.map(r => r.title));
  if (uniqueTitles.size < results.length * 0.8) {
    issues.push('搜索结果重复度过高');
  }
  
  return {
    isValid: issues.length === 0,
    avgRelevance,
    issues
  };
}

/**
 * 验证搜索结果排序是否合理
 */
export function validateSearchRanking(results: SearchResult[], query: string): {
  isValid: boolean;
  issues: string[];
} {
  if (results.length < 2) {
    return { isValid: true, issues: [] };
  }
  
  const issues: string[] = [];
  
  // 计算相关性分数
  const relevanceScores = results.map(result => calculateRelevance(result, query));
  
  // 检查是否按相关性降序排列（允许10%的容错）
  for (let i = 1; i < relevanceScores.length; i++) {
    const prevScore = relevanceScores[i - 1];
    const currentScore = relevanceScores[i];
    
    if (currentScore > prevScore * 1.1) { // 10%容错
      issues.push(`排序不合理: 结果${i + 1}的相关性(${(currentScore * 100).toFixed(1)}%)高于结果${i}的相关性(${(prevScore * 100).toFixed(1)}%)`);
    }
  }
  
  return {
    isValid: issues.length === 0,
    issues
  };
}