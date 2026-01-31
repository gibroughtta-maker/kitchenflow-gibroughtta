---
name: gemini-api-cursor
description: Official Google Gemini API integration optimized for Cursor IDE development. Use when implementing Gemini API in TypeScript/JavaScript projects, especially for: text generation, vision/multimodal inputs, function calling, structured JSON outputs, streaming responses, or chat applications. Ensures code follows @google/genai SDK patterns and avoids deprecated libraries.
---

# Gemini API Integration Guide (Cursor-Optimized)

## Quick Reference

**SDK:** `@google/genai` (2025+, unified for Developer API & Vertex AI)  
**Install:** `npm install @google/genai`  
**Init:** `const ai = new GoogleGenAI({});` (auto-reads GEMINI_API_KEY)  
**Docs:** https://googleapis.github.io/js-genai/

## Critical: SDK Version

**ALWAYS use `@google/genai`** - Never use deprecated `@google/generative-ai` (EOL Nov 2025)

```typescript
// ✅ CORRECT
import { GoogleGenAI } from '@google/genai';

// ❌ WRONG - Deprecated
import { GoogleGenerativeAI } from '@google/generative-ai';
```

## Models (Jan 2026)

| Task | Model | Use Case |
|------|-------|----------|
| **Default** | `gemini-2.5-flash` | General text/multimodal |
| **Reasoning** | `gemini-2.0-flash-exp` | Complex logic, coding |
| **Vision** | `gemini-2.0-flash-exp` | Image analysis |
| **Speed** | `gemini-2.5-flash-lite` | High-volume, low-latency |

> Check [official docs](https://googleapis.github.io/js-genai/) for latest models

## Essential Patterns

### 1. Basic Setup

```typescript
import { GoogleGenAI } from '@google/genai';

// Best: Auto-reads GEMINI_API_KEY env variable
const ai = new GoogleGenAI({});

// Generate content
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Explain quantum computing in simple terms'
});

console.log(response.text);
```

**Environment setup:**
```bash
# .env file
GEMINI_API_KEY=your-api-key-here
```

### 2. Streaming (Better UX)

```typescript
const response = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: 'Write a short story about robots'
});

for await (const chunk of response) {
  process.stdout.write(chunk.text);
}
```

**React streaming:**
```typescript
const [output, setOutput] = useState('');

const stream = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: prompt
});

for await (const chunk of stream) {
  setOutput(prev => prev + chunk.text);
}
```

### 3. Vision/Multimodal

```typescript
import fs from 'fs';

const imageBuffer = fs.readFileSync('./image.jpg');
const base64Image = imageBuffer.toString('base64');

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    { text: 'Describe this image in detail' },
    { 
      inlineData: { 
        mimeType: 'image/jpeg', 
        data: base64Image 
      } 
    }
  ]
});
```

**Browser image upload:**
```typescript
const handleImageUpload = async (file: File) => {
  const base64 = await new Promise<string>((resolve) => {
    const reader = new FileReader();
    reader.onload = () => {
      const base64String = reader.result as string;
      resolve(base64String.split(',')[1]); // Remove prefix
    };
    reader.readAsDataURL(file);
  });

  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { text: 'What objects are in this image?' },
      { inlineData: { mimeType: file.type, data: base64 } }
    ]
  });
};
```

### 4. Structured JSON Output

**Always use `responseSchema` for guaranteed valid JSON:**

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Extract items: Milk 2L, Bread 1 loaf, Eggs 12ct',
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
              unit: { type: 'string' }
            },
            required: ['name', 'quantity']
          }
        }
      },
      required: ['items']
    }
  }
});

const data = JSON.parse(response.text);
```

**TypeScript type safety:**
```typescript
interface Item {
  name: string;
  quantity: number;
  unit?: string;
}

interface ShoppingList {
  items: Item[];
}

const schema = {
  type: 'object' as const,
  properties: {
    items: {
      type: 'array' as const,
      items: {
        type: 'object' as const,
        properties: {
          name: { type: 'string' as const },
          quantity: { type: 'number' as const },
          unit: { type: 'string' as const }
        },
        required: ['name', 'quantity']
      }
    }
  },
  required: ['items']
};

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: input,
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: schema
  }
});

const result: ShoppingList = JSON.parse(response.text);
```

### 5. Chat Sessions

```typescript
const chat = ai.models.startChat({
  model: 'gemini-2.5-flash',
  systemInstruction: 'You are a helpful coding assistant',
  history: []
});

// Turn 1
const response1 = await chat.sendMessage('What is React?');
console.log(response1.text);

// Turn 2 (context preserved)
const response2 = await chat.sendMessage('Show me a useState example');
console.log(response2.text);

// Access full history
console.log(await chat.getHistory());
```

### 6. Function Calling

```typescript
import { FunctionDeclaration, FunctionCallingConfigMode } from '@google/genai';

// Define function schema
const getCurrentWeather: FunctionDeclaration = {
  name: 'get_current_weather',
  description: 'Get the current weather in a given location',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      location: { 
        type: 'string',
        description: 'City name, e.g. San Francisco'
      },
      unit: { 
        type: 'string', 
        enum: ['celsius', 'fahrenheit']
      }
    },
    required: ['location']
  }
};

// Call API with function
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What is the weather like in Tokyo?',
  config: {
    tools: [{ functionDeclarations: [getCurrentWeather] }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.AUTO
      }
    }
  }
});

// Check for function call
const functionCall = response.functionCalls?.[0];

if (functionCall) {
  // Execute your actual function
  const weatherData = await fetchWeatherAPI(
    functionCall.args.location,
    functionCall.args.unit || 'celsius'
  );
  
  // Send result back to model
  const finalResponse = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: [
      { text: 'What is the weather like in Tokyo?' },
      { functionCall: functionCall },
      { 
        functionResponse: {
          name: 'get_current_weather',
          response: weatherData
        }
      }
    ]
  });
  
  console.log(finalResponse.text);
}
```

## Error Handling

```typescript
import { ApiError } from '@google/genai';

async function safeGenerate(prompt: string) {
  try {
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt
    });
    return response.text;
  } catch (error) {
    if (error instanceof ApiError) {
      console.error('API Error:', error.message);
      console.error('Status:', error.status);
      
      if (error.status === 429) {
        // Rate limit - retry with backoff
        await new Promise(r => setTimeout(r, 1000));
        return safeGenerate(prompt);
      } else if (error.status === 400) {
        throw new Error(`Invalid request: ${error.message}`);
      }
    }
    throw error;
  }
}
```

## Security Best Practices

### Environment Variables

```bash
# .env.local
GEMINI_API_KEY=your-key-here
```

### Never Expose in Client

```typescript
// ❌ NEVER in client-side code
const ai = new GoogleGenAI({ apiKey: 'hardcoded-key' });

// ✅ CORRECT: Backend/API routes only
// pages/api/generate.ts (Next.js)
export default async function handler(req, res) {
  const ai = new GoogleGenAI({}); // Server-side only
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: req.body.prompt
  });
  res.json({ text: response.text });
}
```

## Production Checklist

- [ ] Using `@google/genai` (not deprecated SDK)
- [ ] API key from environment variable
- [ ] Never expose key in client-side code
- [ ] Error handling with ApiError
- [ ] Retry logic for rate limits
- [ ] Input validation before API calls
- [ ] Output validation (especially for JSON)
- [ ] Token counting for large inputs
- [ ] Appropriate model selection
- [ ] Safety settings configured

## Additional Resources

For detailed information, see:
- [REFERENCE.md](REFERENCE.md) - Complete API reference and advanced patterns
- [EXAMPLES.md](EXAMPLES.md) - Real-world use cases (recipes, inventory, chatbots)
- [MIGRATION.md](MIGRATION.md) - Migrating from old SDK

## Quick Troubleshooting

**"Module not found" error:**
```bash
npm install @google/genai
```

**"Invalid API key" error:**
```bash
echo $GEMINI_API_KEY  # Check if set
# Verify key at https://aistudio.google.com/apikey
```

**Empty or malformed JSON:**
- Always use `responseSchema` with `responseMimeType: 'application/json'`
- Validate schema structure matches your types

## Resources

- **Official Docs**: https://googleapis.github.io/js-genai/
- **GitHub**: https://github.com/googleapis/js-genai
- **API Console**: https://aistudio.google.com/

---

**Last Updated:** January 2026  
**SDK Version:** @google/genai (2025+)
