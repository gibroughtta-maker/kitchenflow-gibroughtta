# Implementation Plan: Intelligent Voice Agent (Gemini Flash)

## Goal
Enable users to add items or complex recipes to their shopping list via voice commands.
Example: "I want to eat boiled fish" -> AI expands this to: Fish, Bean Sprouts, Chili, Schezwan Peppercorns, Doubanjiang.

## Approach
Instead of a complex WebSocket "Live API", we will use **Gemini 1.5 Flash** (via REST).
1.  **Record**: Use `expo-av` to capture audio (m4a/aac).
2.  **Upload**: Convert audio to Base64 (or file upload) and send to Gemini 1.5 Flash.
3.  **Think**: Gemini extracts intent and ingredients using a structured prompt.
4.  **Action**: App adds parsed items to the shopping list.

## Proposed Changes

### 1. Dependencies
- Install `expo-av` (Audio Video)
- Install `expo-file-system` (File access for upload)

### 2. Services
#### [NEW] `src/services/voiceService.ts`
- `startRecording()`: Configure audio mode and start recording.
- `stopRecording()`: Stop and return file URI.
- `getAudioBlob()`: Read file as Base64.

#### [MODIFY] `src/services/scannerService.ts`
- Add `analyzeVoiceCommand(audioBase64: string)`
- Use `gemini-2.0-flash-exp` (or `gemini-3-flash-preview` as requested/if available)
- Prompt: "Listen to this request. Extract a shopping list. If it's a recipe (e.g. 'boiled fish'), list the main ingredients."

#### [MODIFY] `src/services/ai/schemas.ts`
- Ensure `VOICE_PARSE_SCHEMA` supports recipe expansion (list of items).

### 3. UI Components
#### [MODIFY] `src/components/QuickAddBar.tsx`
- Change "Mic" button behavior:
    - **Press & Hold**: Record.
    - **Release**: Stop & Send.
- Show "Recording..." state (pulsing red).
- Show "Thinking..." state (spinner).

## Verification Plan

### Manual Verification
1.  **Permission**: Verify Microphone permission prompt appears on first use.
2.  **Simple Item**: Say "Buy milk and eggs" -> Verify "Milk" and "Eggs" added.
3.  **Recipe Expansion**: Say "I want to cook Mapo Tofu" -> Verify typical ingredients added (Tofu, Minced Meat, Doubanjiang).
4.  **Error Handling**: Say nothing (silence) -> Verify app handles "No speech detected" gracefully.
