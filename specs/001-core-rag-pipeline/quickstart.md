# Quickstart Validation Guide: 企业研报智能问答系统

> 端到端验证指南。用于确认功能按预期工作。

## Prerequisites

- Python 3.12+ 已安装
- Node.js 20+ 已安装
- Ollama 已安装且服务运行中
- Ollama 模型已拉取：
  ```bash
  ollama pull qwen2.5:0.5b
  ollama pull bge-m3
  ```

## Setup

### Backend
```bash
cd backend
python -m venv .venv
.venv/Scripts/activate    # Windows
pip install -r requirements.txt
cp .env.example .env      # 编辑配置（通常无需修改）
uvicorn app.main:app --reload --port 8000
```

### Frontend
```bash
cd frontend
npm install
npm run dev               # 默认 http://localhost:5173
```

## Validation Scenarios

### Scenario 1: 研报上传与索引

1. 打开浏览器访问 `http://localhost:5173`
2. 导航到「研报管理」页面
3. 点击上传按钮，选择 `data/` 中的一份 PDF 研报
4. **预期结果**：研报出现在列表中，状态从 "处理中" 变为 "已完成"
5. 验证：列表显示文件名、页数、上传时间

### Scenario 2: 智能问答

1. 导航到「问答」页面（首页）
2. 在输入框中输入："宁德时代 2025 年营收预测是多少"
3. 点击发送或按 Enter
4. **预期结果**：
   - 10 秒内收到回答
   - 回答中标注了来源（研报名称 + 页码）
   - 来源引用可点击/查看原文片段

### Scenario 3: 无结果处理

1. 在问答页面输入："今天天气怎么样"
2. **预期结果**：系统回复"未找到相关信息"

### Scenario 4: 多轮对话

1. 提问后，继续追问："那净利润呢"
2. **预期结果**：系统能理解"那"指代宁德时代，返回净利润相关数据和来源

### Scenario 5: 参数调节

1. 在问答页面找到参数面板
2. 将 chunk_size 从 500 拖动到 300
3. 再次提问相同问题
4. **预期结果**：回答下方显示 "chunk_size: 300, threshold: 0.5"
5. 对比两次回答的引用段落是否有变化

### Scenario 6: 参数极限值

1. 将 similarity_threshold 拖动到 1.0
2. 提问任意问题
3. **预期结果**：系统回复"未找到相关信息"（阈值过高，无匹配结果）
4. 将阈值调回 0.5，恢复正常

### Scenario 7: 历史记录

1. 完成至少 2 轮问答对话
2. 导航到「历史记录」页面
3. **预期结果**：显示会话列表，包含首问摘要和时间
4. 点击某条会话
5. **预期结果**：还原完整对话上下文，可继续追问

### Scenario 8: 错误处理

1. 不选择文件，直接点击上传
2. **预期结果**：提示"请选择文件"
3. 上传一个非 PDF 文件（如 .txt）
4. **预期结果**：提示"仅支持 PDF 格式"

## API 直接验证（可选）

```bash
# 上传研报
curl -X POST http://localhost:8000/api/reports/upload \
  -F "file=@data/example.pdf"

# 获取研报列表
curl http://localhost:8000/api/reports

# 提问
curl -X POST http://localhost:8000/api/qa/ask \
  -H "Content-Type: application/json" \
  -d '{"session_id": null, "question": "宁德时代营收预测"}'

# 查看参数
curl http://localhost:8000/api/parameters

# 更新参数
curl -X PUT http://localhost:8000/api/parameters \
  -H "Content-Type: application/json" \
  -d '{"chunk_size": 300, "similarity_threshold": 0.7}'
```

## Expected Behaviors Summary

| 场景 | 条件 | 预期结果 |
|------|------|---------|
| 正常问答 | 研报已导入，问题相关 | ≤10s 返回带来源的答案 |
| 无关问题 | 研报已导入，问题不相关 | 回复"未找到相关信息" |
| 多轮对话 | 已有问答历史 | 正确理解追问 |
| 参数调节 | 修改 chunk_size/threshold | 下次查询使用新参数 |
| 空研报提问 | 未导入任何研报 | 提示先上传研报 |
| Ollama 断开 | Ollama 未运行 | 友好错误提示 |
