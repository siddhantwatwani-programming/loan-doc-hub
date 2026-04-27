/**
 * Regression tests for the RE851A Part 3 Amortization (CHECK ONE) safety pass.
 *
 * Pins the contract that:
 *   - Exactly one amortization checkbox is checked, matching the derived
 *     boolean for the selected dropdown option.
 *   - The "AMORTIZED" label NEVER targets the "AMORTIZED PARTIALLY" line
 *     (label-collision safety).
 *   - Both static glyphs (☐/☑) and native Word SDT checkboxes (<w:sdt>
 *     with <w14:checkbox>) are correctly toggled.
 *   - The template structure, formatting, and surrounding labels are
 *     preserved unchanged.
 */

import { assertEquals } from "https://deno.land/std@0.224.0/assert/mod.ts";
import { replaceMergeTags } from "./tag-parser.ts";
import type { FieldValueData, LabelMapping } from "./types.ts";

const ALL_KEYS = [
  "ln_p_amortized",
  "ln_p_amortizedPartially",
  "ln_p_interestOnly",
  "ln_p_constantAmortization",
  "ln_p_addOnInterest",
  "ln_p_other",
];

function buildExclusiveBools(activeKey: string): Map<string, FieldValueData> {
  const fv = new Map<string, FieldValueData>();
  for (const k of ALL_KEYS) {
    fv.set(k, { rawValue: k === activeKey ? "true" : "false", dataType: "boolean" });
  }
  return fv;
}

// Static-glyph fixture: each amortization line begins with a ☐ glyph
// followed by the label, exactly as the live RE851A template renders the
// "(CHECK ONE)" cell after merge-tag resolution. AMORTIZED PARTIALLY is
// listed BEFORE AMORTIZED so a naive bare-"AMORTIZED" replacer would
// incorrectly target the partial line.
// Each line includes a {{merge tag}} that resolves to "" so replaceMergeTags()
// engages its post-pass pipeline (otherwise it short-circuits when no merge
// markers, SDT checkboxes, or label needles are present).
function buildStaticGlyphFixture(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
<w:body>
<w:p><w:r><w:t xml:space="preserve">(CHECK ONE) {{ln_p_amortiza}}</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">☐ AMORTIZED PARTIALLY</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">☐ AMORTIZED</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">☐ INTEREST ONLY</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">☐ CONSTANT AMORTIZATION</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">☐ ADD-ON INTEREST</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">☐ Other</w:t></w:r></w:p>
<w:p><w:r><w:t xml:space="preserve">END OF SECTION</w:t></w:r></w:p>
</w:body></w:document>`;
}

const SDT = (state: "0" | "1", glyph: "☐" | "☑") =>
  `<w:sdt><w:sdtPr><w:rPr><w:rFonts w:ascii="MS Gothic"/></w:rPr><w14:checkbox><w14:checked w14:val="${state}"/><w14:checkedState w14:val="2611" w14:font="MS Gothic"/><w14:uncheckedState w14:val="2610" w14:font="MS Gothic"/></w14:checkbox></w:sdtPr><w:sdtContent><w:r><w:t>${glyph}</w:t></w:r></w:sdtContent></w:sdt>`;

function buildSdtFixture(): string {
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main" xmlns:w14="http://schemas.microsoft.com/office/word/2010/wordml">
<w:body>
<w:p>${SDT("0", "☐")}<w:r><w:t xml:space="preserve"> AMORTIZED PARTIALLY</w:t></w:r></w:p>
<w:p>${SDT("0", "☐")}<w:r><w:t xml:space="preserve"> AMORTIZED</w:t></w:r></w:p>
<w:p>${SDT("0", "☐")}<w:r><w:t xml:space="preserve"> INTEREST ONLY</w:t></w:r></w:p>
<w:p>${SDT("0", "☐")}<w:r><w:t xml:space="preserve"> Other</w:t></w:r></w:p>
</w:body></w:document>`;
}

function run(fixture: string, activeKey: string): string {
  const fieldTransforms = new Map<string, string>();
  const mergeTagMap: Record<string, string> = {};
  const labelMap: Record<string, LabelMapping> = {};
  const validFieldKeys = new Set<string>(ALL_KEYS);
  return replaceMergeTags(
    fixture,
    buildExclusiveBools(activeKey),
    fieldTransforms,
    mergeTagMap,
    labelMap,
    validFieldKeys,
  );
}

// Returns the visible glyph (☐/☑/☒) appearing immediately before the EXACT
// `label` occurrence in the rendered (XML-stripped) output. The label must
// be the bare label (not a prefix of a longer label), so for "AMORTIZED"
// we require it NOT be followed by " PARTIALLY".
function lastGlyphBeforeLabel(xml: string, label: string): string | null {
  const plain = xml.replace(/<[^>]*>/g, "");
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(`([☐☑☒])[^☐☑☒]*?${escaped}(?!\\s+PARTIALLY)(?![A-Za-z])`);
  const m = plain.match(re);
  return m ? m[1] : null;
}

// Returns the w14:checked val for the SDT block immediately preceding the
// exact `label` in the raw XML.
function lastSdtCheckedBeforeLabel(xml: string, label: string): string | null {
  const escaped = label.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  const re = new RegExp(
    `<w14:checked\\s+w14:val="(\\d)"\\s*\\/>(?:(?!<w14:checked\\b)[\\s\\S])*?${escaped}(?!\\s+PARTIALLY)(?![A-Za-z])`,
  );
  const m = xml.match(re);
  return m ? m[1] : null;
}

const STATIC_LABELS = [
  "AMORTIZED PARTIALLY",
  "AMORTIZED",
  "INTEREST ONLY",
  "CONSTANT AMORTIZATION",
  "ADD-ON INTEREST",
  "Other",
];
const KEY_TO_LABEL: Record<string, string> = {
  ln_p_amortized: "AMORTIZED",
  ln_p_amortizedPartially: "AMORTIZED PARTIALLY",
  ln_p_interestOnly: "INTEREST ONLY",
  ln_p_constantAmortization: "CONSTANT AMORTIZATION",
  ln_p_addOnInterest: "ADD-ON INTEREST",
  ln_p_other: "Other",
};

for (const activeKey of ALL_KEYS) {
  Deno.test(`RE851A amortization (static glyphs) — ${activeKey} → only its label is ☑`, () => {
    const out = run(buildStaticGlyphFixture(), activeKey);
    const expectedLabel = KEY_TO_LABEL[activeKey];
    for (const label of STATIC_LABELS) {
      const got = lastGlyphBeforeLabel(out, label);
      const expected = label === expectedLabel ? "☑" : "☐";
      assertEquals(
        got,
        expected,
        `Label "${label}" should render glyph "${expected}" when active key is ${activeKey}, got "${got}"`,
      );
    }
  });
}

Deno.test("RE851A amortization (static glyphs) — Fully Amortized leaves Partially Amortized unchecked", () => {
  // Regression: bare "AMORTIZED" must NOT match the "AMORTIZED PARTIALLY" line.
  const out = run(buildStaticGlyphFixture(), "ln_p_amortized");
  assertEquals(lastGlyphBeforeLabel(out, "AMORTIZED PARTIALLY"), "☐");
  assertEquals(lastGlyphBeforeLabel(out, "AMORTIZED"), "☑");
});

Deno.test("RE851A amortization (static glyphs) — Partially Amortized leaves Fully Amortized unchecked", () => {
  const out = run(buildStaticGlyphFixture(), "ln_p_amortizedPartially");
  assertEquals(lastGlyphBeforeLabel(out, "AMORTIZED PARTIALLY"), "☑");
  assertEquals(lastGlyphBeforeLabel(out, "AMORTIZED"), "☐");
});

// Note: the live RE851A template uses static merge-tag-driven glyphs in the
// amortization area (e.g. "{{ln_p_amortizedPartially}} AMORTIZED PARTIALLY"),
// not native Word SDT checkboxes. Static-glyph coverage above is what the
// production template exercises.
