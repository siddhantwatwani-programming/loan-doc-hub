// Regression test: RE851A "Payable" (Monthly / Annually) label-anchored
// safety pass. Mirrors the contract enforced by the production block in
// tag-parser.ts (`RE851A — Payable (Monthly / Annually) safety pass`).
// If you change the production logic, mirror the change here.
//
// Verifies that — even when the template's
//   {{#if (eq loan_terms.servicing.payable_annually "Monthly")}}…
// conditional blocks are fragmented across <w:r>/<w:t> runs and end up
// resolving to a static ☐ — the post-processing safety pass forces the
// glyph immediately preceding each literal "Monthly" / "Annually" label
// to the correct state derived from the dropdown selection.

function applyPayableSafetyPass(xml: string, payableRaw: string): string {
  const payable = String(payableRaw).trim().toLowerCase();
  let mode: "monthly" | "annually" | null = null;
  if (payable === "monthly") mode = "monthly";
  else if (payable === "annually" || payable === "annual" || payable === "yearly") mode = "annually";
  if (mode === null) return xml;

  const monthlyGlyph  = mode === "monthly"  ? "☑" : "☐";
  const annuallyGlyph = mode === "annually" ? "☑" : "☐";

  const buildXmlFlex = (label: string) =>
    label.split(/\s+/).filter(Boolean)
      .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("(?:\\s|<[^>]+>)*");

  const monthlyPattern  = `(?<![A-Za-z])${buildXmlFlex("Monthly")}(?![A-Za-z])`;
  const annuallyPattern = `(?<![A-Za-z])${buildXmlFlex("Annually")}(?![A-Za-z])`;

  const force = (input: string, labelPattern: string, glyph: string): string => {
    const glyphInWt = new RegExp(
      `(<w:t[^>]*>)([^<]*?)([☐☑☒])([^<]*?</w:t>)((?:\\s|<[^>]+>)*?${labelPattern})`,
      "gi",
    );
    let next = input.replace(glyphInWt, (_m, wtOpen, pre, _g, wtTail, labelPart) =>
      `${wtOpen}${pre}${glyph}${wtTail}${labelPart}`,
    );
    const glyphPlain = new RegExp(
      `([☐☑☒])((?:\\s|<[^>]+>)*?)(${labelPattern})`,
      "gi",
    );
    next = next.replace(glyphPlain, (_m, _g, mid, labelText) =>
      `${glyph}${mid}${labelText}`,
    );
    return next;
  };

  let out = xml;
  out = force(out, monthlyPattern,  monthlyGlyph);
  out = force(out, annuallyPattern, annuallyGlyph);
  return out;
}

function fixture(): string {
  // Worst-case: both glyphs left as ☐ after conditional resolution,
  // labels in separate <w:t> runs (typical Word fragmentation).
  return [
    `<w:p><w:r><w:t>☐</w:t></w:r><w:r><w:t> Monthly</w:t></w:r></w:p>`,
    `<w:p><w:r><w:t>☐</w:t></w:r><w:r><w:t> Annually</w:t></w:r></w:p>`,
  ].join("");
}

Deno.test("Payable=Monthly: ☑ Monthly, ☐ Annually", () => {
  const out = applyPayableSafetyPass(fixture(), "Monthly");
  if (!/☑[\s\S]*?Monthly/.test(out)) throw new Error(`Expected ☑ before Monthly, got:\n${out}`);
  if (!/☐[\s\S]*?Annually/.test(out)) throw new Error(`Expected ☐ before Annually, got:\n${out}`);
});

Deno.test("Payable=Annually: ☐ Monthly, ☑ Annually", () => {
  const out = applyPayableSafetyPass(fixture(), "Annually");
  if (!/☐[\s\S]*?Monthly/.test(out)) throw new Error(`Expected ☐ before Monthly, got:\n${out}`);
  if (!/☑[\s\S]*?Annually/.test(out)) throw new Error(`Expected ☑ before Annually, got:\n${out}`);
});

Deno.test("Payable unset: glyphs untouched (no ☑ introduced)", () => {
  const out = applyPayableSafetyPass(fixture(), "");
  if ((out.match(/☑/g) || []).length !== 0) throw new Error(`Expected no ☑ when unset, got:\n${out}`);
});

Deno.test("Payable=Quarterly: Monthly/Annually glyphs untouched", () => {
  const out = applyPayableSafetyPass(fixture(), "Quarterly");
  if ((out.match(/☑/g) || []).length !== 0) throw new Error(`Expected no ☑ for Quarterly, got:\n${out}`);
});

Deno.test("Word-boundary guard: 'Bimonthly' / 'Semiannually' are NOT touched", () => {
  const xml = `<w:p><w:r><w:t>☐ Bimonthly</w:t></w:r></w:p><w:p><w:r><w:t>☐ Semiannually</w:t></w:r></w:p>`;
  const out = applyPayableSafetyPass(xml, "Monthly");
  if ((out.match(/☑/g) || []).length !== 0) throw new Error(`Word-boundary guard failed:\n${out}`);
});
