# Migration Guide: Old SDK → @google/genai

This guide helps you migrate from the deprecated `@google/generative-ai` SDK to the new unified `@google/genai` SDK.

## Why Migrate?

- **Deprecated**: `@google/generative-ai` reaches EOL in November 2025
- **Unified**: Single SDK for both Developer API and Vertex AI
- **Better**: Improved TypeScript support and error handling
- **Future-proof**: All new features only in `@google/genai`

## Quick Migration Checklist

- [ ] Install new SDK: `npm install @google/genai`
- [ ] Update imports
- [ ] Update initialization code
- [ ] Update model names
- [ ] Update API calls
- [ ] Test thoroughly
- [ ] Remove old SDK: `npm uninstall @google/generative-ai`

## Step-by-Step Migration

### 1. Install New SDK

```bash
npm install @google/genai
```

### 2. Update Imports

**Before:**
```typescript
import { GoogleGenerativeAI } from '@google/generative-ai';
```

**After:**
```typescript
import { GoogleGenAI } from '@google/genai';
```

### 3. Update Initialization

**Before:**
```typescript
const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
```

**After:**
```typescript
const ai = new GoogleGenAI({}); // Auto-reads GEMINI_API_KEY
// No need to get model separately
```

### 4. Update Model Names

| Old Name | New Name |
|----------|----------|
| `gemini-pro` | `gemini-2.5-flash` |
| `gemini-pro-vision` | `gemini-2.5-flash` (same model) |
| `gemini-1.5-pro` | `gemini-2.5-flash` |
| `gemini-1.5-flash` | `gemini-2.5-flash` |

### 5. Update API Calls

#### Basic Generation

**Before:**
```typescript
const result = await model.generateContent(prompt);
const response = await result.response;
const text = response.text();
```

**After:**
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt
});
const text = response.text;
```

#### Streaming

**Before:**
```typescript
const result = await model.generateContentStream(prompt);
for await (const chunk of result.stream) {
  const chunkText = chunk.text();
  process.stdout.write(chunkText);
}
```

**After:**
```typescript
const stream = await ai.models.generateContentStream({
  model: 'gemini-2.5-flash',
  contents: prompt
});

for await (const chunk of stream) {
  process.stdout.write(chunk.text);
}
```

#### Vision/Multimodal

**Before:**
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-pro-vision' });

const result = await model.generateContent([
  prompt,
  {
    inlineData: {
      mimeType: 'image/jpeg',
      data: base64Image
    }
  }
]);
```

**After:**
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: [
    { text: prompt },
    { 
      inlineData: { 
        mimeType: 'image/jpeg', 
        data: base64Image 
      } 
    }
  ]
});
```

#### Chat

**Before:**
```typescript
const chat = model.startChat({
  history: [],
  generationConfig: {
    maxOutputTokens: 100,
  },
});

const result = await chat.sendMessage(message);
const response = await result.response;
const text = response.text();
```

**After:**
```typescript
const chat = ai.models.startChat({
  model: 'gemini-2.5-flash',
  history: [],
  generationConfig: {
    maxOutputTokens: 100,
  }
});

const response = await chat.sendMessage(message);
const text = response.text;
```

#### Function Calling

**Before:**
```typescript
const functions = {
  function_declarations: [
    {
      name: 'get_weather',
      description: 'Get weather',
      parameters: {
        type: 'object',
        properties: {
          location: { type: 'string' }
        }
      }
    }
  ]
};

const model = genAI.getGenerativeModel({
  model: 'gemini-pro',
  tools: [functions]
});

const result = await model.generateContent(prompt);
const call = result.response.functionCalls()[0];
```

**After:**
```typescript
import { FunctionDeclaration } from '@google/genai';

const getWeather: FunctionDeclaration = {
  name: 'get_weather',
  description: 'Get weather',
  parametersJsonSchema: {
    type: 'object',
    properties: {
      location: { type: 'string' }
    },
    required: ['location']
  }
};

const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt,
  config: {
    tools: [{ functionDeclarations: [getWeather] }]
  }
});

const call = response.functionCalls?.[0];
```

#### JSON Mode

**Before:**
```typescript
const model = genAI.getGenerativeModel({
  model: 'gemini-pro',
  generationConfig: {
    responseMimeType: 'application/json'
  }
});

const result = await model.generateContent(prompt);
const json = JSON.parse(result.response.text());
```

**After:**
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt,
  generationConfig: {
    responseMimeType: 'application/json',
    responseSchema: {
      type: 'object',
      properties: {
        // Define your schema
      }
    }
  }
});

const json = JSON.parse(response.text);
```

## Common Patterns

### Pattern 1: Simple Text Generation

**Before:**
```typescript
const genAI = new GoogleGenerativeAI(API_KEY);
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const result = await model.generateContent('Hello');
console.log((await result.response).text());
```

**After:**
```typescript
const ai = new GoogleGenAI({});
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: 'Hello'
});
console.log(response.text);
```

### Pattern 2: Streaming with React

**Before:**
```typescript
const [output, setOutput] = useState('');

const result = await model.generateContentStream(prompt);
for await (const chunk of result.stream) {
  setOutput(prev => prev + chunk.text());
}
```

**After:**
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

### Pattern 3: Error Handling

**Before:**
```typescript
try {
  const result = await model.generateContent(prompt);
  const response = await result.response;
  return response.text();
} catch (error) {
  console.error('Error:', error.message);
}
```

**After:**
```typescript
import { ApiError } from '@google/genai';

try {
  const response = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: prompt
  });
  return response.text;
} catch (error) {
  if (error instanceof ApiError) {
    console.error('API Error:', error.message, 'Status:', error.status);
  }
}
```

## Breaking Changes

### 1. No More `getGenerativeModel()`

The new SDK doesn't require getting a model instance first.

**Old way:**
```typescript
const model = genAI.getGenerativeModel({ model: 'gemini-pro' });
const result = await model.generateContent(prompt);
```

**New way:**
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt
});
```

### 2. Response Structure

**Old:**
```typescript
const result = await model.generateContent(prompt);
const response = await result.response;
const text = response.text();
```

**New:**
```typescript
const response = await ai.models.generateContent({
  model: 'gemini-2.5-flash',
  contents: prompt
});
const text = response.text; // Property, not method
```

### 3. Function Calling Schema

**Old:**
```typescript
parameters: {
  type: 'object',
  properties: { ... }
}
```

**New:**
```typescript
parametersJsonSchema: {
  type: 'object',
  properties: { ... }
}
```

### 4. Model Names

All old model names are deprecated. Use new naming:
- `gemini-2.5-flash` (default)
- `gemini-2.0-flash-exp` (experimental)
- `gemini-2.5-flash-lite` (fast)

## Automated Migration Script

Use this script to help automate the migration:

```bash
#!/bin/bash

# Find and replace common patterns
find . -name "*.ts" -o -name "*.tsx" -o -name "*.js" | xargs sed -i '' \
  -e "s/@google\/generative-ai/@google\/genai/g" \
  -e "s/GoogleGenerativeAI/GoogleGenAI/g" \
  -e "s/gemini-pro/gemini-2.5-flash/g" \
  -e "s/gemini-pro-vision/gemini-2.5-flash/g" \
  -e "s/gemini-1.5-pro/gemini-2.5-flash/g" \
  -e "s/gemini-1.5-flash/gemini-2.5-flash/g"

echo "Basic replacements complete. Manual review required!"
```

**Note:** This script only handles basic replacements. You'll need to manually update:
- API call structures
- Response handling
- Function calling schemas
- Error handling

## Testing After Migration

Create a test file to verify migration:

```typescript
import { GoogleGenAI } from '@google/genai';

async function testMigration() {
  const ai = new GoogleGenAI({});
  
  // Test 1: Basic generation
  console.log('Test 1: Basic generation');
  const response1 = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Say hello'
  });
  console.log('✓ Response:', response1.text);
  
  // Test 2: Streaming
  console.log('\nTest 2: Streaming');
  const stream = await ai.models.generateContentStream({
    model: 'gemini-2.5-flash',
    contents: 'Count to 5'
  });
  process.stdout.write('✓ Stream: ');
  for await (const chunk of stream) {
    process.stdout.write(chunk.text);
  }
  console.log();
  
  // Test 3: JSON mode
  console.log('\nTest 3: JSON mode');
  const response3 = await ai.models.generateContent({
    model: 'gemini-2.5-flash',
    contents: 'Create a list of 3 colors',
    generationConfig: {
      responseMimeType: 'application/json',
      responseSchema: {
        type: 'object',
        properties: {
          colors: { type: 'array', items: { type: 'string' } }
        }
      }
    }
  });
  console.log('✓ JSON:', JSON.parse(response3.text));
  
  console.log('\n✅ All tests passed!');
}

testMigration().catch(console.error);
```

## Troubleshooting

### "Cannot find module '@google/genai'"

```bash
npm install @google/genai
```

### "API key not found"

Make sure `GEMINI_API_KEY` is set in your environment:

```bash
export GEMINI_API_KEY='your-key-here'
```

### "Model not found"

Update model names to new format:
- `gemini-pro` → `gemini-2.5-flash`
- `gemini-pro-vision` → `gemini-2.5-flash`

### Type errors with response

Old SDK used methods, new SDK uses properties:

```typescript
// Old: response.text()
// New: response.text
```

## Getting Help

- **Official Docs**: https://googleapis.github.io/js-genai/
- **Migration Issues**: https://github.com/googleapis/js-genai/issues
- **Examples**: https://github.com/googleapis/js-genai/tree/main/sdk-samples

## Rollback Plan

If you need to rollback:

```bash
npm uninstall @google/genai
npm install @google/generative-ai
git checkout -- .
```

Keep the old SDK installed temporarily during migration for comparison.
