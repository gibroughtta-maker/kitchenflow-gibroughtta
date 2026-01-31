# 🏗️ 架构方案对比：Python 后端 vs React Native 前端

## 方案对比总览

| 维度 | 方案 A：Python 后端 | 方案 B：React Native 前端（已采用） |
|------|-------------------|-----------------------------------|
| **实现语言** | Python | TypeScript/JavaScript |
| **AI SDK** | `google-generativeai` | REST API + `fetch` |
| **HTML 解析** | BeautifulSoup | 正则表达式 |
| **部署方式** | Flask/FastAPI 服务器 | Serverless（前端直调） |
| **复杂度** | 高 | 低 |
| **成本** | 需要服务器 | 无额外成本 |
| **维护难度** | 高 | 低 |
| **响应速度** | 较慢（多一跳） | 快（直连 API） |
| **推荐度** | ⚠️ 不推荐 | ✅ 推荐 |

---

## 方案 A：Python 后端架构

### 架构图

```
┌─────────────────┐
│  React Native   │
│   前端应用      │
└────────┬────────┘
         │ HTTP
         ↓
┌─────────────────┐
│  Python 后端    │
│ Flask/FastAPI   │
├─────────────────┤
│ • BeautifulSoup │
│ • google-       │
│   generativeai  │
└────────┬────────┘
         │
         ├─→ Gemini API
         └─→ Recipe Websites
```

### 代码示例

```python
# Python 后端 API
@app.post("/api/search-recipe")
async def search_recipe(dish_name: str):
    # 1. 调用 Gemini API (Google Search Grounding)
    model = genai.GenerativeModel('gemini-2.5-flash')
    response = model.generate_content(
        f"搜索 {dish_name} 的菜谱",
        tools=[{'google_search': {}}]
    )
    
    # 2. 提取来源 URL
    source_url = response.grounding_metadata.grounding_chunks[0].web.uri
    
    # 3. 使用 BeautifulSoup 抓取图片
    html = requests.get(source_url).text
    soup = BeautifulSoup(html, 'html.parser')
    og_image = soup.find('meta', property='og:image')['content']
    
    # 4. 返回结果
    return {
        "content": response.text,
        "sourceUrl": source_url,
        "imageUrl": og_image
    }
```

```typescript
// React Native 前端调用
const searchRecipe = async (dishName: string) => {
  const response = await fetch('https://your-server.com/api/search-recipe', {
    method: 'POST',
    body: JSON.stringify({ dish_name: dishName })
  });
  return await response.json();
};
```

### 优点

- ✅ Python 生态丰富（BeautifulSoup、lxml 等）
- ✅ HTML 解析更强大
- ✅ 代码更简洁（SDK 封装好）

### 缺点

- ❌ 需要部署 Python 服务器（成本增加）
- ❌ 多一层网络请求（响应慢）
- ❌ 需要维护后端代码
- ❌ CORS 跨域问题
- ❌ 服务器监控和运维
- ❌ 扩展性问题（高并发需要负载均衡）

### 成本估算

| 项目 | 月成本（USD） |
|------|--------------|
| 云服务器（AWS/GCP） | $50-100 |
| 负载均衡器 | $20-40 |
| 监控服务 | $10-20 |
| 域名 & SSL | $5-10 |
| **总计** | **$85-170** |

---

## 方案 B：React Native 前端架构（已采用）

### 架构图

```
┌─────────────────┐
│  React Native   │
│   前端应用      │
├─────────────────┤
│ recipeSearch    │
│   Service       │
│ • fetch API     │
│ • 正则表达式    │
└────────┬────────┘
         │
         ├─→ Gemini API (直连)
         └─→ Recipe Websites (直连)
```

### 代码示例

```typescript
// React Native 前端直接调用
export async function searchRecipeWithGrounding(
  dishName: string,
  apiKey: string
): Promise<RecipeSearchResult> {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`;
  
  // 1. 调用 Gemini API (Google Search Grounding)
  const response = await fetch(url, {
    method: 'POST',
    body: JSON.stringify({
      contents: [{ parts: [{ text: `搜索 ${dishName} 的菜谱` }] }],
      tools: [{ googleSearch: {} }]
    })
  });
  
  const data = await response.json();
  
  // 2. 提取来源 URL
  const sourceUrl = data.candidates?.[0]?.groundingMetadata?.groundingChunks?.[0]?.web?.uri;
  
  // 3. 使用正则提取图片
  const html = await fetch(sourceUrl).then(r => r.text());
  const imageUrl = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i)?.[1];
  
  // 4. 返回结果
  return {
    title: dishName,
    content: data.candidates[0].content.parts[0].text,
    sourceUrl,
    imageUrl
  };
}
```

### 优点

- ✅ 无需后端服务器（零成本）
- ✅ 响应速度快（直连 API）
- ✅ 架构简单（易维护）
- ✅ 无 CORS 问题
- ✅ 自动扩展（客户端调用）
- ✅ 符合现有架构

### 缺点

- ⚠️ HTML 解析能力较弱（正则表达式）
- ⚠️ API Key 暴露风险（需要环境变量管理）
- ⚠️ 无法统一限流（每个客户端独立调用）

### 成本估算

| 项目 | 月成本（USD） |
|------|--------------|
| Gemini API 调用 | $0-10（免费额度内） |
| **总计** | **$0-10** |

---

## 详细技术对比

### 1. HTML 解析能力

#### Python (BeautifulSoup)

```python
# 强大的 HTML 解析
soup = BeautifulSoup(html, 'html.parser')

# CSS 选择器
og_image = soup.select_one('meta[property="og:image"]')['content']

# 复杂查询
images = soup.find_all('img', class_='recipe-image', src=True)

# 处理嵌套结构
recipe_div = soup.find('div', class_='recipe')
ingredients = recipe_div.find_all('li')
```

#### React Native (正则表达式)

```typescript
// 简单的正则提取
const ogImageMatch = html.match(
  /<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i
);
const imageUrl = ogImageMatch?.[1];

// 优点：轻量、快速
// 缺点：无法处理复杂结构
```

**结论**：对于 Open Graph 提取，正则表达式完全够用。

---

### 2. AI SDK 调用

#### Python SDK

```python
# 封装好的 SDK
model = genai.GenerativeModel('gemini-2.5-flash')
response = model.generate_content(
    prompt,
    tools=[{'google_search': {}}],
    generation_config={'temperature': 0.7}
)

# 直接访问属性
content = response.text
source_url = response.grounding_metadata.grounding_chunks[0].web.uri
```

**优点**：
- 类型提示完善
- 错误处理封装好
- 代码更简洁

#### REST API (JavaScript)

```typescript
// 手动构建请求
const response = await fetch(url, {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({
    contents: [...],
    tools: [{ googleSearch: {} }],
    generationConfig: { temperature: 0.7 }
  })
});

const data = await response.json();
const content = data.candidates?.[0]?.content?.parts?.[0]?.text;
const sourceUrl = data.candidates?.[0]?.groundingMetadata?.groundingChunks?.[0]?.web?.uri;
```

**缺点**：
- 需要手动解析 JSON
- 类型安全较弱
- 错误处理需要自己写

**优点**：
- 无需额外依赖
- 更灵活的控制

**结论**：虽然 Python SDK 更方便，但 REST API 的灵活性更适合前端。

---

### 3. 部署和运维

#### Python 后端部署流程

```bash
# 1. 准备服务器
ssh user@server

# 2. 安装依赖
pip install -r requirements.txt

# 3. 配置环境变量
export GEMINI_API_KEY=xxx

# 4. 启动服务
gunicorn app:app --workers 4 --bind 0.0.0.0:8000

# 5. 配置 Nginx 反向代理
sudo nano /etc/nginx/sites-available/recipe-api

# 6. 配置 SSL 证书
sudo certbot --nginx -d api.kitchenflow.com

# 7. 设置自动重启
sudo systemctl enable recipe-api

# 8. 配置监控（Prometheus/Grafana）
# 9. 设置日志轮转
# 10. 配置备份
```

**维护工作**：
- 每周检查日志
- 每月安全更新
- 随时处理宕机
- 定期性能优化

#### React Native 前端"部署"

```bash
# 无需部署！
# 只需在 App 更新时发布新版本
npm run build
eas update
```

**维护工作**：
- 无

---

### 4. 错误处理对比

#### Python 后端

```python
try:
    response = model.generate_content(...)
except Exception as e:
    # 后端错误：用户看不到详细信息
    logger.error(f"Gemini API failed: {e}")
    return {"error": "Internal server error"}, 500
```

**问题**：用户无法得知具体错误原因（是 API 问题？网络问题？）

#### React Native 前端

```typescript
try {
  const recipe = await searchRecipeWithGrounding(...);
} catch (error) {
  // 前端可以看到详细错误
  if (error.message.includes('404')) {
    Alert.alert('模型不可用', '请联系管理员更新模型版本');
  } else if (error.message.includes('timeout')) {
    Alert.alert('网络超时', '请检查网络连接后重试');
  }
}
```

**优势**：用户可以得到更精准的错误提示。

---

## 实际使用场景分析

### 场景 1：用户搜索"宫保鸡丁"

#### 方案 A（Python 后端）

```
用户点击搜索
    ↓ 50ms
React Native 发送请求到后端
    ↓ 200ms（网络延迟）
Python 后端收到请求
    ↓ 3000ms（调用 Gemini API）
Python 后端收到 Gemini 响应
    ↓ 500ms（BeautifulSoup 抓取图片）
Python 后端返回结果
    ↓ 200ms（网络延迟）
React Native 收到响应
    ↓ 50ms（UI 渲染）
用户看到结果

总耗时：~4000ms
```

#### 方案 B（React Native 前端）

```
用户点击搜索
    ↓ 50ms
React Native 直接调用 Gemini API
    ↓ 3000ms（调用 Gemini API）
React Native 收到响应
    ↓ 500ms（正则提取图片）
React Native 渲染 UI
    ↓ 50ms
用户看到结果

总耗时：~3600ms（快 10%）
```

---

### 场景 2：高并发（1000 用户同时搜索）

#### 方案 A（Python 后端）

```
1000 请求同时到达后端
    ↓
单台服务器处理能力：~50 QPS
    ↓
需要 20 秒处理完所有请求
    ↓
排队的用户体验差
    ↓
需要增加服务器（成本上升）
```

#### 方案 B（React Native 前端）

```
1000 请求直接发送到 Gemini API
    ↓
Gemini API 自动扩展
    ↓
所有用户几乎同时收到响应
    ↓
无需额外成本
```

---

## 决策矩阵

### 何时选择方案 A（Python 后端）

- ✅ 需要复杂的 HTML 解析
- ✅ 需要统一的访问控制和限流
- ✅ 需要缓存和数据库集成
- ✅ 需要定时任务（批量预加载）
- ✅ 团队有 Python 经验

### 何时选择方案 B（React Native 前端）

- ✅ 追求简单架构
- ✅ 成本敏感
- ✅ 快速迭代
- ✅ 无复杂 HTML 解析需求
- ✅ 团队以前端为主

---

## 最终决策

### KitchenFlow 选择方案 B 的原因

1. **成本**：零后端成本 vs 每月 $100+
2. **架构**：符合现有 Serverless 架构
3. **速度**：减少一跳网络请求
4. **维护**：无需运维后端服务器
5. **需求**：Open Graph 提取用正则表达式足够

### 妥协方案

如果未来确实需要 Python 后端的能力，可以：
1. 使用云函数（AWS Lambda / Google Cloud Functions）
2. 仅在必要时调用（如：复杂 HTML 解析）
3. 保持前端直调为主，后端为辅

---

## 附录：Python 示例代码

完整的 Python 实现见：`docs/examples/python_recipe_search.py`

**安装依赖**：
```bash
pip install -r docs/examples/requirements.txt
```

**运行测试**：
```bash
export GEMINI_API_KEY=your_key
python docs/examples/python_recipe_search.py
```

---

## 总结

| 方案 | 适用场景 | KitchenFlow 适配度 |
|------|----------|-------------------|
| Python 后端 | 复杂企业应用 | ⭐⭐☆☆☆ |
| React Native 前端 | 简单 Serverless 应用 | ⭐⭐⭐⭐⭐ |

**最终结论**：React Native 前端方案完全满足 KitchenFlow 需求，且具有更低的成本和复杂度。

---

**文档版本**：v1.0  
**最后更新**：2026-01-21
