// Regression tests for the RE851A Part 2 broker-capacity A/B safety pass.
//
// Pins the contract that:
//   or_p_isBrkBorrower = true  -> A (Agent)     becomes ☐, B (Principal) becomes ☑
//   or_p_isBrkBorrower = false -> A (Agent)     becomes ☑, B (Principal) becomes ☐
//   or_p_isBrkBorrower missing -> glyphs are left untouched
//
// These tests intentionally exercise the same render() entry point used by
// generate-document, with XML shaped like the real re851a_v64.docx
// (literal "A. Agent in arranging a loan…" and "B. *Principal as a borrower…"
// labels with static ☐ glyphs in front of each).
//
// IMPORTANT: This file does not modify the template, the field dictionary,
// the database, or any UI. It only validates existing behavior.

import { assert, assertStringIncludes } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { render } from "./tag-parser.ts";

function buildRe851AFragment(): string {
  // Two paragraphs, one per A/B row, each with a leading static ☐ glyph in a
  // <w:t> followed by intra-paragraph XML/whitespace and the literal label.
  return [
    `<w:p><w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/></w:rPr><w:t xml:space="preserve">☐ </w:t></w:r>`,
    `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/></w:rPr><w:t xml:space="preserve">.A. Agent in arranging a loan on behalf of another</w:t></w:r></w:p>`,
    `<w:p><w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/></w:rPr><w:t xml:space="preserve">☐</w:t></w:r>`,
    `<w:r><w:rPr><w:rFonts w:ascii="Times New Roman"/></w:rPr><w:t xml:space="preserve">B. *Principal as a borrower on funds from which broker will directly or indirectly benefit</w:t></w:r></w:p>`,
  ].join("");
}

// Extract the glyph immediately preceding a label, ignoring intervening XML.
function glyphBeforeLabel(xml: string, labelStart: string): string | null {
  const idx = xml.indexOf(labelStart);
  if (idx < 0) return null;
  const before = xml.slice(0, idx);
  const match = before.match(/([☐☑☒])(?!.*[☐☑☒])/s);
  return match ? match[1] : null;
}

Deno.test("RE851A: or_p_isBrkBorrower=true forces A=☐ and B=☑", async () => {
  const xml = buildRe851AFragment();
  const fieldValues = new Map<string, { rawValue: unknown; dataType: string }>([
    ["or_p_isBrkBorrower", { rawValue: "true", dataType: "boolean" }],
  ]);

  const out = await render(xml, fieldValues as never);

  // A row glyph must be unchecked
  const aGlyph = glyphBeforeLabel(out, "A. Agent in arranging a loan");
  assert(aGlyph === "☐", `Expected A glyph ☐, got ${aGlyph}`);

  // B row glyph must be checked. Allow either literal "B. *Principal" or
  // "B. Principal" since the post-pass tolerates the optional "*".
  const bGlyph =
    glyphBeforeLabel(out, "B. *Principal as a borrower") ??
    glyphBeforeLabel(out, "B. Principal as a borrower");
  assert(bGlyph === "☑", `Expected B glyph ☑, got ${bGlyph}`);

  // Labels themselves must remain intact (no layout shift / text rewrite).
  assertStringIncludes(out, "A. Agent in arranging a loan on behalf of another");
  assertStringIncludes(out, "Principal as a borrower on funds from which broker");
});

Deno.test("RE851A: or_p_isBrkBorrower=false forces A=☑ and B=☐", async () => {
  const xml = buildRe851AFragment();
  const fieldValues = new Map<string, { rawValue: unknown; dataType: string }>([
    ["or_p_isBrkBorrower", { rawValue: "false", dataType: "boolean" }],
  ]);

  const out = await render(xml, fieldValues as never);

  const aGlyph = glyphBeforeLabel(out, "A. Agent in arranging a loan");
  assert(aGlyph === "☑", `Expected A glyph ☑, got ${aGlyph}`);

  const bGlyph =
    glyphBeforeLabel(out, "B. *Principal as a borrower") ??
    glyphBeforeLabel(out, "B. Principal as a borrower");
  assert(bGlyph === "☐", `Expected B glyph ☐, got ${bGlyph}`);
});

Deno.test("RE851A: missing or_p_isBrkBorrower leaves glyphs untouched", async () => {
  const xml = buildRe851AFragment();
  const fieldValues = new Map<string, { rawValue: unknown; dataType: string }>();

  const out = await render(xml, fieldValues as never);

  // Both glyphs should remain the original ☐ from the template.
  const aGlyph = glyphBeforeLabel(out, "A. Agent in arranging a loan");
  const bGlyph =
    glyphBeforeLabel(out, "B. *Principal as a borrower") ??
    glyphBeforeLabel(out, "B. Principal as a borrower");
  assert(aGlyph === "☐", `Expected A glyph to remain ☐, got ${aGlyph}`);
  assert(bGlyph === "☐", `Expected B glyph to remain ☐, got ${bGlyph}`);
});
