// Targeted tests for RE851A Servicing-section checkbox resolution.
//
// Validates that (eq sv_p_servicingAgent "...") AND (or (eq …) (eq …))
// helpers both resolve correctly so exactly one of the three Servicing
// checkboxes is ☑ and the other two are ☐.

import { processConditionalBlocks } from "./tag-parser.ts";

import type { FieldValueData } from "./types.ts";

function fixture(servicingAgent: string): string {
  return [
    `{{#if (eq sv_p_servicingAgent "Lender")}} ☑ {{else}} ☐ {{/if}} THERE ARE NO SERVICING ARRANGEMENTS`,
    `{{#if (eq sv_p_servicingAgent "Broker")}} ☑ {{else}} ☐ {{/if}} BROKER IS THE SERVICING AGENT`,
    `{{#if (or (eq sv_p_servicingAgent "Company") (eq sv_p_servicingAgent "Other Servicer"))}} ☑ {{else}} ☐ {{/if}} ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN`,
  ].join("\n");
}

function fieldsFor(value: string): Map<string, FieldValueData> {
  const m = new Map<string, FieldValueData>();
  m.set("sv_p_servicingAgent", { rawValue: value, dataType: "text" });
  return m;
}

function assertOnlyOneChecked(out: string, expectedCheckedLabel: string) {
  const lines = out.split("\n").map((l) => l.trim()).filter(Boolean);
  const checkedLines = lines.filter((l) => l.includes("☑"));
  const uncheckedLines = lines.filter((l) => l.includes("☐"));
  if (checkedLines.length !== 1) {
    throw new Error(`Expected exactly 1 ☑ line, got ${checkedLines.length}\n${out}`);
  }
  if (uncheckedLines.length !== 2) {
    throw new Error(`Expected exactly 2 ☐ lines, got ${uncheckedLines.length}\n${out}`);
  }
  if (!checkedLines[0].includes(expectedCheckedLabel)) {
    throw new Error(`Expected ☑ on "${expectedCheckedLabel}", got "${checkedLines[0]}"`);
  }
  if (out.includes("{{") || out.includes("}}")) {
    throw new Error(`Residual merge tags in output:\n${out}`);
  }
}

const cases: Array<[string, string]> = [
  ["Lender", "THERE ARE NO SERVICING ARRANGEMENTS"],
  ["Broker", "BROKER IS THE SERVICING AGENT"],
  ["Company", "ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN"],
  ["Other Servicer", "ANOTHER QUALIFIED PARTY WILL SERVICE THE LOAN"],
];

let passed = 0;
let failed = 0;
for (const [agent, expectedLabel] of cases) {
  try {
    const out = processConditionalBlocks(fixture(agent), fieldsFor(agent), {}, undefined);
    assertOnlyOneChecked(out, expectedLabel);
    console.log(`✓ ${agent} → ${expectedLabel}`);
    passed++;
  } catch (e) {
    console.error(`✗ ${agent}: ${(e as Error).message}`);
    failed++;
  }
}

console.log(`\n${passed}/${passed + failed} servicing-checkbox cases passed`);
if (failed > 0) Deno.exit(1);
