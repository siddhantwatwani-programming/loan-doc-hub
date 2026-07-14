# Flow Keyboard — native iOS keyboard extension

A real, installable iOS system keyboard (the kind you enable in
Settings → Keyboards and use in Messages, Mail, anywhere). Swift + SwiftUI,
two targets:

| Target | What it is |
|---|---|
| `FlowKeyboardApp` | Host app — setup checklist + where you paste your Supabase URL / anon key (stored in an App Group so the keyboard can read them) |
| `FlowKeyboard` | The keyboard extension — QWERTY keyboard with the purple Flow mic key, waveform listening sheet, Whisper transcription via your Supabase edge function |

## Requirements

- A Mac with Xcode 15+ (iOS 17 SDK)
- An Apple ID (free works for on-device dev installs; a paid Apple Developer
  account is needed for TestFlight/App Store)
- [XcodeGen](https://github.com/yonaskolb/XcodeGen): `brew install xcodegen`
- The `transcribe` Supabase edge function from this repo deployed
  (see the main README — same function the web app uses)

## Build & install on your iPhone

```sh
cd ios

# 1. Make the identifiers yours (they must be unique to your team):
#    - project.yml            → bundleIdPrefix + the two PRODUCT_BUNDLE_IDENTIFIERs
#    - Shared/SharedConfig.swift → appGroupID
#    - both *.entitlements files → the app-group string (must match SharedConfig)

# 2. Generate the Xcode project
xcodegen generate

# 3. Open it
open FlowKeyboard.xcodeproj
```

In Xcode:

1. Select the **FlowKeyboardApp** target → Signing & Capabilities → pick your
   Team. Do the same for the **FlowKeyboard** target.
2. On both targets, make sure the **App Groups** capability shows your group
   id with a checkmark (Xcode will register it with your team).
3. Plug in your iPhone, select it as the run destination, hit **Run**.

On the phone:

1. Open the **Flow** app → paste your Supabase URL + anon key → Save.
2. Settings → General → Keyboard → Keyboards → **Add New Keyboard…** →
   Flow Keyboard.
3. Tap **Flow Keyboard** in that list → enable **Allow Full Access**
   (required for network access to Supabase and for the microphone).
4. In any app, long-press the globe key → Flow Keyboard → tap the purple mic
   key and talk.

## What keys/credentials go where

| Credential | Where it lives | How |
|---|---|---|
| `OPENAI_API_KEY` | Supabase edge function secret (server-side only) | `supabase secrets set OPENAI_API_KEY=sk-...` |
| Supabase URL | Typed into the Flow host app on the phone | Dashboard → Project Settings → API |
| Supabase anon key | Typed into the Flow host app on the phone | Same page — the `anon` / publishable key |

Your OpenAI key is never on the phone; the keyboard only talks to your
Supabase project.

## Platform caveats (read this)

- **Full Access is mandatory.** Without it, iOS blocks all network calls from
  a keyboard extension, so transcription can't work. The keyboard shows a hint
  when it's off.
- **Microphone in keyboard extensions is the hard part.** Apple heavily
  restricts mic capture inside keyboard extensions, and behavior varies by iOS
  version. This scaffold records in-extension via `AVAudioRecorder`; if the OS
  refuses the audio session on your iOS version, the error banner will say so.
  The production-grade fallback (what several shipping dictation keyboards do)
  is: the mic key deep-links to the host app, the host app records and
  transcribes, and the text comes back through the App Group for insertion.
  The App Group plumbing here already supports adding that flow.
- **Memory.** Keyboard extensions get a small memory budget (~60–70 MB).
  This scaffold stays well under it.
- This code was written and reviewed off-device (no macOS/Xcode in this
  environment), so expect the usual first-build friction — signing, team ids,
  and possibly a stray compiler nit — rather than a guaranteed clean compile.

## Architecture

```
FlowKeyboardApp (host)                    FlowKeyboard (extension)
┌──────────────────────┐                 ┌──────────────────────────────┐
│ ContentView          │   App Group     │ KeyboardViewController       │
│  - setup checklist   │  UserDefaults   │  └ KeyboardRootView (SwiftUI)│
│  - Supabase URL/key ─┼────────────────▶│     ├ KeyboardPanel (QWERTY) │
└──────────────────────┘                 │     ├ FlowKeyView (mic)      │
                                         │     └ FlowSheetView (wave)   │
                                         │ DictationController          │
                                         │  ├ AudioRecorder (.m4a)      │
                                         │  └ TranscriptionClient ──────┼──▶ Supabase fn
                                         └──────────────────────────────┘      "transcribe"
                                                                                ├ Whisper
                                                                                └ GPT cleanup
```
