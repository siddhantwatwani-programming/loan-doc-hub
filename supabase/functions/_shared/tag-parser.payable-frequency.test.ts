// Regression test: RE851A "Payable" (Monthly / Annually) safety pass.
// Mirrors the pattern of tag-parser.servicing-labels.test.ts.
//
// Verifies that — even when the template's
//   {{#if (eq loan_terms.servicing.payable_annually "Monthly")}}…
// conditional blocks are fragmented across <w:r>/<w:t>/SDT runs and end up
// resolving to a static ☐ — the post-processing safety pass forces the
// glyph immediately preceding each literal "Monthly" / "Annually" label
// to the correct state derived from the dropdown selection.
import { processTemplate } from "./tag-parser.ts";

function fixture(): string {
  // Worst-case: both glyphs left as ☐ after conditional resolution.
  return [
    `<w:p><w:r><w:t>☐</w:t></w:r><w:r><w:t> Monthly</w:t></w:r></w:p>`,
    `<w:p><w:r><w:t>☐</w:t></w:r><w:r><w:t> Annually</w:t></w:r></w:p>`,
  ].join("");
}

function fieldMap(value: string): Map<string, { rawValue: string; dataType: string }> {
  const m = new Map<string, { rawValue: string; dataType: string }>();
  m.set("loan_terms.servicing.payable_annually", { rawValue: value, dataType: "text" });
  return m;
}

Deno.test("RE851A Payable safety pass: Monthly checks Monthly, leaves Annually unchecked", async () => {
  const out = await processTemplate(fixture(), fieldMap("Monthly"));
  // Glyph immediately before "Monthly" must be ☑; before "Annually" must be ☐.
  if (!/☑[\s\S]*?Monthly/.test(out)) {
    throw new Error(`Expected ☑ before Monthly, got:\n${out}`);
  }
  if (!/☐[\s\S]*?Annually/.test(out)) {
    throw new Error(`Expected ☐ before Annually, got:\n${out}`);
  }
});

Deno.test("RE851A Payable safety pass: Annually checks Annually, leaves Monthly unchecked", async () => {
  const out = await processTemplate(fixture(), fieldMap("Annually"));
  if (!/☐[\s\S]*?Monthly/.test(out)) {
    throw new Error(`Expected ☐ before Monthly, got:\n${out}`);
  }
  if (!/☑[\s\S]*?Annually/.test(out)) {
    throw new Error(`Expected ☑ before Annually, got:\n${out}`);
  }
});

Deno.test("RE851A Payable safety pass: unset dropdown leaves glyphs untouched", async () => {
  const out = await processTemplate(fixture(), new Map());
  // Both should remain ☐.
  if ((out.match(/☑/g) || []).length !== 0) {
    throw new Error(`Expected no ☑ when dropdown is unset, got:\n${out}`);
  }
});
