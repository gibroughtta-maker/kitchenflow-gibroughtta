# Gemini API Complete Reference

This document contains detailed API reference, advanced patterns, and configuration options.

## Table of Contents

- [Advanced Configuration](#advanced-configuration)
- [Generation Config](#generation-config)
- [Safety Settings](#safety-settings)
- [Token Counting](#token-counting)
- [Vertex AI Setup](#vertex-ai-setup)
- [Performance Optimization](#performance-optimization)
- [Type Safety with Zod](#type-safety-with-zod)

## Advanced Configuration

### System Instructions

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Write about AI',
  systemInstruction: `You are a technical writer. 
Rules:
- Use clear, concise language
- Include code examples
- Avoid jargon`
});
```

### Generation Config

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Write a product description',
  generationConfig: {
    temperature: 0.9,        // Creativity (0-2)
    topP: 0.95,             // Nucleus sampling
    topK: 40,               // Top-k sampling
    maxOutputTokens: 2048,  // Response length limit
    stopSequences: ['END']  // Stop generation
  }
});
```

**Parameter Guide:**

| Parameter | Range | Default | Use Case |
|-----------|-------|---------|----------|
| `temperature` | 0-2 | 1.0 | Higher = more creative/random |
| `topP` | 0-1 | 0.95 | Nucleus sampling threshold |
| `topK` | 1-∞ | 40 | Top-k sampling limit |
| `maxOutputTokens` | 1-8192 | 2048 | Maximum response length |
| `stopSequences` | string[] | [] | Stop generation at these strings |

### Safety Settings

```typescript
import { HarmCategory, HarmBlockThreshold } from '@google/genai';

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Discuss historical conflicts',
  safetySettings: [
    {
      category: HarmCategory.HARM_CATEGORY_HATE_SPEECH,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
    },
    {
      category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT,
      threshold: HarmBlockThreshold.BLOCK_ONLY_HIGH
    },
    {
      category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
    },
    {
      category: HarmCategory.HARM_CATEGORY_HARASSMENT,
      threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE
    }
  ]
});
```

**Harm Categories:**
- `HARM_CATEGORY_HATE_SPEECH`
- `HARM_CATEGORY_DANGEROUS_CONTENT`
- `HARM_CATEGORY_SEXUALLY_EXPLICIT`
- `HARM_CATEGORY_HARASSMENT`

**Thresholds:**
- `BLOCK_NONE` - No blocking
- `BLOCK_ONLY_HIGH` - Block only high severity
- `BLOCK_MEDIUM_AND_ABOVE` - Block medium and high (default)
- `BLOCK_LOW_AND_ABOVE` - Block low, medium, and high

## Token Counting

```typescript
const response = await ai.models.countTokens({
  model: 'gemini-2.5-flash',
  contents: 'Your prompt here'
});

console.log('Total tokens:', response.totalTokens);
```

**For multimodal content:**
```typescript
const response = await ai.models.countTokens({
  model: 'gemini-2.5-flash',
  contents: [
    { text: 'Describe this image' },
    { inlineData: { mimeType: 'image/jpeg', data: base64Image } }
  ]
});

console.log('Text tokens:', response.textTokens);
console.log('Image tokens:', response.imageTokens);
console.log('Total tokens:', response.totalTokens);
```

## Vertex AI Setup

For Google Cloud Platform integration:

```typescript
import { GoogleGenAI } from '@google/genai';

const ai = new GoogleGenAI({
  vertexai: true,
  project: 'your-gcp-project-id',
  location: 'us-central1'
});

// Same API, different backend
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Hello'
});
```

**Authentication:**
```bash
# Application Default Credentials
gcloud auth application-default login

# Or service account
export GOOGLE_APPLICATION_CREDENTIALS="/path/to/service-account-key.json"
```

**Available locations:**
- `us-central1` (default)
- `us-east4`
- `us-west1`
- `europe-west1`
- `asia-northeast1`

## Performance Optimization

### Rate Limiting & Retries

```typescript
import pRetry from 'p-retry';

const generateWithRetry = async (prompt: string) => {
  return await pRetry(
    async () => {
      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      });
      return response.text;
    },
    {
      retries: 3,
      minTimeout: 1000,
      maxTimeout: 5000,
      onFailedAttempt: (error) => {
        console.log(
          `Attempt ${error.attemptNumber} failed. ${error.retriesLeft} retries left.`
        );
      }
    }
  );
};
```

### Batch Processing

```typescript
async function processBatch(prompts: string[]) {
  const results = await Promise.all(
    prompts.map(prompt => 
      ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: prompt
      })
    )
  );
  
  return results.map(r => r.text);
}

// With rate limiting
async function processBatchWithLimit(prompts: string[], concurrency = 5) {
  const results = [];
  
  for (let i = 0; i < prompts.length; i += concurrency) {
    const batch = prompts.slice(i, i + concurrency);
    const batchResults = await Promise.all(
      batch.map(prompt =>
        ai.models.generateContent({
          model: 'gemini-2.5-flash',
          contents: prompt
        })
      )
    );
    results.push(...batchResults.map(r => r.text));
  }
  
  return results;
}
```

### Caching Strategies

For prompts with large, repeated context:

```typescript
// Store responses for repeated queries
const cache = new Map<string, string>();

async function cachedGenerate(prompt: string) {
  if (cache.has(prompt)) {
    return cache.get(prompt);
  }
  
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  
  cache.set(prompt, response.text);
  return response.text;
}
```

## Type Safety with Zod

```typescript
import { z } from 'zod';

const RecipeSchema = z.object({
  name: z.string(),
  ingredients: z.array(z.object({
    item: z.string(),
    amount: z.string()
  })),
  steps: z.array(z.string()),
  prepTime: z.number().optional(),
  cookTime: z.number().optional()
});

type Recipe = z.infer<typeof RecipeSchema>;

// Convert Zod schema to JSON Schema
function zodToJsonSchema(schema: z.ZodObject<any>) {
  // Simplified converter - use zod-to-json-schema package for production
  return {
    type: 'object',
    properties: {
      name: { type: 'string' },
      ingredients: {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            item: { type: 'string' },
            amount: { type: 'string' }
          },
          required: ['item', 'amount']
        }
      },
      steps: { type: 'array', items: { type: 'string' } },
      prepTime: { type: 'number' },
      cookTime: { type: 'number' }
    },
    required: ['name', 'ingredients', 'steps']
  };
}

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Create a recipe for chocolate chip cookies',
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: zodToJsonSchema(RecipeSchema)
  }
});

// Parse and validate with Zod
const recipe = RecipeSchema.parse(JSON.parse(response.text));
```

**Using zod-to-json-schema package:**
```typescript
import { zodToJsonSchema } from 'zod-to-json-schema';

const jsonSchema = zodToJsonSchema(RecipeSchema);

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt,
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: jsonSchema
  }
});
```

## Advanced Function Calling

### Multiple Functions

```typescript
const functions: FunctionDeclaration[] = [
  {
    name: 'search_database',
    description: 'Search for products in inventory',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        query: { type: 'string' },
        limit: { type: 'number', default: 10 }
      },
      required: ['query']
    }
  },
  {
    name: 'add_to_cart',
    description: 'Add product to shopping cart',
    parametersJsonSchema: {
      type: 'object',
      properties: {
        productId: { type: 'string' },
        quantity: { type: 'number', default: 1 }
      },
      required: ['productId']
    }
  }
];

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Find organic coffee and add 2 to my cart',
  config: {
    tools: [{ functionDeclarations: functions }]
  }
});

// Handle potentially multiple function calls
for (const call of response.functionCalls || []) {
  if (call.name === 'search_database') {
    const results = await searchDatabase(call.args.query, call.args.limit);
    // Send results back...
  } else if (call.name === 'add_to_cart') {
    await addToCart(call.args.productId, call.args.quantity);
    // Send confirmation back...
  }
}
```

### Function Calling Modes

```typescript
import { FunctionCallingConfigMode } from '@google/genai';

// AUTO: Model decides when to call functions
const autoResponse = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What is the weather?',
  config: {
    tools: [{ functionDeclarations: [weatherFunction] }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.AUTO
      }
    }
  }
});

// ANY: Force model to call a function
const forcedResponse = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Tokyo',
  config: {
    tools: [{ functionDeclarations: [weatherFunction] }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.ANY
      }
    }
  }
});

// NONE: Disable function calling
const noFunctionResponse = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'What is the weather?',
  config: {
    tools: [{ functionDeclarations: [weatherFunction] }],
    toolConfig: {
      functionCallingConfig: {
        mode: FunctionCallingConfigMode.NONE
      }
    }
  }
});
```

## Debugging Tips

### Enable Verbose Logging

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'test'
}).catch(err => {
  console.error('Full error:', JSON.stringify(err, null, 2));
  console.error('Stack:', err.stack);
  throw err;
});
```

### Inspect Response Structure

```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Hello'
});

console.log('Full response:', JSON.stringify(response, null, 2));
console.log('Text:', response.text);
console.log('Candidates:', response.candidates);
console.log('Safety ratings:', response.safetyRatings);
```

### Validate Schema Matches

```typescript
// Test your schema with sample data first
const testData = {
  items: [{ name: 'test', quantity: 1, unit: 'kg' }]
};

// Verify it matches your schema before using with API
function validateSchema(data: any, schema: any): boolean {
  // Add validation logic
  return true;
}
```

## Model Limits

| Model | Input Tokens | Output Tokens | Rate Limit |
|-------|--------------|---------------|------------|
| gemini-2.5-flash | ~1M | 8,192 | 1000 RPM |
| gemini-2.0-flash-exp | ~1M | 8,192 | 1000 RPM |
| gemini-2.5-flash-lite | ~1M | 8,192 | 2000 RPM |

> Check [official docs](https://ai.google.dev/pricing) for current limits

## Best Practices Summary

1. **Always use `@google/genai`** - Never use deprecated SDK
2. **Use `responseSchema`** - For guaranteed valid JSON
3. **Implement retries** - Handle rate limits gracefully
4. **Stream when possible** - Better UX for long responses
5. **Count tokens** - Avoid exceeding limits
6. **Validate inputs** - Before sending to API
7. **Cache responses** - For repeated queries
8. **Use appropriate models** - Balance cost/performance
9. **Set safety settings** - For production apps
10. **Never expose API keys** - Keep them server-side
