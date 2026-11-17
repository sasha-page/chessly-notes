import { expect } from "vitest";

/**
 * Checks that fn throws exactly errorType (not a subclass) with exactly this
 * message. Vitest's toThrow accepts subclasses and, given a string, any
 * message that contains it.
 */
export function expectThrowsExactly(fn, errorType, message) {
  let error;
  try {
    fn();
  } catch (caught) {
    error = caught;
  }
  expect(error, `expected ${errorType.name}: ${message}, got no error`).toBeDefined();
  expect(`${error.constructor.name}: ${error.message}`).toBe(`${errorType.name}: ${message}`);
  expect(error.constructor).toBe(errorType);
}
