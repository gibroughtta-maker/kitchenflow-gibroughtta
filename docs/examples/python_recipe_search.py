#!/usr/bin/env python3
"""
Python 版本的菜谱搜索实现（参考）

此脚本演示如何使用 Python 实现相同的功能：
- Google Generative AI (Gemini)
- Google Search Grounding
- BeautifulSoup 抓取 Open Graph 图片

注意：KitchenFlow 实际使用的是 React Native (JavaScript) 版本
此脚本仅供学习和测试使用
"""

import os
import json
import re
from typing import Dict, Optional, List
import requests
from bs4 import BeautifulSoup
import google.generativeai as genai

# ====================
# 配置
# ====================

GEMINI_API_KEY = os.environ.get('GEMINI_API_KEY', 'your_api_key_here')
genai.configure(api_key=GEMINI_API_KEY)


# ====================
# 核心功能函数
# ====================

def search_recipe(dish_name: str) -> Dict:
    """
    使用 Google Search Grounding 搜索菜谱
    
    Args:
        dish_name: 菜品名称（如：宫保鸡丁）
    
    Returns:
        包含菜谱内容、来源链接、封面图的字典
    """
    print(f"🔍 正在搜索：{dish_name}")
    
    # 配置 Gemini 模型
    model = genai.GenerativeModel(
        model_name='gemini-2.5-flash',
        system_instruction=get_system_instruction()
    )
    
    # 启用 Google Search Grounding
    tools = [{'google_search': {}}]
    
    # 构建 prompt
    prompt = f"""请搜索并提供"{dish_name}"的完整菜谱，包括：
1. 菜品简介（起源、特点）
2. 完整食材清单（包含用量）
3. 详细烹饪步骤（每步都要具体）
4. 烹饪小贴士

请基于搜索到的真实菜谱内容，以标准 Markdown 格式输出。"""
    
    # 发送请求
    try:
        response = model.generate_content(
            prompt,
            tools=tools,
            generation_config={
                'temperature': 0.7,
                'top_k': 40,
                'top_p': 0.95,
                'max_output_tokens': 2048,
            }
        )
        
        # 提取生成的内容
        content = response.text
        
        # 提取来源 URL
        source_url = None
        if hasattr(response, 'grounding_metadata'):
            chunks = response.grounding_metadata.grounding_chunks
            if chunks:
                first_chunk = chunks[0]
                if hasattr(first_chunk, 'web'):
                    source_url = first_chunk.web.uri
        
        # 抓取封面图
        image_url = None
        if source_url:
            print(f"🌐 来源链接：{source_url}")
            image_url = get_og_image(source_url)
        
        # 提取结构化信息
        structured_info = extract_structured_info(content, dish_name)
        
        result = {
            'title': dish_name,
            'content': content,
            'source_url': source_url,
            'image_url': image_url,
            **structured_info
        }
        
        print("✅ 搜索完成！")
        return result
        
    except Exception as e:
        print(f"❌ 错误：{e}")
        raise


def get_system_instruction() -> str:
    """
    返回 System Instruction（专业烹饪百科全书风格）
    """
    return """你是一个专业的烹饪百科全书。

风格要求：
- 严谨、简洁、客观
- 不使用 Emoji
- 不添加无关废话
- 基于搜索结果，还原真实菜谱做法

输出格式（标准 Markdown）：
# 菜名

## 简介
[简短介绍菜品的起源、特点]

## 食材
| 食材 | 用量 | 备注 |
|------|------|------|
| ... | ... | ... |

## 详细步骤
1. [第一步骤的详细描述]
2. [第二步骤的详细描述]
...

## 小贴士
- [烹饪技巧或注意事项]"""


def get_og_image(url: str) -> Optional[str]:
    """
    从网页提取 Open Graph 图片
    
    Args:
        url: 网页链接
    
    Returns:
        图片链接或 None
    """
    print(f"📸 正在提取封面图...")
    
    try:
        # 发送 HTTP 请求（伪装浏览器）
        headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        }
        response = requests.get(url, headers=headers, timeout=10)
        
        if response.status_code != 200:
            print(f"⚠️ 网页请求失败：{response.status_code}")
            return None
        
        # 解析 HTML
        soup = BeautifulSoup(response.text, 'html.parser')
        
        # 尝试提取 og:image
        og_image = soup.find('meta', property='og:image')
        if og_image and og_image.get('content'):
            print(f"✅ 找到 og:image")
            return og_image['content']
        
        # 尝试提取 twitter:image
        twitter_image = soup.find('meta', {'name': 'twitter:image'})
        if twitter_image and twitter_image.get('content'):
            print(f"✅ 找到 twitter:image")
            return twitter_image['content']
        
        # 尝试提取第一个大图片
        img_tag = soup.find('img', src=True)
        if img_tag:
            src = img_tag['src']
            # 过滤小图标
            if 'logo' not in src.lower() and 'icon' not in src.lower():
                print(f"✅ 找到图片")
                return src
        
        print("⚠️ 未找到封面图")
        return None
        
    except Exception as e:
        print(f"⚠️ 图片提取失败：{e}")
        return None


def extract_structured_info(content: str, dish_name: str) -> Dict:
    """
    从 Markdown 内容中提取结构化信息
    
    Args:
        content: Markdown 格式的菜谱内容
        dish_name: 菜品名称
    
    Returns:
        包含 cuisine, difficulty, estimatedTime, ingredients 的字典
    """
    # 菜系判断
    cuisine = 'Chinese'  # 默认
    if '川菜' in content or '四川' in content:
        cuisine = 'Sichuan'
    elif '粤菜' in content or '广东' in content:
        cuisine = 'Cantonese'
    elif '湘菜' in content or '湖南' in content:
        cuisine = 'Hunan'
    elif '意大利' in dish_name or 'Italian' in content:
        cuisine = 'Italian'
    elif '日本' in dish_name or 'Japanese' in content:
        cuisine = 'Japanese'
    
    # 难度判断（根据步骤数量）
    steps = re.findall(r'^\d+\.\s', content, re.MULTILINE)
    step_count = len(steps)
    if step_count <= 5:
        difficulty = 'easy'
    elif step_count <= 10:
        difficulty = 'medium'
    else:
        difficulty = 'hard'
    
    # 时间提取
    estimated_time = '30-45 minutes'  # 默认
    time_match = re.search(r'(\d+)[-~](\d+)\s*(分钟|minutes)', content, re.IGNORECASE)
    if time_match:
        estimated_time = f"{time_match.group(1)}-{time_match.group(2)} minutes"
    
    # 食材提取（从表格中）
    ingredients = []
    ingredient_pattern = r'\|\s*([^|]+?)\s*\|\s*([^|]+?)\s*\|'
    matches = re.findall(ingredient_pattern, content)
    
    for name, amount in matches:
        name = name.strip()
        amount = amount.strip()
        
        # 跳过表头
        if name in ['食材', '---', 'Ingredient']:
            continue
        
        # 解析数量和单位
        quantity_match = re.search(r'(\d+\.?\d*)\s*(\S+)', amount)
        if quantity_match:
            quantity = float(quantity_match.group(1))
            unit = quantity_match.group(2)
        else:
            quantity = 1
            unit = '份'
        
        ingredients.append({
            'name': name,
            'quantity': quantity,
            'unit': unit,
            'essential': True
        })
    
    return {
        'cuisine': cuisine,
        'difficulty': difficulty,
        'estimated_time': estimated_time,
        'ingredients': ingredients
    }


# ====================
# 测试和使用示例
# ====================

def print_recipe(recipe: Dict):
    """
    美化打印菜谱
    """
    print("\n" + "="*60)
    print(f"📖 {recipe['title']}")
    print("="*60)
    
    print(f"\n🌏 菜系：{recipe['cuisine']}")
    print(f"⏱️  时间：{recipe['estimated_time']}")
    print(f"⭐ 难度：{recipe['difficulty']}")
    
    if recipe['source_url']:
        print(f"\n🔗 来源：{recipe['source_url']}")
    
    if recipe['image_url']:
        print(f"📸 封面图：{recipe['image_url']}")
    
    if recipe['ingredients']:
        print(f"\n🥘 食材清单（{len(recipe['ingredients'])} 种）：")
        for ing in recipe['ingredients']:
            print(f"  • {ing['name']}: {ing['quantity']} {ing['unit']}")
    
    print("\n📝 菜谱正文：")
    print("-" * 60)
    print(recipe['content'])
    print("-" * 60)


def save_recipe_to_file(recipe: Dict, filename: str = None):
    """
    将菜谱保存到文件
    """
    if not filename:
        # 使用菜名作为文件名（移除特殊字符）
        safe_name = re.sub(r'[^\w\s-]', '', recipe['title']).strip().replace(' ', '_')
        filename = f"recipe_{safe_name}.json"
    
    with open(filename, 'w', encoding='utf-8') as f:
        json.dump(recipe, f, ensure_ascii=False, indent=2)
    
    print(f"\n💾 菜谱已保存到：{filename}")


def main():
    """
    主函数 - 演示使用
    """
    # 测试示例
    test_dishes = [
        '宫保鸡丁',
        '意大利肉酱面',
        '日式炸猪排',
        '麻婆豆腐'
    ]
    
    print("🍳 KitchenFlow Recipe Search - Python Demo")
    print("=" * 60)
    
    # 让用户选择
    print("\n请选择要搜索的菜品：")
    for i, dish in enumerate(test_dishes, 1):
        print(f"{i}. {dish}")
    print("0. 自定义输入")
    
    try:
        choice = int(input("\n请输入选项（0-4）："))
        
        if choice == 0:
            dish_name = input("请输入菜品名称：")
        elif 1 <= choice <= len(test_dishes):
            dish_name = test_dishes[choice - 1]
        else:
            print("无效选项")
            return
        
        # 执行搜索
        recipe = search_recipe(dish_name)
        
        # 打印结果
        print_recipe(recipe)
        
        # 询问是否保存
        save = input("\n是否保存到文件？(y/n): ")
        if save.lower() == 'y':
            save_recipe_to_file(recipe)
        
    except KeyboardInterrupt:
        print("\n\n👋 已取消")
    except Exception as e:
        print(f"\n❌ 发生错误：{e}")


if __name__ == '__main__':
    main()
