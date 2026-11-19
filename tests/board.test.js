import { describe, test, expect } from "vitest";
import { square, idOf, div, makePiece, makeBoard, pieceOn } from "./board.js";
import expectedBoardsHtml from "./expected_boards.html?raw";

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

  test('white at bottom: "P" on row 6, col 3 → the d2 pawn in starting_position.html', () => {
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

  test('black at bottom, turned 180°: "N" on row 7, col 1 → the b1 knight in e4_from_black.html', () => {
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

  test('a captured piece: "p" on row 4, col 3, black at bottom → the captured black pawn in capture.html', () => {
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

describe("makeBoard", () => {
  // Builds the boards in expected_boards.html, which were checked against the
  // site's sample files. The site's own HTML has more than makeBoard builds,
  // so the tests compare with these boards instead.

  const expectedPage = new DOMParser().parseFromString(expectedBoardsHtml, "text/html");

  /** HTML with one tag per line, so a failure shows which tags differ. */
  function tagLines(html) {
    return html.replace(/>\s*</g, ">\n<");
  }

  /** The board in the section with this id of expected_boards.html. */
  function expectedBoard(sectionId) {
    return expectedPage.querySelector(`#${sectionId} [class*="ChessBoard_relative"]`).outerHTML;
  }

  test("tagLines puts each tag on its own line, dropping the whitespace between tags", () => {
    expect(tagLines('<div class="x"><span>5</span>\n    <img alt="q"></div>')).toBe(
      '<div class="x">\n<span>5</span>\n<img alt="q">\n</div>',
    );
  });

  test("expectedBoard gives the board container of the section with that id", () => {
    const board = expectedBoard("after-e4-from-black");
    expect(board.startsWith('<div class="ChessBoard_relative__3gr96">')).toBe(true);
    // Only this section has the e4 pawn drawn at column 3, row 3.
    expect(board).toContain('id="44" style="transform: translate(300%, 300%);"');
  });

  test("starting position, white at bottom", () => {
    const board = makeBoard("rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR", { orientation: "white" });
    expect(tagLines(board.outerHTML)).toBe(tagLines(expectedBoard("starting-position")));
  });

  test("after 1.e4 e5, white at bottom", () => {
    const board = makeBoard("rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR", { orientation: "white" });
    expect(tagLines(board.outerHTML)).toBe(tagLines(expectedBoard("after-e4-e5")));
  });

  test("after 1.e4, black at bottom", () => {
    const board = makeBoard("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR", { orientation: "black" });
    expect(tagLines(board.outerHTML)).toBe(tagLines(expectedBoard("after-e4-from-black")));
  });

  test("Advance Caro-Kann with captures on d4, black at bottom", () => {
    const board = makeBoard("r1bqkbnr/pp2pppp/2n5/3pP3/3P4/5N2/PP3PPP/RNBQKB1R", {
      orientation: "black",
      captured: [
        { letter: "P", on: "d4" },
        { letter: "p", on: "d4" },
      ],
    });
    expect(tagLines(board.outerHTML)).toBe(tagLines(expectedBoard("captures-on-d4")));
  });
});

describe("pieceOn", () => {
  // Finds the piece still on a square, skipping captured ones.

  test('after 1.e4, "e4" → the white pawn\'s wrapper', () => {
    const board = makeBoard("rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR", { orientation: "white" });
    expect(pieceOn(board, "e4").outerHTML).toBe(
      '<div class="ChessBoard_pieceWrapper__m95pT" id="44" style="transform: translate(400%, 400%);">' +
        '<div class="piece_piece__JbwmA"><img alt="P" class="piece_image__sXVkQ"></div></div>',
    );
  });
});
