// Regression test: RE851A Servicing Agent label-anchored safety pass.
// Asserts that the glyph immediately preceding each of the three literal
// servicing labels is forced to ☑/☐ based on the dropdown — even when the
// template's {{#if (eq …)}} blocks have already collapsed to a static ☐
// (the failure mode reported by CSR).

import { replaceMergeTags } from "./tag-parser.ts";

type Mode = "Lender" | "Broker" | "Company" | "Other Servicer";

function buildFixture(): string {
  // Mimic the live RE851A run/SDT fragmentation: each glyph is in its own
  // <w:r>/<w:t>, the label follows in the next run, and one <w:sdt> sentinel
  // appears in the doc so replaceMergeTags enters the post-processing path.
  return `<?xml version="1.0" encoding="UTF-8" standalone="yes"?>
<w:document xmlns:w="http://schemas.openxmlformats.org/wordprocessingml/2006/main">
<w:body>
<w:sdt><w:sdtPr><w:tag w:val="sentinel"/></w:sdtPr><w:sdtContent><w:r><w:t>x</w:t></w:r></w:sdtContent></w:sdt>
<w:p><w:r><w:t>☐</w:t></w:r><w:r><w:t xml:space="preserve"> THERE ARE NO SERVICING ARRANGEMENTS</w:t></w:r></w:p>
<w:p><w:r><w:t>☐</w:t></w:r><w:r><w:t xml:space="preserve"> BROKER IS THE SERVICING AGENT</w:t></w:r></w:p>
<w:p><w:r><w:t>☐</w:t></w:r><w:r><w:t xml:space="preserve"> ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN</w:t></w:r></w:p>
</w:body>
</w:document>`;
}

function glyphBefore(xml: string, label: string): string {
  // Find label, then walk back to the nearest checkbox glyph.
  const idx = xml.indexOf(label);
  if (idx < 0) return "MISSING-LABEL";
  const before = xml.slice(0, idx);
  const m = before.match(/[☐☑☒](?!.*[☐☑☒])/s);
  return m ? m[0] : "NO-GLYPH";
}

function runCase(mode: Mode): { ok: boolean; reason?: string } {
  const xml = buildFixture();
  const fieldValues = new Map<string, { rawValue: unknown; dataType: string }>();
  fieldValues.set("sv_p_servicingAgent", { rawValue: mode, dataType: "text" });
  fieldValues.set("oo_svc_servicingAgent", { rawValue: mode, dataType: "text" });

  const out = replaceMergeTags(xml, fieldValues);

  const expected = {
    lender: mode === "Lender" ? "☑" : "☐",
    broker: mode === "Broker" ? "☑" : "☐",
    other:  (mode === "Company" || mode === "Other Servicer") ? "☑" : "☐",
  };

  const got = {
    lender: glyphBefore(out, "THERE ARE NO SERVICING ARRANGEMENTS"),
    broker: glyphBefore(out, "BROKER IS THE SERVICING AGENT"),
    other:  glyphBefore(out, "ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN"),
  };

  for (const k of ["lender", "broker", "other"] as const) {
    if (got[k] !== expected[k]) {
      return {
        ok: false,
        reason: `[${mode}] ${k}: expected ${expected[k]}, got ${got[k]}`,
      };
    }
  }

  // Exactly one ☑ across the three label lines.
  const checked = [got.lender, got.broker, got.other].filter((g) => g === "☑").length;
  if (checked !== 1) {
    return { ok: false, reason: `[${mode}] expected exactly 1 ☑, got ${checked}` };
  }
  return { ok: true };
}

const cases: Mode[] = ["Lender", "Broker", "Company", "Other Servicer"];
let passed = 0;
const failures: string[] = [];
for (const c of cases) {
  const r = runCase(c);
  if (r.ok) {
    console.log(`✓ ${c} → exactly one ☑ on the correct label line`);
    passed++;
  } else {
    console.log(`✗ ${c}: ${r.reason}`);
    failures.push(c);
  }
}
console.log(`\n${passed}/${cases.length} RE851A servicing-label cases passed`);
if (failures.length > 0) {
  throw new Error(`Servicing-label safety pass failed for: ${failures.join(", ")}`);
}
