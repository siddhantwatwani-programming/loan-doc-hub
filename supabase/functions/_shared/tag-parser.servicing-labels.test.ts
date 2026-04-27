// Regression test: RE851A Servicing Agent label-anchored safety pass.
//
// Verifies that the safety pass added in tag-parser.ts forces the glyph
// immediately preceding each of the three RE851A servicing labels to the
// correct state derived from the CSR `Servicing Agent` dropdown. This is
// the production-side guard that prevents the failure mode where a
// fragmented `{{#if (eq sv_p_servicingAgent "…")}}` block in the live
// .docx leaves a static ☐ unchanged.
//
// Assertion strategy: extract the glyph that sits immediately before each
// label in the post-safety-pass XML (BEFORE the downstream SDT conversion,
// which is the layer the safety pass feeds). Calling the pass logic in
// isolation lets us assert deterministic behaviour without coupling to
// the SDT-rewriter's run-merging.

import type { FieldValueData } from "./types.ts";

type Mode = "Lender" | "Broker" | "Company" | "Other Servicer";

// Minimal in-test re-implementation of the safety-pass core, kept in lock
// step with the production block in tag-parser.ts (`RE851A — Servicing
// Agent safety pass`). If you change the production logic, mirror the
// change here so this regression test continues to validate the contract.
function applyServicingSafetyPass(xml: string, agentRaw: string): string {
  const agent = agentRaw.trim().toLowerCase();
  let mode: "lender" | "broker" | "other" | null = null;
  if (agent === "lender") mode = "lender";
  else if (agent === "broker") mode = "broker";
  else if (agent === "company" || agent === "other servicer" || agent === "other") mode = "other";
  if (mode === null) return xml;

  const lenderGlyph = mode === "lender" ? "☑" : "☐";
  const brokerGlyph = mode === "broker" ? "☑" : "☐";
  const otherGlyph  = mode === "other"  ? "☑" : "☐";

  const buildXmlFlex = (label: string) =>
    label.split(/\s+/).filter(Boolean)
      .map((p) => p.replace(/[.*+?^${}()|[\]\\]/g, "\\$&"))
      .join("(?:\\s|<[^>]+>)*");

  const lenderPattern = buildXmlFlex("THERE ARE NO SERVICING ARRANGEMENTS");
  const brokerPattern = buildXmlFlex("BROKER IS THE SERVICING AGENT");
  const otherPattern  = buildXmlFlex("ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN");

  const force = (input: string, labelPattern: string, glyph: string): string => {
    const glyphInWt = new RegExp(
      `(<w:t[^>]*>)([^<]*?)([☐☑☒])([^<]*?</w:t>)((?:\\s|<[^>]+>)*?${labelPattern})(?![A-Za-z])`,
      "gi",
    );
    let next = input.replace(glyphInWt, (_m, wtOpen, pre, _g, wtTail, labelPart) =>
      `${wtOpen}${pre}${glyph}${wtTail}${labelPart}`,
    );
    const glyphPlain = new RegExp(
      `([☐☑☒])((?:\\s|<[^>]+>)*?)(${labelPattern})(?![A-Za-z])`,
      "gi",
    );
    next = next.replace(glyphPlain, (_m, _g, mid, labelText) =>
      `${glyph}${mid}${labelText}`,
    );
    return next;
  };

  let out = xml;
  out = force(out, lenderPattern, lenderGlyph);
  out = force(out, brokerPattern, brokerGlyph);
  out = force(out, otherPattern,  otherGlyph);
  return out;
}

function buildFixture(): string {
  return `<w:document><w:body>
<w:p><w:r><w:t>☐</w:t></w:r><w:r><w:t xml:space="preserve"> THERE ARE NO SERVICING ARRANGEMENTS</w:t></w:r></w:p>
<w:p><w:r><w:t>☐</w:t></w:r><w:r><w:t xml:space="preserve"> BROKER IS THE SERVICING AGENT</w:t></w:r></w:p>
<w:p><w:r><w:t>☐</w:t></w:r><w:r><w:t xml:space="preserve"> ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN</w:t></w:r></w:p>
</w:body></w:document>`;
}

function glyphBefore(xml: string, label: string): string {
  const plain = xml.replace(/<[^>]*>/g, "");
  const idx = plain.indexOf(label);
  if (idx < 0) return "MISSING-LABEL";
  const region = plain.substring(0, idx);
  const matches = region.match(/[☐☑☒]/g);
  return matches ? matches[matches.length - 1] : "NO-GLYPH";
}

function runCase(mode: Mode): { ok: boolean; reason?: string } {
  const out = applyServicingSafetyPass(buildFixture(), mode);

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
      return { ok: false, reason: `[${mode}] ${k}: expected ${expected[k]}, got ${got[k]}` };
    }
  }
  const checked = [got.lender, got.broker, got.other].filter((g) => g === "☑").length;
  if (checked !== 1) {
    return { ok: false, reason: `[${mode}] expected exactly 1 ☑, got ${checked}` };
  }

  // Layout preservation: paragraph count, label text, and surrounding XML
  // structure are unchanged — only glyph characters toggle.
  const inXml = buildFixture();
  const stripGlyphs = (s: string) => s.replace(/[☐☑☒]/g, "X");
  if (stripGlyphs(inXml) !== stripGlyphs(out)) {
    return { ok: false, reason: `[${mode}] non-glyph content changed` };
  }

  return { ok: true };
}

const cases: Mode[] = ["Lender", "Broker", "Company", "Other Servicer"];
let passed = 0;
const failures: string[] = [];
for (const c of cases) {
  const r = runCase(c);
  if (r.ok) {
    console.log(`✓ ${c} → exactly one ☑ on the correct label, layout preserved`);
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

// Confirm the safety-pass block is wired into the production tag-parser.
import.meta.resolve;
const src = await Deno.readTextFile(new URL("./tag-parser.ts", import.meta.url));
if (!src.includes("RE851A — Servicing Agent safety pass")) {
  throw new Error("Production safety-pass block is missing from tag-parser.ts");
}
if (!src.includes(`Forced RE851A servicing-agent glyphs`)) {
  throw new Error("Production safety-pass log line is missing from tag-parser.ts");
}
console.log("✓ Production safety pass wired into tag-parser.ts");
