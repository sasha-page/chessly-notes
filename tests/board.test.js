import { describe, test, expect } from "vitest";
import { square, idOf } from "./support/board.js";

/*
 * Tests for the board fixtures in tests/support/board.js. Each expected value
 * is written out in full, and the ids come from the site's sample files.
 */

describe("square", () => {
  // Turns a square name into the site's row and column. a1 and h8 have a
  // different row and column, so they catch row and column being swapped.

  for (const [name, expected] of [
    ["a1", { row: 7, col: 0 }],
    ["h8", { row: 0, col: 7 }],
    ["e4", { row: 4, col: 4 }],
  ]) {
    test(`"${name}" → row ${expected.row}, col ${expected.col}`, () => {
      expect(square(name)).toStrictEqual(expected);
    });
  }
});

describe("idOf", () => {
  // Gives the id the site uses for a square. "70" and "07" are the ids of the
  // rooks on a1 and h8 in starting_position.html.

  for (const [name, expected] of [
    ["a1", "70"],
    ["h8", "07"],
    ["e4", "44"],
  ]) {
    test(`"${name}" → "${expected}"`, () => {
      expect(idOf(name)).toBe(expected);
    });
  }
});
