"use strict";

/*
 * A small test runner shared by the test pages. Each page loads this file,
 * calls test() for every test, then showResults() at the end. The page needs
 * a #summary element and a #results list.
 */

const results = [];

function test(name, fn) {
  try {
    fn();
    results.push({ name, ok: true });
  } catch (error) {
    results.push({ name, ok: false, message: error.message });
  }
}

/** Compares as JSON, ignoring the order of object keys. */
function assertEqual(actual, expected) {
  const canonical = (value) =>
    JSON.stringify(value, (key, x) =>
      x && typeof x === "object" && !Array.isArray(x)
        ? Object.fromEntries(Object.entries(x).sort())
        : x);
  if (canonical(actual) !== canonical(expected)) {
    throw new Error(`expected ${canonical(expected)}\n     got ${canonical(actual)}`);
  }
}

/** Checks that fn throws exactly errorType (not a subclass) with this message. */
function assertThrows(fn, errorType, message) {
  const expected = `${errorType.name}: ${message}`;
  try {
    fn();
  } catch (error) {
    if (error.constructor === errorType && error.message === message) return;
    throw new Error(`expected ${expected}\n     got ${error.name}: ${error.message}`);
  }
  throw new Error(`expected ${expected}\n     got no error`);
}

function showResults() {
  const list = document.getElementById("results");
  for (const r of results) {
    const item = document.createElement("li");
    item.className = r.ok ? "pass" : "fail";
    item.textContent = `${r.ok ? "PASS" : "FAIL"}  ${r.name}`;
    if (!r.ok) {
      const details = document.createElement("pre");
      details.textContent = r.message;
      item.append(details);
      console.error("FAIL", r.name, "\n" + r.message);
    }
    list.append(item);
  }
  const passed = results.filter((r) => r.ok).length;
  const summary = `${passed} of ${results.length} tests passed`;
  document.getElementById("summary").textContent = summary;
  document.getElementById("summary").className = passed === results.length ? "pass" : "fail";
  document.title = (passed === results.length ? "PASS " : "FAIL ") + summary;
}
