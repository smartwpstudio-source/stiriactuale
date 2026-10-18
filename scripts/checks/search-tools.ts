// npx tsx scripts/checks/search-tools.ts
import assert from "node:assert/strict";
import { matchTools, searchTerms } from "../../src/lib/search/tools";

const items = [
  { title: "Salariul net", description: "Cât primești „în mână” din salariul brut" },
  { title: "Pensiile în Moldova", description: "Vârsta de pensionare, stagiul, indexarea" },
];
assert.deepEqual(searchTerms("Calculator Salariu"), ["salar"]);
assert.equal(matchTools(items, searchTerms("Calculator Salariu"), 5).length, 1);
assert.equal(matchTools(items, searchTerms("pensii moldova"), 5)[0].title, "Pensiile în Moldova");
assert.equal(matchTools(items, searchTerms("ghid"), 5).length, 0);
assert.equal(matchTools(items, searchTerms("salariu pensie"), 5).length, 0);
console.log("search-tools: OK");
