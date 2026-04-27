/**
 * Regression tests for the RE851A Part 2 broker-capacity A/B safety pass.
 *
 * Pins the contract that:
 *   or_p_isBrkBorrower = true  -> A (Agent)     becomes ☐, B (Principal) becomes ☑
 *   or_p_isBrkBorrower = false -> A (Agent)     becomes ☑, B (Principal) becomes ☐
 *   or_p_isBrkBorrower missing -> glyphs are left untouched
 *
 * These tests exercise replaceMergeTags() (the same entry point used by
 * generate-document) with XML shaped like re851a_v64.docx — literal
 * "A. Agent in arranging a loan…" and "B. *Principal as a borrower…"
 * labels with static ☐ glyphs in front of each.
 *
 * No template, schema, UI, or other field mappings are touched.
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { replaceMergeTags } from "./tag-parser.ts";
import type { FieldValueData, LabelMapping } from "./types.ts";

function buildBrokerCapacityFixture(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
<w:body>
<w:p><w:r><w:t xml:space="preserve">PART 2  BROKER CAPACITY IN TRANSACTION</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/></w:rPr><w:t xml:space="preserve">☐ </w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/></w:rPr><w:t xml:space="preserve">.A. Agent in arranging a loan on behalf of another</w:t></w:r></w:p>
<w:p><w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/></w:rPr><w:t xml:space="preserve">☐</w:t></w:r><w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/></w:rPr><w:t xml:space="preserve">B. *Principal as a borrower on funds from which broker will directly or indirectly benefit</w:t></w:r></w:p>
<w:p><w:r><w:t>PART 3 LOAN INFORMATION</w:t></w:r></w:p>
</w:body></w:document>`;
}

function run(value: "true" | "false" | null): string {
  const fieldValues = new Map<string, FieldValueData>();
  if (value !== null) {
    fieldValues.set("or_p_isBrkBorrower", { rawValue: value, dataType: "boolean" });
  }
  const fieldTransforms = new Map<string, string>();
  const mergeTagMap: Record<string, string> = {};
  const labelMap: Record<string, LabelMapping> = {};
  const validFieldKeys = new Set<string>(["or_p_isBrkBorrower"]);
  return replaceMergeTags(
    buildBrokerCapacityFixture(),
    fieldValues,
    fieldTransforms,
    mergeTagMap,
    labelMap,
    validFieldKeys,
  );
}

// Returns the last visible glyph (☐/☑/☒) appearing before `label` in the
// rendered XML (XML tags stripped). Mirrors the helper used by the
// subordination tests.
function lastGlyphBeforeLabel(xml: string, label: string): string | null {
  const idx = xml.indexOf(label);
  if (idx < 0) return null;
  const region = xml.substring(Math.max(0, idx - 800), idx);
  const plain = region.replace(/<[^>]*>/g, "");
  const matches = plain.match(/[☐☑☒]/g);
  return matches ? matches[matches.length - 1] : null;
}

Deno.test("RE851A broker-capacity — isBrkBorrower=true → A=☐, B=☑", () => {
  const out = run("true");
  assertEquals(
    lastGlyphBeforeLabel(out, "A. Agent in arranging a loan"),
    "☐",
    "A row glyph should be unchecked when broker is also borrower",
  );
  // Allow either "B. *Principal" or "B. Principal" depending on label match path
  const bGlyph =
    lastGlyphBeforeLabel(out, "B. *Principal as a borrower") ??
    lastGlyphBeforeLabel(out, "B. Principal as a borrower");
  assertEquals(bGlyph, "☑", "B row glyph should be checked when broker is also borrower");
});

Deno.test("RE851A broker-capacity — isBrkBorrower=false → A=☑, B=☐", () => {
  const out = run("false");
  assertEquals(
    lastGlyphBeforeLabel(out, "A. Agent in arranging a loan"),
    "☑",
    "A row glyph should be checked when broker is NOT also borrower",
  );
  const bGlyph =
    lastGlyphBeforeLabel(out, "B. *Principal as a borrower") ??
    lastGlyphBeforeLabel(out, "B. Principal as a borrower");
  assertEquals(bGlyph, "☐", "B row glyph should be unchecked when broker is NOT also borrower");
});

Deno.test("RE851A broker-capacity — missing field leaves glyphs untouched", () => {
  const out = run(null);
  assertEquals(
    lastGlyphBeforeLabel(out, "A. Agent in arranging a loan"),
    "☐",
    "A row glyph should remain the original ☐ from the template",
  );
  const bGlyph =
    lastGlyphBeforeLabel(out, "B. *Principal as a borrower") ??
    lastGlyphBeforeLabel(out, "B. Principal as a borrower");
  assertEquals(bGlyph, "☐", "B row glyph should remain the original ☐ from the template");
});
