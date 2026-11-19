import { describe, test, expect } from "vitest";
import { square, idOf, div, makePiece } from "./board.js";

/*
 * Tests for the board fixtures in tests/board.js. Each expected value
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

describe("div", () => {
  // Makes a div with the given classes.

  test('"flex-column ChessBoard_board__Vgpvk" → an empty div with those classes', () => {
    expect(div("flex-column ChessBoard_board__Vgpvk").outerHTML).toBe(
      '<div class="flex-column ChessBoard_board__Vgpvk"></div>',
    );
  });
});

describe("makePiece", () => {
  // Draws one piece wrapper the way the site does. Each expected wrapper is
  // copied from a sample file.

  test('White at bottom: "P" on row 6, col 3 → the d2 pawn in starting_position.html', () => {
    const el = makePiece("P", { row: 6, col: 3 }, "white");
    expect({
      tag: el.tagName,
      id: el.id,
      className: el.className,
      transform: el.style.transform,
      content: el.innerHTML,
    }).toStrictEqual({
      tag: "DIV",
      id: "63",
      className: "ChessBoard_pieceWrapper__m95pT",
      transform: "translate(300%, 600%)",
      content: '<div class="piece_piece__JbwmA"><img alt="P" class="piece_image__sXVkQ"></div>',
    });
  });

  test('Black at bottom, turned 180°: "N" on row 7, col 1 → the b1 knight in e4_from_black.html', () => {
    const el = makePiece("N", { row: 7, col: 1 }, "black");
    expect({
      tag: el.tagName,
      id: el.id,
      className: el.className,
      transform: el.style.transform,
      content: el.innerHTML,
    }).toStrictEqual({
      tag: "DIV",
      id: "71",
      className: "ChessBoard_pieceWrapper__m95pT",
      transform: "translate(600%, 0%)",
      content: '<div class="piece_piece__JbwmA"><img alt="N" class="piece_image__sXVkQ"></div>',
    });
  });

  test('a captured piece: "p" on row 4, col 3, Black at bottom → the captured black pawn in capture.html', () => {
    const el = makePiece("p", { row: 4, col: 3 }, "black", true);
    expect({
      tag: el.tagName,
      id: el.id,
      className: el.className,
      transform: el.style.transform,
      content: el.innerHTML,
    }).toStrictEqual({
      tag: "DIV",
      id: "43",
      className: "ChessBoard_pieceWrapper__m95pT ChessBoard_removed__kaYG3",
      transform: "translate(400%, 300%)",
      content: '<div class="piece_piece__JbwmA"><img alt="p" class="piece_image__sXVkQ"></div>',
    });
  });
});
