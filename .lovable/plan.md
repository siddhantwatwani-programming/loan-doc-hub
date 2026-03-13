

# Fix: Corrupted DOCX Output During Document Generation

## Problem
The `processDocx` function in `supabase/functions/_shared/docx-processor.ts` decompresses the template DOCX (a ZIP file), processes XML files, and recompresses everything using `fflate.zipSync`. For the "Declaration of Oral Disclosure With Field Codes" template, the re-zipped output produces an invalid/corrupted DOCX that Word cannot open.

The root cause is that `fflate.zipSync` with default settings may produce ZIP metadata (compression levels, CRC handling) that differs from what Word's strict ZIP parser expects. This is a known issue when round-tripping DOCX files through fflate.

## Fix (Single File Change)

**File: `supabase/functions/_shared/docx-processor.ts`**

1. Set explicit compression level `{ level: 6 }` (standard DEFLATE) for all re-zipped entries to ensure consistent, Word-compatible ZIP output.
2. For non-XML/non-`.rels` binary entries (images, embedded objects), use `level: 0` (store without compression) to avoid re-compressing already-compressed binary data that Word may be sensitive to.
3. Skip XML re-encoding for files that weren't actually modified (the processed text equals the original) to minimize any encoding drift.

```text
processedFiles structure change:
  Before:  processedFiles[filename] = Uint8Array
  After:   processedFiles[filename] = [Uint8Array, { level: 0 | 6 }]
```

This is a minimal, targeted fix to the `processDocx` function only. No other files, UI, schema, or logic are modified.

## Technical Details

- fflate's `Zippable` type supports per-file options: `[data, { level: number }]`
- XML/rels files get `level: 6` (standard deflate compression)
- Binary files (images, fonts, etc.) get `level: 0` (stored) to preserve exact bytes
- Additionally, if XML content is unchanged after merge tag processing, the original decompressed bytes are reused directly to avoid any UTF-8 encode/decode round-trip issues

