# Gemini API Cursor Skill

Official Google Gemini API integration skill optimized for Cursor IDE development.

## 📁 File Structure

```
gemini-api-cursor/
├── SKILL.md          # Main skill file - Essential patterns & quick reference
├── REFERENCE.md      # Complete API reference & advanced configuration
├── EXAMPLES.md       # Real-world use cases with production code
├── MIGRATION.md      # Migration guide from old SDK
└── README.md         # This file
```

## 🚀 Quick Start

1. **Install the SDK:**
   ```bash
   npm install @google/genai
   ```

2. **Set up your API key:**
   ```bash
   export GEMINI_API_KEY='your-api-key-here'
   ```

3. **Basic usage:**
   ```typescript
   import { GoogleGenAI } from '@google/genai';
   
   const ai = new GoogleGenAI({});
   const response = await ai.models.generateContent({
     model: 'gemini-2.5-flash',
     contents: 'Hello, Gemini!'
   });
   
   console.log(response.text);
   ```

## 📚 Documentation Guide

### Start Here: SKILL.md
Read this first for essential patterns and quick reference. Contains:
- SDK setup and initialization
- Core patterns (streaming, vision, JSON, chat, functions)
- Error handling
- Security best practices
- Production checklist

### Deep Dive: REFERENCE.md
Advanced configuration and optimization. Includes:
- Generation config parameters
- Safety settings
- Token counting
- Vertex AI setup
- Performance optimization
- Type safety with Zod

### Learn by Example: EXAMPLES.md
Production-ready code for common use cases:
- Recipe extraction from images
- Inventory analysis
- Chatbot implementation
- Document processing
- Image analysis pipeline

### Migrating: MIGRATION.md
Step-by-step guide for migrating from old SDK:
- Breaking changes
- Code comparison (before/after)
- Automated migration script
- Testing checklist

## 🎯 When to Use This Skill

Cursor will automatically apply this skill when you:
- Mention "Gemini API" or "Google AI"
- Work with text generation
- Process images or multimodal content
- Implement function calling
- Need structured JSON outputs
- Build chat applications
- Stream AI responses

## ⚡ Key Features

- ✅ Uses latest `@google/genai` SDK (2025+)
- ✅ TypeScript-first with full type safety
- ✅ Production-ready error handling
- ✅ Streaming support for better UX
- ✅ Vision/multimodal capabilities
- ✅ Structured JSON output with schemas
- ✅ Function calling examples
- ✅ Chat session management
- ✅ Security best practices

## 🔗 Resources

- **Official Docs**: https://googleapis.github.io/js-genai/
- **GitHub**: https://github.com/googleapis/js-genai
- **API Console**: https://aistudio.google.com/
- **Get API Key**: https://aistudio.google.com/apikey

## 📝 Notes

- This skill follows Cursor best practices (under 500 lines for main SKILL.md)
- Uses progressive disclosure for detailed content
- All examples are tested and production-ready
- Updated for January 2026

## 🆘 Quick Troubleshooting

**Module not found?**
```bash
npm install @google/genai
```

**API key error?**
```bash
echo $GEMINI_API_KEY  # Check if set
```

**Need help?** Check REFERENCE.md for detailed troubleshooting.

---

**Last Updated:** January 2026  
**SDK Version:** @google/genai (2025+)
