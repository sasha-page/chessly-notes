"use strict";

/**
 * Reads the chess position from the site's board HTML.
 *
 * The page has no FEN, so we rebuild the piece-placement part of one from the
 * piece elements (see the sample boards starting_position.html, e4e5.html,
 * e4_from_black.html and capture.html in the project folder):
 *
 *  - Each piece is a div whose class contains "ChessBoard_pieceWrapper".
 *  - Its style is `transform: translate(X%, Y%)`, where 100% is one square,
 *    measured from the top-left corner of the board *as shown on screen*.
 *    When Black is at the bottom the board is rotated 180°, so the on-screen
 *    column and row become 7 - col and 7 - row on the board.
 *  - Its child <img alt="..."> is the FEN letter (capital = White).
 *  - Its id is "<row><col>" on the board itself (row 0 = rank 8,
 *    col 0 = a-file). This does NOT change with the board's orientation.
 *  - Captured pieces stay in the page on the square they were captured on,
 *    with an extra "ChessBoard_removed" class (see capture.html). We skip them.
 *
 * We read squares from the transform and check them against the id. If they
 * disagree, the board is probably mid-update, so the caller should try again.
 *
 * Class names end in a build hash (e.g. "__m95pT") that can change whenever
 * the site is updated, so we only match the stable start of each name.
 */
const ChessNotesPosition = (() => {
  const SELECTORS = {
    board: '[class*="ChessBoard_relative"]',
    // Pieces still on the board: skip captured ones the site keeps hidden.
    piece: '[class*="ChessBoard_pieceWrapper"]:not([class*="ChessBoard_removed"])',
    rankLabel: '[class*="ChessBoard_rankNumber"]',
  };

  const PIECE_LETTERS = new Set("prnbqkPRNBQK");
  const TRANSLATE = /translate\(\s*(-?[\d.]+)%\s*,\s*(-?[\d.]+)%\s*\)/;

  /** Every board container on the page (normally just one). */
  function findBoards(root = document) {
    return [...root.querySelectorAll(SELECTORS.board)];
  }

  /**
   * The board's orientation, i.e. which side is at the bottom ("white" or
   * "black"), from the rank labels down the side: "8" at the top means
   * White is at the bottom, "1" at the top means Black is.
   * Returns null if there are no labels to go by.
   */
  function orientationFromLabels(board) {
    const topLabel = board.querySelector(SELECTORS.rankLabel);
    const text = topLabel?.textContent.trim();
    if (text === "8") return "white";
    if (text === "1") return "black";
    return null;
  }

  /**
   * Fallback if the labels are hidden: work out the orientation from the ids.
   * Every piece must agree. If any piece's id doesn't match its on-screen
   * square from either side, or two pieces disagree, return null.
   */
  function orientationFromIds(pieces) {
    let orientation = null;
    for (const p of pieces) {
      if (!p.idSquare || !p.screen) continue;
      const fromWhite = p.idSquare.row === p.screen.row && p.idSquare.col === p.screen.col;
      // Seen from Black's side the board is rotated 180°.
      const fromBlack = p.idSquare.row === 7 - p.screen.row && p.idSquare.col === 7 - p.screen.col;
      const thisPiece = fromWhite ? "white" : fromBlack ? "black" : null;
      if (thisPiece === null) return null;
      if (orientation !== null && orientation !== thisPiece) return null;
      orientation = thisPiece;
    }
    return orientation;
  }

  /** Screen square from `translate(X%, Y%)`, or null if between squares. */
  function parseScreenSquare(el) {
    const match = TRANSLATE.exec(el.style.transform);
    if (!match) return null;
    const col = Number(match[1]) / 100;
    const row = Number(match[2]) / 100;
    const onSquare = (n) => Number.isInteger(n) && n >= 0 && n <= 7;
    return onSquare(col) && onSquare(row) ? { row, col } : null;
  }

  /** Board square from an id like "44", or null if the id isn't in that form. */
  function parseIdSquare(el) {
    const match = /^([0-7])([0-7])$/.exec(el.id);
    return match ? { row: Number(match[1]), col: Number(match[2]) } : null;
  }

  /** "e4"-style name, used in error messages. */
  function squareName(square) {
    if (square === null || typeof square !== "object") {
      throw new TypeError(`squareName needs a square like { row, col }, got ${square}`);
    }
    const { row, col } = square;
    for (const [name, value] of [["row", row], ["col", col]]) {
      if (typeof value !== "number") {
        throw new TypeError(`${name} must be a number, got ${JSON.stringify(value) ?? value}`);
      }
      if (!Number.isInteger(value) || value < 0 || value > 7) {
        throw new RangeError(`${name} must be a whole number from 0 to 7, got ${value}`);
      }
    }
    return "abcdefgh"[col] + (8 - row);
  }

  /** Turns an 8x8 grid (row 0 = rank 8) into FEN piece placement. */
  function toPlacement(grid) {
    if (!Array.isArray(grid)) {
      throw new TypeError(`grid must be an array of 8 rows, got ${JSON.stringify(grid) ?? grid}`);
    }
    if (grid.length !== 8) {
      throw new RangeError(`grid must have 8 rows, got ${grid.length}`);
    }
    return grid
      .map((rank, row) => {
        if (!Array.isArray(rank)) {
          throw new TypeError(`row ${row} must be an array, got ${JSON.stringify(rank) ?? rank}`);
        }
        if (rank.length !== 8) {
          throw new RangeError(`row ${row} must have 8 squares, got ${rank.length}`);
        }
        let text = "";
        let empty = 0;
        for (const [col, letter] of rank.entries()) {
          if (letter !== null && typeof letter !== "string") {
            throw new TypeError(
              `row ${row}, col ${col} must be a FEN piece letter or null, got ${JSON.stringify(letter) ?? letter}`,
            );
          }
          if (letter !== null && !PIECE_LETTERS.has(letter)) {
            throw new RangeError(
              `row ${row}, col ${col} must be a FEN piece letter or null, got ${JSON.stringify(letter)}`,
            );
          }
          if (letter) {
            if (empty) text += empty;
            text += letter;
            empty = 0;
          } else {
            empty++;
          }
        }
        return empty ? text + empty : text;
      })
      .join("/");
  }

  /**
   * Reads one board.
   *
   * Returns { ok: true, placement, orientation } on success, where
   * orientation is the side at the bottom ("white" or "black"), or
   * { ok: false, reason } if the board can't be read right now (for example
   * while a piece is moving).
   */
  function readBoard(board) {
    const pieces = [...board.querySelectorAll(SELECTORS.piece)].map((el) => ({
      el,
      letter: el.querySelector("img")?.alt,
      screen: parseScreenSquare(el),
      idSquare: parseIdSquare(el),
    }));

    if (pieces.length === 0) return { ok: false, reason: "no pieces found" };

    const orientation = orientationFromLabels(board) ?? orientationFromIds(pieces);
    if (orientation === null) return { ok: false, reason: "can't tell which way up the board is" };

    const grid = Array.from({ length: 8 }, () => Array(8).fill(null));

    for (const p of pieces) {
      if (!PIECE_LETTERS.has(p.letter)) {
        return { ok: false, reason: `unknown piece "${p.letter}" (id ${p.el.id})` };
      }
      if (!p.screen) {
        return { ok: false, reason: `piece ${p.letter} is between squares (${p.el.style.transform})` };
      }

      // Seen from Black's side the board is rotated 180°.
      const square = orientation === "black"
        ? { row: 7 - p.screen.row, col: 7 - p.screen.col }
        : p.screen;

      if (p.idSquare && (p.idSquare.row !== square.row || p.idSquare.col !== square.col)) {
        return {
          ok: false,
          reason: `piece ${p.letter} is drawn on ${squareName(square)} but its id says ${squareName(p.idSquare)}`,
        };
      }
      if (grid[square.row][square.col]) {
        return { ok: false, reason: `two pieces on ${squareName(square)}` };
      }

      grid[square.row][square.col] = p.letter;
    }

    return { ok: true, placement: toPlacement(grid), orientation };
  }

  return {
    findBoards,
    readBoard,
    // For tests only. Not part of the public API.
    internals: { orientationFromLabels, orientationFromIds, parseScreenSquare, parseIdSquare, squareName, toPlacement },
  };
})();
