import { describe, test, expect } from "vitest";
import { ChessNotesPosition } from "../src/position.js";

/*
 * Unit tests for findBoard and the helpers in src/position.js. Each test
 * writes its own input inline, only what the function reads. The
 * integration tests for readBoard are in position.test.js.
 */

const { internals } = ChessNotesPosition;

// --------------------------------------------------------------- test helpers

/**
 * The grid the toPlacement tests pass in, from one string per rank, rank 8
 * first, "." for an empty square. Keeps the sizes it is given, so the size
 * error tests can build grids that aren't 8x8.
 */
function grid(ranks) {
  return ranks.map((rank) => [...rank].map((c) => (c === "." ? null : c)));
}

describe("grid", () => {
  test("ranks with k, q, N, P and K → the exact 8x8 array, rank 8 first", () => {
    const built = grid([
      "k.......",
      "........",
      ".....q..",
      "........",
      "........",
      "..N.....",
      "....P...",
      ".......K",
    ]);
    const _ = null;
    expect(built).toStrictEqual([
      ["k", _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _],
      [_, _, _, _, _, "q", _, _],
      [_, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _],
      [_, _, "N", _, _, _, _, _],
      [_, _, _, _, "P", _, _, _],
      [_, _, _, _, _, _, _, "K"],
    ]);
  });

  // Keeps the sizes it is given, which the toPlacement size error tests rely on.

  test("keeps the sizes it is given: 7 ranks → 7 rows", () => {
    const built = grid([
      "....k...",
      "........",
      "........",
      "...p....",
      "........",
      "........",
      "....K...",
    ]);
    const _ = null;
    expect(built).toStrictEqual([
      [_, _, _, _, "k", _, _, _],
      [_, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _],
      [_, _, _, "p", _, _, _, _],
      [_, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _],
      [_, _, _, _, "K", _, _, _],
    ]);
  });

  test("keeps the sizes it is given: a 9-character rank → a row of 9 cells", () => {
    const built = grid([
      "......k.",
      "........",
      "........",
      "........",
      "..B......",
      "........",
      "........",
      ".K......",
    ]);
    const _ = null;
    expect(built).toStrictEqual([
      [_, _, _, _, _, _, "k", _],
      [_, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _],
      [_, _, "B", _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _],
      [_, _, _, _, _, _, _, _],
      [_, "K", _, _, _, _, _, _],
    ]);
  });
});

describe("findBoard", () => {
  // Returns the board only when there is exactly one.

  test("one board → { ok: true, board } with that board", () => {
    const root = document.createElement("div");
    root.innerHTML = '<p>Your move</p><div class="ChessBoard_relative__3gr96"></div>';
    const board = root.querySelector("div");
    expect(ChessNotesPosition.findBoard(root)).toStrictEqual({ ok: true, board });
  });

  test('no board → { ok: false, reason: "no board found" }', () => {
    const root = document.createElement("div");
    root.innerHTML = '<div class="Lesson_title__8kq2d">Openings</div>';
    expect(ChessNotesPosition.findBoard(root)).toStrictEqual({ ok: false, reason: "no board found" });
  });

  test('two boards → { ok: false, reason: "found 2 boards" }', () => {
    const root = document.createElement("div");
    root.innerHTML =
      '<div class="ChessBoard_relative__3gr96"></div>' +
      '<div class="ChessBoard_relative__3gr96"></div>';
    expect(ChessNotesPosition.findBoard(root)).toStrictEqual({ ok: false, reason: "found 2 boards" });
  });
});

describe("orientationFromLabels", () => {
  // Reads all eight rank labels in order.

  test('labels "8" to "1", top to bottom → "white"', () => {
    const board = document.createElement("div");
    board.innerHTML = `
    <div class="ChessBoard_rankNumber__YLkVg">8</div>
    <div class="ChessBoard_rankNumber__YLkVg">7</div>
    <div class="ChessBoard_rankNumber__YLkVg">6</div>
    <div class="ChessBoard_rankNumber__YLkVg">5</div>
    <div class="ChessBoard_rankNumber__YLkVg">4</div>
    <div class="ChessBoard_rankNumber__YLkVg">3</div>
    <div class="ChessBoard_rankNumber__YLkVg">2</div>
    <div class="ChessBoard_rankNumber__YLkVg">1</div>`;
    expect(internals.orientationFromLabels(board)).toBe("white");
  });

  test('labels "1" to "8", top to bottom → "black"', () => {
    const board = document.createElement("div");
    board.innerHTML = `
    <div class="ChessBoard_rankNumber__YLkVg">1</div>
    <div class="ChessBoard_rankNumber__YLkVg">2</div>
    <div class="ChessBoard_rankNumber__YLkVg">3</div>
    <div class="ChessBoard_rankNumber__YLkVg">4</div>
    <div class="ChessBoard_rankNumber__YLkVg">5</div>
    <div class="ChessBoard_rankNumber__YLkVg">6</div>
    <div class="ChessBoard_rankNumber__YLkVg">7</div>
    <div class="ChessBoard_rankNumber__YLkVg">8</div>`;
    expect(internals.orientationFromLabels(board)).toBe("black");
  });

  test('whitespace around the labels is ignored ("\\n    8\\n  " to "\\n    1\\n  " → "white")', () => {
    const board = document.createElement("div");
    // Laid out like the real page, with each number on its own line.
    board.innerHTML = `
    <div class="ChessBoard_rankNumber__YLkVg">
    8
  </div>
    <div class="ChessBoard_rankNumber__YLkVg">
    7
  </div>
    <div class="ChessBoard_rankNumber__YLkVg">
    6
  </div>
    <div class="ChessBoard_rankNumber__YLkVg">
    5
  </div>
    <div class="ChessBoard_rankNumber__YLkVg">
    4
  </div>
    <div class="ChessBoard_rankNumber__YLkVg">
    3
  </div>
    <div class="ChessBoard_rankNumber__YLkVg">
    2
  </div>
    <div class="ChessBoard_rankNumber__YLkVg">
    1
  </div>`;
    expect(internals.orientationFromLabels(board)).toBe("white");
  });

  // Returns null when the labels don't say.

  test("no labels (an empty container) → null", () => {
    const board = document.createElement("div");
    expect(internals.orientationFromLabels(board)).toBe(null);
  });

  test('top label "8" but the rest out of order ("8", "7", "6", "4", "5", "3", "2", "1" → null)', () => {
    const board = document.createElement("div");
    board.innerHTML = `
    <div class="ChessBoard_rankNumber__YLkVg">8</div>
    <div class="ChessBoard_rankNumber__YLkVg">7</div>
    <div class="ChessBoard_rankNumber__YLkVg">6</div>
    <div class="ChessBoard_rankNumber__YLkVg">4</div>
    <div class="ChessBoard_rankNumber__YLkVg">5</div>
    <div class="ChessBoard_rankNumber__YLkVg">3</div>
    <div class="ChessBoard_rankNumber__YLkVg">2</div>
    <div class="ChessBoard_rankNumber__YLkVg">1</div>`;
    expect(internals.orientationFromLabels(board)).toBe(null);
  });

  test('top label "1" but the rest out of order ("1", "2", "3", "4", "5", "6", "8", "7" → null)', () => {
    const board = document.createElement("div");
    board.innerHTML = `
    <div class="ChessBoard_rankNumber__YLkVg">1</div>
    <div class="ChessBoard_rankNumber__YLkVg">2</div>
    <div class="ChessBoard_rankNumber__YLkVg">3</div>
    <div class="ChessBoard_rankNumber__YLkVg">4</div>
    <div class="ChessBoard_rankNumber__YLkVg">5</div>
    <div class="ChessBoard_rankNumber__YLkVg">6</div>
    <div class="ChessBoard_rankNumber__YLkVg">8</div>
    <div class="ChessBoard_rankNumber__YLkVg">7</div>`;
    expect(internals.orientationFromLabels(board)).toBe(null);
  });

  test('fewer than eight labels ("8" to "2" → null)', () => {
    const board = document.createElement("div");
    board.innerHTML = `
    <div class="ChessBoard_rankNumber__YLkVg">8</div>
    <div class="ChessBoard_rankNumber__YLkVg">7</div>
    <div class="ChessBoard_rankNumber__YLkVg">6</div>
    <div class="ChessBoard_rankNumber__YLkVg">5</div>
    <div class="ChessBoard_rankNumber__YLkVg">4</div>
    <div class="ChessBoard_rankNumber__YLkVg">3</div>
    <div class="ChessBoard_rankNumber__YLkVg">2</div>`;
    expect(internals.orientationFromLabels(board)).toBe(null);
  });

  test('more than eight labels ("1" to "8", then "8" again → null)', () => {
    const board = document.createElement("div");
    board.innerHTML = `
    <div class="ChessBoard_rankNumber__YLkVg">1</div>
    <div class="ChessBoard_rankNumber__YLkVg">2</div>
    <div class="ChessBoard_rankNumber__YLkVg">3</div>
    <div class="ChessBoard_rankNumber__YLkVg">4</div>
    <div class="ChessBoard_rankNumber__YLkVg">5</div>
    <div class="ChessBoard_rankNumber__YLkVg">6</div>
    <div class="ChessBoard_rankNumber__YLkVg">7</div>
    <div class="ChessBoard_rankNumber__YLkVg">8</div>
    <div class="ChessBoard_rankNumber__YLkVg">8</div>`;
    expect(internals.orientationFromLabels(board)).toBe(null);
  });
});

describe("orientationFromIds", () => {
  // Only idSquare and screen are read. Squares are { row, col } with row 0 = rank 8
  // and col 0 = the a-file; screen is counted from the top-left of the board as shown.

  // Returns the side when every piece agrees.

  test('every piece fits white at bottom → "white"', () => {
    const pieces = [
      { idSquare: { row: 6, col: 4 }, screen: { row: 6, col: 4 } }, // e2
      { idSquare: { row: 0, col: 1 }, screen: { row: 0, col: 1 } }, // b8
    ];
    expect(internals.orientationFromIds(pieces)).toBe("white");
  });

  test('every piece fits black at bottom → "black"', () => {
    const pieces = [
      { idSquare: { row: 4, col: 4 }, screen: { row: 3, col: 3 } }, // e4
      { idSquare: { row: 7, col: 6 }, screen: { row: 0, col: 1 } }, // g1
    ];
    expect(internals.orientationFromIds(pieces)).toBe("black");
  });

  test('a piece with no screen square is skipped → "black"', () => {
    const pieces = [
      { idSquare: { row: 3, col: 6 }, screen: null },
      { idSquare: { row: 7, col: 0 }, screen: { row: 0, col: 7 } }, // a1
    ];
    expect(internals.orientationFromIds(pieces)).toBe("black");
  });

  // Returns null when it can't tell.

  test("two pieces disagree → null", () => {
    const pieces = [
      { idSquare: { row: 1, col: 3 }, screen: { row: 1, col: 3 } }, // d7, fits White
      { idSquare: { row: 5, col: 2 }, screen: { row: 2, col: 5 } }, // c3, fits Black
    ];
    expect(internals.orientationFromIds(pieces)).toBe(null);
  });

  test("a piece fits neither side as the first piece → null", () => {
    const pieces = [
      { idSquare: { row: 7, col: 7 }, screen: { row: 6, col: 7 } }, // h1, fits neither
      { idSquare: { row: 6, col: 0 }, screen: { row: 6, col: 0 } }, // a2, fits White
    ];
    expect(internals.orientationFromIds(pieces)).toBe(null);
  });

  test("no usable pieces → null", () => {
    const pieces = [
      { idSquare: { row: 5, col: 5 }, screen: null },
    ];
    expect(internals.orientationFromIds(pieces)).toBe(null);
  });

  test("a piece with no id → null", () => {
    const pieces = [
      { idSquare: { row: 6, col: 2 }, screen: { row: 6, col: 2 } }, // c2, fits White
      { idSquare: null, screen: { row: 3, col: 5 } },
    ];
    expect(internals.orientationFromIds(pieces)).toBe(null);
  });
});

describe("chooseOrientation", () => {
  // Takes the orientation from the labels and from the ids, in that order.

  // Returns the orientation when the labels and ids agree, or when only one gives one.

  test('labels "white", ids "white" → "white"', () => {
    expect(internals.chooseOrientation("white", "white")).toStrictEqual({ ok: true, orientation: "white" });
  });

  test('labels "black", ids "black" → "black"', () => {
    expect(internals.chooseOrientation("black", "black")).toStrictEqual({ ok: true, orientation: "black" });
  });

  test('labels only: labels "black", ids null → "black"', () => {
    expect(internals.chooseOrientation("black", null)).toStrictEqual({ ok: true, orientation: "black" });
  });

  test('ids only: labels null, ids "white" → "white"', () => {
    expect(internals.chooseOrientation(null, "white")).toStrictEqual({ ok: true, orientation: "white" });
  });

  // Returns a reason when they disagree or neither gives one.

  test('labels "white", ids "black" → the labels and ids disagree', () => {
    expect(internals.chooseOrientation("white", "black")).toStrictEqual({
      ok: false,
      reason: "the labels say white is at the bottom but the ids say black",
    });
  });

  test('labels "black", ids "white" → the labels and ids disagree', () => {
    expect(internals.chooseOrientation("black", "white")).toStrictEqual({
      ok: false,
      reason: "the labels say black is at the bottom but the ids say white",
    });
  });

  test("labels null, ids null → can't tell", () => {
    expect(internals.chooseOrientation(null, null)).toStrictEqual({
      ok: false,
      reason: "can't tell which way up the board is",
    });
  });
});

describe("parseScreenSquare", () => {
  // Reads a square from the transform.

  test("translate(400%, 300%) → row 3, col 4", () => {
    const el = document.createElement("div");
    el.style.transform = "translate(400%, 300%)";
    expect(internals.parseScreenSquare(el)).toStrictEqual({ row: 3, col: 4 });
  });

  test("the far corner squares count: translate(700%, 0%) → row 0, col 7", () => {
    const el = document.createElement("div");
    el.style.transform = "translate(700%, 0%)";
    expect(internals.parseScreenSquare(el)).toStrictEqual({ row: 0, col: 7 });
  });

  // Returns null when the piece isn't on a square.

  test("between squares: translate(450%, 200%) → null", () => {
    const el = document.createElement("div");
    el.style.transform = "translate(450%, 200%)";
    expect(internals.parseScreenSquare(el)).toBe(null);
  });

  test("off the right edge: translate(800%, 100%) → null", () => {
    const el = document.createElement("div");
    el.style.transform = "translate(800%, 100%)";
    expect(internals.parseScreenSquare(el)).toBe(null);
  });

  test("off the top edge: translate(600%, -100%) → null", () => {
    const el = document.createElement("div");
    el.style.transform = "translate(600%, -100%)";
    expect(internals.parseScreenSquare(el)).toBe(null);
  });

  test("no transform: an element with no style → null", () => {
    const el = document.createElement("div");
    expect(internals.parseScreenSquare(el)).toBe(null);
  });
});

describe("parseIdSquare", () => {
  // Reads a square from the id.

  test('"44" → row 4, col 4', () => {
    const el = document.createElement("div");
    el.id = "44";
    expect(internals.parseIdSquare(el)).toStrictEqual({ row: 4, col: 4 });
  });

  // Returns null for other ids.

  for (const [label, id] of [
    ["empty", ""],
    ["a letter", "8a"],
    ["three digits", "123"],
    ["a digit past 7", "09"],
  ]) {
    test(`${label}: "${id}" → null`, () => {
      const el = document.createElement("div");
      el.id = id;
      expect(internals.parseIdSquare(el)).toBe(null);
    });
  }
});

describe("squareName", () => {
  // Names a square.

  for (const [name, square] of [
    ["a8", { row: 0, col: 0 }],
    ["h1", { row: 7, col: 7 }],
    ["e4", { row: 4, col: 4 }],
  ]) {
    test(`row ${square.row}, col ${square.col} → "${name}"`, () => {
      expect(internals.squareName(square)).toBe(name);
    });
  }

  // Throws unless row and col are both whole numbers 0–7.

  for (const [label, square, message] of [
    ["row past 7", { row: 8, col: 2 }, "row must be a whole number from 0 to 7, got 8"],
    ["row below 0", { row: -1, col: 5 }, "row must be a whole number from 0 to 7, got -1"],
    ["col past 7", { row: 3, col: 8 }, "col must be a whole number from 0 to 7, got 8"],
    ["col below 0", { row: 6, col: -1 }, "col must be a whole number from 0 to 7, got -1"],
  ]) {
    test(`off the board: ${label} → RangeError`, () => {
      expect(() => internals.squareName(square)).toThrow(new RangeError(message));
    });
  }

  for (const [label, square, message] of [
    ["row", { row: 2.5, col: 3 }, "row must be a whole number from 0 to 7, got 2.5"],
    ["col", { row: 1, col: 6.5 }, "col must be a whole number from 0 to 7, got 6.5"],
  ]) {
    test(`between squares: ${label} not whole → RangeError`, () => {
      expect(() => internals.squareName(square)).toThrow(new RangeError(message));
    });
  }

  for (const [label, square, message] of [
    ["a string row", { row: "4", col: 0 }, 'row must be a number, got "4"'],
    ["no col", { row: 7 }, "col must be a number, got undefined"],
    ["null in place of the square", null, "squareName needs a square like { row, col }, got null"],
  ]) {
    test(`not a number: ${label} → TypeError`, () => {
      expect(() => internals.squareName(square)).toThrow(new TypeError(message));
    });
  }
});

describe("toPlacement", () => {
  // Turns a grid into FEN piece placement.

  test('empty grid → "8/8/8/8/8/8/8/8"', () => {
    const empty = grid([
      "........",
      "........",
      "........",
      "........",
      "........",
      "........",
      "........",
      "........",
    ]);
    expect(internals.toPlacement(empty)).toBe("8/8/8/8/8/8/8/8");
  });

  test("grid full of pawns, Black's on ranks 8–5 and White's on 4–1", () => {
    const pawns = grid([
      "pppppppp",
      "pppppppp",
      "pppppppp",
      "pppppppp",
      "PPPPPPPP",
      "PPPPPPPP",
      "PPPPPPPP",
      "PPPPPPPP",
    ]);
    expect(internals.toPlacement(pawns)).toBe(
      "pppppppp/pppppppp/pppppppp/pppppppp/PPPPPPPP/PPPPPPPP/PPPPPPPP/PPPPPPPP",
    );
  });

  test("starting grid → starting placement", () => {
    const start = grid([
      "rnbqkbnr",
      "pppppppp",
      "........",
      "........",
      "........",
      "........",
      "PPPPPPPP",
      "RNBQKBNR",
    ]);
    expect(internals.toPlacement(start)).toBe("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR");
  });

  test("grid after 1.e4 → placement after 1.e4", () => {
    const afterE4 = grid([
      "rnbqkbnr",
      "pppppppp",
      "........",
      "........",
      "....P...",
      "........",
      "PPPP.PPP",
      "RNBQKBNR",
    ]);
    expect(internals.toPlacement(afterE4)).toBe("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR");
  });

  test("grid after 1.e4 e5 → placement after 1.e4 e5", () => {
    const afterE4E5 = grid([
      "rnbqkbnr",
      "pppp.ppp",
      "........",
      "....p...",
      "....P...",
      "........",
      "PPPP.PPP",
      "RNBQKBNR",
    ]);
    expect(internals.toPlacement(afterE4E5)).toBe("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR");
  });

  // Throws unless the grid is 8 rows of 8 cells, each a piece letter or null.

  test("7 rows → RangeError", () => {
    const short = grid([
      "r...k..r",
      "pppppppp",
      "........",
      "........",
      "........",
      "PPPPPPPP",
      "R...K..R",
    ]);
    expect(() => internals.toPlacement(short)).toThrow(new RangeError("grid must have 8 rows, got 7"));
  });

  test("9 rows → RangeError", () => {
    const long = grid([
      "....k...",
      "........",
      "...q....",
      "........",
      "........",
      "........",
      "..N.....",
      "........",
      "......K.",
    ]);
    expect(() => internals.toPlacement(long)).toThrow(new RangeError("grid must have 8 rows, got 9"));
  });

  test("row 3 of 9 squares → RangeError", () => {
    const wide = grid([
      "r.bqkb.r",
      "pp..pppp",
      "..n..n..",
      "..pp.....",
      "...P....",
      "..N..N..",
      "PPP.PPPP",
      "R.BQKB.R",
    ]);
    expect(() => internals.toPlacement(wide)).toThrow(new RangeError("row 3 must have 8 squares, got 9"));
  });

  test('unknown letter "X" → RangeError', () => {
    const unknown = grid([
      "rnbqkbnr",
      "pppppppp",
      ".....X..",
      "........",
      "........",
      "........",
      "PPPPPPPP",
      "RNBQKBNR",
    ]);
    expect(() => internals.toPlacement(unknown)).toThrow(
      new RangeError('row 2, col 5 must be a FEN piece letter or null, got "X"'),
    );
  });

  test("undefined at row 6, col 1 → RangeError", () => {
    const hole = grid([
      "...k....",
      "........",
      "........",
      "........",
      "........",
      "........",
      "........",
      "...K....",
    ]);
    hole[6][1] = undefined;
    expect(() => internals.toPlacement(hole)).toThrow(
      new RangeError("row 6, col 1 must be a FEN piece letter or null, got undefined"),
    );
  });

  test("null in place of the grid → TypeError", () => {
    expect(() => internals.toPlacement(null)).toThrow(new TypeError("grid must be an array of 8 rows, got null"));
  });

  test('row 4 is the string "8" → TypeError', () => {
    const stringRow = grid([
      "r..qk..r",
      "ppp..ppp",
      "..n.bn..",
      "...pp...",
      "........",
      "..NBPN..",
      "PPP..PPP",
      "R..QK..R",
    ]);
    stringRow[4] = "8";
    expect(() => internals.toPlacement(stringRow)).toThrow(new TypeError('row 4 must be an array, got "8"'));
  });
});
