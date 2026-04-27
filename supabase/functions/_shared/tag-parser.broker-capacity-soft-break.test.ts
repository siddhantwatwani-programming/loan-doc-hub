// Regression test for the RE851A Part 2 "Is Broker also a Borrower?" A/B
// soft-break paragraph-split normalization.
//
// Pins the contract that when the template author placed the A. Agent and
// B. Principal lines inside the SAME <w:p> separated only by a soft line
// break (<w:br/>), the document generation engine:
//   1. Splits the paragraph into two real <w:p> blocks (so each checkbox
//      lives in its own paragraph and cannot be collapsed by any dedup
//      pass or SDT conversion).
//   2. Forces the correct glyph for each (A=☐ B=☑ when isBrkBorrower=true,
//      A=☑ B=☐ when false).
//   3. Both A and B checkbox glyphs are present in the output (Option B
//      must never be missing).
//
// No template, schema, UI, or other field mappings are touched.

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { replaceMergeTags } from "./tag-parser.ts";
import type { FieldValueData, LabelMapping } from "./types.ts";

function buildSoftBreakFixture(): string {
  // Both A and B lines live inside ONE <w:p>, separated by <w:br/>.
  // Each line has a static ☐ glyph immediately before its label, mirroring
  // the failure-mode the user reported. A dummy <w:sdt> checkbox is added
  // outside the A/B paragraph so replaceMergeTags() actually enters its
  // post-processing pipeline (it early-returns when no merge markers /
  // SDT / labelMap matches are present).
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
<w:body>
<w:p><w:r><w:t xml:space="preserve">PART 2  BROKER CAPACITY IN TRANSACTION</w:t></w:r></w:p>
<w:p>
<w:pPr><w:jc w:val="left"/></w:pPr>
<w:r><w:rPr><w:rFonts w:ascii="Arial"/></w:rPr><w:t>☐</w:t></w:r>
<w:r><w:rPr><w:rFonts w:ascii="Arial"/></w:rPr><w:t xml:space="preserve"> A. Agent in arranging a loan on behalf of another</w:t></w:r>
<w:r><w:rPr><w:rFonts w:ascii="Arial"/></w:rPr><w:br/></w:r>
<w:r><w:rPr><w:rFonts w:ascii="Arial"/></w:rPr><w:t>☐</w:t></w:r>
<w:r><w:rPr><w:rFonts w:ascii="Arial"/></w:rPr><w:t xml:space="preserve"> B. *Principal as a borrower on funds from which broker will directly or indirectly benefit</w:t></w:r>
</w:p>
<w:p><w:sdt><w:sdtPr><w14:checkbox><w14:checked w14:val="0"/></w14:checkbox></w:sdtPr><w:sdtContent><w:r><w:t>☐</w:t></w:r></w:sdtContent></w:sdt><w:r><w:t xml:space="preserve"> sentinel</w:t></w:r></w:p>
<w:p><w:r><w:t>PART 3 LOAN INFORMATION</w:t></w:r></w:p>
</w:body></w:document>`;
}

function run(value: "true" | "false"): string {
  const fieldValues = new Map<string, FieldValueData>();
  fieldValues.set("or_p_isBrkBorrower", { rawValue: value, dataType: "boolean" });
  return replaceMergeTags(
    buildSoftBreakFixture(),
    fieldValues,
    new Map<string, string>(),
    {},
    {} as Record<string, LabelMapping>,
    new Set<string>(["or_p_isBrkBorrower"]),
  );
}

function lastGlyphBeforeLabel(xml: string, label: string): string | null {
  const plain = xml.replace(/<[^>]*>/g, "");
  const idx = plain.indexOf(label);
  if (idx < 0) return null;
  const region = plain.substring(0, idx);
  const matches = region.match(/[☐☑☒]/g);
  return matches ? matches[matches.length - 1] : null;
}

function lastNativeCheckboxStateBeforeLabel(xml: string, labelRegex: RegExp): string | null {
  const paras = xml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) ?? [];
  for (const para of paras) {
    if (!labelRegex.test(para.replace(/<[^>]*>/g, ""))) continue;
    const states = [...para.matchAll(/<w14:checked\s+w14:val="([01])"\s*\/>/g)].map((m) => m[1]);
    return states.length ? states[states.length - 1] : null;
  }
  return null;
}

function countParagraphsContainingLabel(xml: string, labelRegex: RegExp): number {
  const paras = xml.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) ?? [];
  return paras.filter((p) => labelRegex.test(p.replace(/<[^>]*>/g, ""))).length;
}

Deno.test("soft-break A/B — true: paragraph is split AND A=☐, B=☑", () => {
  const out = run("true");

  // 1. The single shared <w:p> must be split into two — one for A, one for B.
  const aParas = countParagraphsContainingLabel(out, /A\.\s*Agent in arranging a loan/i);
  const bParas = countParagraphsContainingLabel(out, /B\.\s*\*?\s*Principal as a borrower/i);
  assertEquals(aParas, 1, "A label must live in its own <w:p>");
  assertEquals(bParas, 1, "B label must live in its own <w:p>");
  // And the A and B paragraphs must NOT be the same paragraph.
  const sharedParas = (out.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) ?? []).filter((p) => {
    const t = p.replace(/<[^>]*>/g, "");
    return /A\.\s*Agent in arranging a loan/i.test(t) &&
      /B\.\s*\*?\s*Principal as a borrower/i.test(t);
  });
  assertEquals(sharedParas.length, 0, "A and B must NOT remain in the same <w:p>");

  // 2. Both checkbox glyphs must be present and correctly toggled.
  assertEquals(
    lastGlyphBeforeLabel(out, "A. Agent in arranging a loan"),
    "☐",
    "A glyph must be ☐ when broker is also a borrower",
  );
  const bGlyph =
    lastGlyphBeforeLabel(out, "*Principal as a borrower") ??
    lastGlyphBeforeLabel(out, "Principal as a borrower");
  assertEquals(bGlyph, "☑", "B glyph must be ☑ (and present) when broker is also a borrower");
  assertEquals(
    lastNativeCheckboxStateBeforeLabel(out, /B\.\s*\*?\s*Principal as a borrower/i),
    "1",
    "B native Word checkbox state must be checked when broker is also a borrower",
  );
});

Deno.test("soft-break A/B — false: paragraph is split AND A=☑, B=☐", () => {
  const out = run("false");

  const aParas = countParagraphsContainingLabel(out, /A\.\s*Agent in arranging a loan/i);
  const bParas = countParagraphsContainingLabel(out, /B\.\s*\*?\s*Principal as a borrower/i);
  assertEquals(aParas, 1);
  assertEquals(bParas, 1);

  assertEquals(
    lastGlyphBeforeLabel(out, "A. Agent in arranging a loan"),
    "☑",
    "A glyph must be ☑ when broker is NOT also a borrower",
  );
  const bGlyph =
    lastGlyphBeforeLabel(out, "*Principal as a borrower") ??
    lastGlyphBeforeLabel(out, "Principal as a borrower");
  assertEquals(bGlyph, "☐", "B glyph must be ☐ (and present) when broker is NOT also a borrower");
  assertEquals(
    lastNativeCheckboxStateBeforeLabel(out, /B\.\s*\*?\s*Principal as a borrower/i),
    "0",
    "B native Word checkbox state must be unchecked when broker is not also a borrower",
  );
});

Deno.test("soft-break A/B — split paragraphs enforce 0pt before/after, single line spacing", () => {
  const out = run("true");
  const paras = (out.match(/<w:p\b[^>]*>[\s\S]*?<\/w:p>/g) ?? []).filter((p) => {
    const t = p.replace(/<[^>]*>/g, "");
    return /A\.\s*Agent in arranging a loan/i.test(t) ||
      /B\.\s*\*?\s*Principal as a borrower/i.test(t);
  });
  for (const p of paras) {
    const m = p.match(/<w:spacing\b([^/]*)\/>/);
    if (!m) throw new Error(`Expected <w:spacing/> in split paragraph:\n${p}`);
    const attrs = m[1];
    if (!/w:before="0"/.test(attrs)) throw new Error(`Expected w:before="0" in: ${attrs}`);
    if (!/w:after="0"/.test(attrs)) throw new Error(`Expected w:after="0" in: ${attrs}`);
    if (!/w:line="240"/.test(attrs)) throw new Error(`Expected w:line="240" (single) in: ${attrs}`);
    if (!/w:lineRule="auto"/.test(attrs)) throw new Error(`Expected w:lineRule="auto" in: ${attrs}`);
  }
});
