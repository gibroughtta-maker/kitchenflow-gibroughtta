# Design: Gemini Multimodal Live Agent (Expo Compatible)

## 1. Objective
Enable "Agent" capabilities using Gemini Multimodal Live API.
*   **Input**: Voice (Microphone)
*   **Processing**: Real-time (or near real-time) reasoning via Gemini Live API (WebSocket)
*   **Output**: Voice (TTS) + App Actions (Function Calling)

## 2. Constraints (Expo Managed Workflow)
*   **App**: React Native (Expo SDK 54)
*   **Audio Streaming**: True bidirectional PCM streaming is difficult in Expo Go without native modules.
*   **WebSockets**: Supported natively.

## 3. Architecture Proposal

### A. The "Turn-Based" Live Agent (Recommended for Stability)
Instead of continuous full-duplex streaming (which might lag or crash in JS thread), we use a "Turn-Based" approach that feels like a live call.

1.  **User Speaks**:
    *   App records audio using `expo-av`.
    *   On silence (or "Done" button), stop recording.
    *   Send audio chunk to Gemini Live API via WebSocket (`realtime_input`).
    *   *Advanced*: We can try sending chunks while recording if `expo-file-system` reads fast enough.

2.  **Gemini Thinks**:
    *   Maintains context (Conversation History).
    *   Execute Tools (e.g., `addToShoppingList`).

3.  **Gemini Responds**:
    *   Returns **Text** (and optionally PCM Audio).
    *   **Output Strategy**:
        *   **Option A (Simple)**: Use `expo-speech` to read the *Text* response. (Fastest, usually clean voice).
        *   **Option B (Complex)**: Decode PCM chunks from Gemini and play via `expo-av`. (Hard to do gapless playback in Expo).
        *   **Decision**: Start with **Option A** for robust "Agent" logic verification.

### B. Tool Definitions (The "Agent" Part)
We define a schema for the Gemini Session:
*   `tools`: `[{ function_declarations: [...] }]`
*   `add_item(name: string, quantity: string)`
*   `get_craving_analysis(item: string)`

### C. UI/UX
*   **Entrance**: "Microphone" button in `QuickAddBar`.
*   **Interface**: A **Half-Modal** or **Overlay**.
    *   Visualizer (Waveform or Pulse).
    *   Status Text ("Listening...", "Thinking...", "Speaking...").
    *   Action Log (e.g., "Added Milk to list").

## 4. Implementation Steps

### Phase 1: Infrastructure
1.  Install `expo-av` (for recording).
2.  Install `base-64` (for encoding audio).
3.  Create `GeminiLiveClient` class to manage WebSocket `wss://generativelanguage.googleapis.com/ws/...`.

### Phase 2: Audio Input
1.  Implement `AudioRecorder` using `expo-av`.
2.  Convert recording to required format (16kHz, Mono, PCM).
    *   *Note*: Expo records to files (m4a/caf). We might need to send the file or just use standard Gemini GenerateContent (REST) if we can't get raw PCM easily.
    *   *Pivot*: If PCM is hard, we use **Gemini 1.5 Flash (REST)** for Audio-to-Text+Action for the first MVP.
    *   *User Request*: Explicitly asked for "Multimodal Live API". We must try WebSocket.

### Phase 3: Function Calling
1.  Define `tools` in WebSocket setup.
2.  Handle `tool_use` events from server.
3.  Execute local functions (`shoppingListService`).
4.  Send `tool_response` back to Gemini.

## 5. Risk Assessment
*   **Audio Format**: Gemini Live expects raw PCM 16kHz. `expo-av` usually outputs compressed formats (AAC/M4A). Deciding to send compressed audio?
    *   *Docs*: Live API supports specific PCM formats.
    *   *Workaround*: If we can't get PCM from Expo, we might need a cloud function proxy or use the REST API which accepts standard audio files (mp3/wav).
    *   *Pivot*: **Gemini 1.5 Flash via REST** is much easier for "Voice Agent" in Expo. It accepts audio files directly.
    *   **HOWEVER**, User asked for "Multimodal Live API". I will present the trade-off.

## 6. Recommendation
Propose **Hybrid Approach**:
*   Use **Gemini Live API (WebSocket)** for the logic/text interaction (low latency).
*   Use **Expo Speech** for output.
*   Use **Expo AV** to record audio, but we might need to compromise on "Streaming Input" (send file at end of utterance) if PCM access is blocked.

Let's Verify: Can `expo-av` record PCM?
*   Yes, `IOSOutputFormat.wd` / `AndroidOutputFormat.AMR_WB`.
*   Uncompressed PCM (`kAudioFormatLinearPCM`) is supported on iOS. Android supports it too via `AudioEncoder.AAC` usually, but raw PCM might be tricky.

**Let's ask the user:**
1.  Are you using Expo Go (Managed)?
2.  Is "True Streaming" (interrupt me while I speak) critical, or is "Turn-based" (Walkie-Talkie style) acceptable for V1?
