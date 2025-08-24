#!/bin/bash

# 测试诚实的MVP实现
echo "🧪 测试诚实的MVP实现"
echo "=================================="

# 颜色定义
RED='\033[0;31m'
GREEN='\033[0;32m'
YELLOW='\033[1;33m'
NC='\033[0m' # No Color

# 测试1: 对比分析
echo -e "\n${YELLOW}测试1: 对比原始实现与诚实MVP${NC}"
echo "-----------------------------------"
pnpm run research:compare

# 测试2: 查看工作流指标
echo -e "\n${YELLOW}测试2: 查看工作流指标${NC}"
echo "-----------------------------------"
pnpm run research:metrics

# 测试3: 执行简单研究（诚实版本）
echo -e "\n${YELLOW}测试3: 执行研究工作流（诚实MVP）${NC}"
echo "-----------------------------------"
pnpm run research:honest "AI发展趋势2024" -- --langs zh --depth 1 --max-sources 3 --debug

# 测试4: 对比原始版本（如果需要）
echo -e "\n${YELLOW}测试4: 可选 - 运行原始版本对比${NC}"
echo "-----------------------------------"
echo "运行: pnpm run research \"AI发展趋势2024\" -- --langs zh --depth 1"
echo "(包含模拟的Browser和Extractor代理)"

# 总结
echo -e "\n${GREEN}✅ 测试完成！${NC}"
echo "=================================="
echo "关键差异："
echo "  • 诚实MVP: 3步流程，100%真实功能"
echo "  • 原始版本: 5步流程，大量模拟组件"
echo ""
echo "下一步："
echo "  1. 验证生成的报告质量"
echo "  2. 检查workspace/runs/目录的输出"
echo "  3. 根据实际效果决定是否需要代理抽象"