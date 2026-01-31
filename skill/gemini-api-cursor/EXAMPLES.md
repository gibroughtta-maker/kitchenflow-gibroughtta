# Gemini API Real-World Examples

This document contains complete, production-ready examples for common use cases.

## Table of Contents

- [Recipe Extraction](#recipe-extraction)
- [Inventory Analysis](#inventory-analysis)
- [Chatbot Implementation](#chatbot-implementation)
- [Document Processing](#document-processing)
- [Image Analysis Pipeline](#image-analysis-pipeline)

## Recipe Extraction

Complete example for extracting recipe information from images:

```typescript
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

interface Recipe {
  title: string;
  ingredients: Array<{
    name: string;
    amount: string;
    unit?: string;
  }>;
  steps: string[];
  prepTime?: number;
  cookTime?: number;
  servings?: number;
}

const ai = new GoogleGenAI({});

async function extractRecipeFromImage(imagePath: string): Promise<Recipe> {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { 
        text: `Extract recipe information from this image. 
Include title, ingredients with amounts, cooking steps, 
and timing information if available.` 
      },
      { 
        inlineData: { 
          mimeType: 'image/jpeg', 
          data: base64Image 
        } 
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          ingredients: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                amount: { type: 'string' },
                unit: { type: 'string' }
              },
              required: ['name', 'amount']
            }
          },
          steps: { 
            type: 'array', 
            items: { type: 'string' } 
          },
          prepTime: { type: 'number' },
          cookTime: { type: 'number' },
          servings: { type: 'number' }
        },
        required: ['title', 'ingredients', 'steps']
      }
    }
  });

  return JSON.parse(response.text);
}

// Usage
async function main() {
  try {
    const recipe = await extractRecipeFromImage('./recipe-photo.jpg');
    
    console.log(`Recipe: ${recipe.title}`);
    console.log(`\nIngredients:`);
    recipe.ingredients.forEach(ing => {
      console.log(`- ${ing.amount} ${ing.unit || ''} ${ing.name}`);
    });
    
    console.log(`\nSteps:`);
    recipe.steps.forEach((step, i) => {
      console.log(`${i + 1}. ${step}`);
    });
    
    if (recipe.prepTime) {
      console.log(`\nPrep time: ${recipe.prepTime} minutes`);
    }
    if (recipe.cookTime) {
      console.log(`Cook time: ${recipe.cookTime} minutes`);
    }
  } catch (error) {
    console.error('Error extracting recipe:', error);
  }
}

main();
```

## Inventory Analysis

Analyze inventory photos and track items:

```typescript
import { GoogleGenAI } from '@google/genai';

interface InventoryItem {
  name: string;
  quantity: number;
  unit: string;
  category: string;
  expiryDate?: string;
  location?: string;
}

interface InventoryAnalysis {
  items: InventoryItem[];
  totalItems: number;
  categories: string[];
  warnings: string[];
}

const ai = new GoogleGenAI({});

async function analyzeInventory(
  imageBase64: string
): Promise<InventoryAnalysis> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp', // Better for vision
    contents: [
      { 
        text: `Analyze this inventory photo. List all items with:
- Name and quantity
- Unit of measurement
- Category (produce, dairy, meat, pantry, etc.)
- Expiry date if visible
- Location/shelf if applicable

Also identify any warnings (low stock, expired items, etc.)` 
      },
      { 
        inlineData: { 
          mimeType: 'image/jpeg', 
          data: imageBase64 
        } 
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                quantity: { type: 'number' },
                unit: { type: 'string' },
                category: { type: 'string' },
                expiryDate: { type: 'string' },
                location: { type: 'string' }
              },
              required: ['name', 'quantity', 'unit', 'category']
            }
          },
          totalItems: { type: 'number' },
          categories: { 
            type: 'array', 
            items: { type: 'string' } 
          },
          warnings: { 
            type: 'array', 
            items: { type: 'string' } 
          }
        },
        required: ['items', 'totalItems', 'categories', 'warnings']
      }
    }
  });

  return JSON.parse(response.text);
}

// Usage with React
import { useState } from 'react';

function InventoryScanner() {
  const [analysis, setAnalysis] = useState<InventoryAnalysis | null>(null);
  const [loading, setLoading] = useState(false);

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setLoading(true);

    try {
      const base64 = await new Promise<string>((resolve) => {
        const reader = new FileReader();
        reader.onload = () => {
          const base64String = reader.result as string;
          resolve(base64String.split(',')[1]);
        };
        reader.readAsDataURL(file);
      });

      const result = await analyzeInventory(base64);
      setAnalysis(result);
    } catch (error) {
      console.error('Error analyzing inventory:', error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <input 
        type="file" 
        accept="image/*" 
        onChange={handleImageUpload}
        disabled={loading}
      />
      
      {loading && <p>Analyzing...</p>}
      
      {analysis && (
        <div>
          <h2>Inventory Analysis</h2>
          <p>Total items: {analysis.totalItems}</p>
          
          {analysis.warnings.length > 0 && (
            <div className="warnings">
              <h3>⚠️ Warnings</h3>
              <ul>
                {analysis.warnings.map((warning, i) => (
                  <li key={i}>{warning}</li>
                ))}
              </ul>
            </div>
          )}
          
          <h3>Items by Category</h3>
          {analysis.categories.map(category => (
            <div key={category}>
              <h4>{category}</h4>
              <ul>
                {analysis.items
                  .filter(item => item.category === category)
                  .map((item, i) => (
                    <li key={i}>
                      {item.name}: {item.quantity} {item.unit}
                      {item.expiryDate && ` (Expires: ${item.expiryDate})`}
                    </li>
                  ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
```

## Chatbot Implementation

Production-ready chatbot with context management:

```typescript
import { GoogleGenAI } from '@google/genai';

interface Message {
  role: 'user' | 'model';
  parts: Array<{ text: string }>;
}

class GeminiChatbot {
  private ai: GoogleGenAI;
  private chat: any;
  private systemPrompt: string;

  constructor(systemPrompt: string) {
    this.ai = new GoogleGenAI({});
    this.systemPrompt = systemPrompt;
    this.initializeChat();
  }

  private initializeChat() {
    this.chat = this.ai.models.startChat({
      model: 'gemini-2.5-flash',
      systemInstruction: this.systemPrompt,
      history: []
    });
  }

  async sendMessage(message: string): Promise<string> {
    try {
      const response = await this.chat.sendMessage(message);
      return response.text;
    } catch (error) {
      console.error('Error sending message:', error);
      throw error;
    }
  }

  async sendMessageStream(message: string) {
    return await this.chat.sendMessageStream(message);
  }

  async getHistory(): Promise<Message[]> {
    return await this.chat.getHistory();
  }

  async loadHistory(messages: Message[]) {
    this.chat = this.ai.models.startChat({
      model: 'gemini-2.5-flash',
      systemInstruction: this.systemPrompt,
      history: messages
    });
  }

  async clearHistory() {
    this.initializeChat();
  }

  async exportHistory(): Promise<string> {
    const history = await this.getHistory();
    return JSON.stringify(history, null, 2);
  }

  async importHistory(jsonHistory: string) {
    const history = JSON.parse(jsonHistory);
    await this.loadHistory(history);
  }
}

// Usage example
async function cookingAssistantExample() {
  const bot = new GeminiChatbot(`You are a helpful cooking assistant.
Rules:
- Provide clear, step-by-step instructions
- Suggest ingredient substitutions when asked
- Include cooking tips and techniques
- Be encouraging and supportive`);

  // Regular message
  const response1 = await bot.sendMessage('How do I make pasta carbonara?');
  console.log('Bot:', response1);

  // Follow-up with context
  const response2 = await bot.sendMessage('Can I use bacon instead of guanciale?');
  console.log('Bot:', response2);

  // Streaming response
  console.log('Bot: ');
  const stream = await bot.sendMessageStream('What wine pairs well with it?');
  for await (const chunk of stream) {
    process.stdout.write(chunk.text);
  }
  console.log('\n');

  // Export conversation
  const history = await bot.exportHistory();
  console.log('Conversation saved:', history);
}

// React component example
import { useState, useRef } from 'react';

function ChatInterface() {
  const [messages, setMessages] = useState<Array<{role: string; text: string}>>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const botRef = useRef<GeminiChatbot | null>(null);

  // Initialize bot on mount
  useState(() => {
    botRef.current = new GeminiChatbot('You are a helpful assistant.');
  });

  const sendMessage = async () => {
    if (!input.trim() || !botRef.current) return;

    const userMessage = input.trim();
    setInput('');
    setMessages(prev => [...prev, { role: 'user', text: userMessage }]);
    setLoading(true);

    try {
      // Stream response
      const stream = await botRef.current.sendMessageStream(userMessage);
      let botResponse = '';

      for await (const chunk of stream) {
        botResponse += chunk.text;
        setMessages(prev => {
          const newMessages = [...prev];
          const lastMessage = newMessages[newMessages.length - 1];
          
          if (lastMessage?.role === 'model') {
            lastMessage.text = botResponse;
          } else {
            newMessages.push({ role: 'model', text: botResponse });
          }
          
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { 
        role: 'model', 
        text: 'Sorry, I encountered an error.' 
      }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="chat-interface">
      <div className="messages">
        {messages.map((msg, i) => (
          <div key={i} className={`message ${msg.role}`}>
            <strong>{msg.role === 'user' ? 'You' : 'Bot'}:</strong>
            <p>{msg.text}</p>
          </div>
        ))}
        {loading && <div className="loading">Thinking...</div>}
      </div>
      
      <div className="input-area">
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyPress={(e) => e.key === 'Enter' && sendMessage()}
          placeholder="Type a message..."
          disabled={loading}
        />
        <button onClick={sendMessage} disabled={loading || !input.trim()}>
          Send
        </button>
      </div>
    </div>
  );
}
```

## Document Processing

Extract structured data from documents:

```typescript
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';

interface Invoice {
  invoiceNumber: string;
  date: string;
  vendor: {
    name: string;
    address: string;
    phone?: string;
  };
  customer: {
    name: string;
    address: string;
  };
  items: Array<{
    description: string;
    quantity: number;
    unitPrice: number;
    total: number;
  }>;
  subtotal: number;
  tax: number;
  total: number;
}

const ai = new GoogleGenAI({});

async function extractInvoiceData(imagePath: string): Promise<Invoice> {
  const imageBuffer = fs.readFileSync(imagePath);
  const base64Image = imageBuffer.toString('base64');

  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: [
      { 
        text: `Extract all information from this invoice. 
Include vendor details, customer details, line items, and totals.` 
      },
      { 
        inlineData: { 
          mimeType: 'image/jpeg', 
          data: base64Image 
        } 
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          invoiceNumber: { type: 'string' },
          date: { type: 'string' },
          vendor: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              address: { type: 'string' },
              phone: { type: 'string' }
            },
            required: ['name', 'address']
          },
          customer: {
            type: 'object',
            properties: {
              name: { type: 'string' },
              address: { type: 'string' }
            },
            required: ['name', 'address']
          },
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                description: { type: 'string' },
                quantity: { type: 'number' },
                unitPrice: { type: 'number' },
                total: { type: 'number' }
              },
              required: ['description', 'quantity', 'unitPrice', 'total']
            }
          },
          subtotal: { type: 'number' },
          tax: { type: 'number' },
          total: { type: 'number' }
        },
        required: ['invoiceNumber', 'date', 'vendor', 'customer', 'items', 'total']
      }
    }
  });

  return JSON.parse(response.text);
}

// Batch processing example
async function processInvoiceFolder(folderPath: string) {
  const files = fs.readdirSync(folderPath)
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i));

  const results = [];

  for (const file of files) {
    console.log(`Processing ${file}...`);
    try {
      const invoice = await extractInvoiceData(`${folderPath}/${file}`);
      results.push({ file, invoice, success: true });
    } catch (error) {
      console.error(`Error processing ${file}:`, error);
      results.push({ file, error: error.message, success: false });
    }
  }

  // Save results
  fs.writeFileSync(
    'invoice-results.json',
    JSON.stringify(results, null, 2)
  );

  console.log(`Processed ${results.length} invoices`);
  console.log(`Successful: ${results.filter(r => r.success).length}`);
  console.log(`Failed: ${results.filter(r => !r.success).length}`);
}
```

## Image Analysis Pipeline

Complete pipeline for analyzing and categorizing images:

```typescript
import { GoogleGenAI } from '@google/genai';
import fs from 'fs';
import path from 'path';

interface ImageAnalysis {
  description: string;
  objects: string[];
  colors: string[];
  scene: string;
  mood: string;
  tags: string[];
  suggestedCategory: string;
}

const ai = new GoogleGenAI({});

async function analyzeImage(imageBase64: string): Promise<ImageAnalysis> {
  const response = await ai.models.generateContent({
    model: 'gemini-2.0-flash-exp',
    contents: [
      { 
        text: `Analyze this image in detail. Provide:
- A comprehensive description
- List of objects/items visible
- Dominant colors
- Scene type (indoor/outdoor, kitchen, etc.)
- Overall mood/atmosphere
- Relevant tags for categorization
- Suggested category` 
      },
      { 
        inlineData: { 
          mimeType: 'image/jpeg', 
          data: imageBase64 
        } 
      }
    ],
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          description: { type: 'string' },
          objects: { type: 'array', items: { type: 'string' } },
          colors: { type: 'array', items: { type: 'string' } },
          scene: { type: 'string' },
          mood: { type: 'string' },
          tags: { type: 'array', items: { type: 'string' } },
          suggestedCategory: { type: 'string' }
        },
        required: ['description', 'objects', 'scene', 'tags', 'suggestedCategory']
      }
    }
  });

  return JSON.parse(response.text);
}

// Pipeline with file organization
async function processAndOrganizeImages(inputFolder: string, outputFolder: string) {
  const files = fs.readdirSync(inputFolder)
    .filter(f => f.match(/\.(jpg|jpeg|png)$/i));

  for (const file of files) {
    console.log(`Analyzing ${file}...`);
    
    try {
      const imagePath = path.join(inputFolder, file);
      const imageBuffer = fs.readFileSync(imagePath);
      const base64Image = imageBuffer.toString('base64');
      
      const analysis = await analyzeImage(base64Image);
      
      // Create category folder
      const categoryFolder = path.join(outputFolder, analysis.suggestedCategory);
      if (!fs.existsSync(categoryFolder)) {
        fs.mkdirSync(categoryFolder, { recursive: true });
      }
      
      // Copy file to category folder
      const newPath = path.join(categoryFolder, file);
      fs.copyFileSync(imagePath, newPath);
      
      // Save analysis metadata
      const metadataPath = path.join(categoryFolder, `${file}.json`);
      fs.writeFileSync(metadataPath, JSON.stringify(analysis, null, 2));
      
      console.log(`✓ ${file} → ${analysis.suggestedCategory}`);
    } catch (error) {
      console.error(`✗ Error processing ${file}:`, error);
    }
  }
}

// Usage
processAndOrganizeImages('./input-images', './organized-images');
```

## Quick Snippets

### Generate Recipe Suggestions

```typescript
async function suggestRecipes(availableIngredients: string[]) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Suggest 3 recipes using these ingredients: ${availableIngredients.join(', ')}`,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          recipes: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                description: { type: 'string' },
                difficulty: { type: 'string' },
                time: { type: 'number' }
              }
            }
          }
        }
      }
    }
  });
  
  return JSON.parse(response.text);
}
```

### Translate Recipe

```typescript
async function translateRecipe(recipe: Recipe, targetLanguage: string) {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: `Translate this recipe to ${targetLanguage}: ${JSON.stringify(recipe)}`,
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          title: { type: 'string' },
          ingredients: { type: 'array', items: { type: 'string' } },
          steps: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  });
  
  return JSON.parse(response.text);
}
```
