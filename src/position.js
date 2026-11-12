"use strict";

/**
 * Reads the chess position from the site's board HTML.
 *
 * The page has no FEN, so we rebuild the piece-placement part of one from the
 * piece elements (see starting_position.html, e4e5.html and flipped_e4.html):
 *
 *  - Each piece is a div whose class contains "ChessBoard_pieceWrapper".
 *  - Its style is `transform: translate(X%, Y%)`, where 100% is one square,
 *    measured from the top-left corner of the board *as shown on screen*.
 *    When the board is flipped these are mirrored.
 *  - Its child <img alt="..."> is the FEN letter (capital = White).
 *  - Its id is "<row><col>" on the board itself (row 0 = rank 8,
 *    col 0 = a-file). This does NOT change when the board is flipped.
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
   * Whether Black is at the bottom, from the rank labels down the side:
   * "8" at the top means normal, "1" at the top means flipped.
   * Returns null if there are no labels to go by.
   */
  function flippedFromLabels(board) {
    const topLabel = board.querySelector(SELECTORS.rankLabel);
    const text = topLabel?.textContent.trim();
    if (text === "8") return false;
    if (text === "1") return true;
    return null;
  }

  /**
   * Fallback if the labels are hidden: count how many pieces' ids match their
   * on-screen square directly, and how many match it mirrored.
   */
  function flippedFromIds(pieces) {
    let normal = 0;
    let mirrored = 0;
    for (const p of pieces) {
      if (!p.idSquare || !p.screen) continue;
      if (p.idSquare.row === p.screen.row && p.idSquare.col === p.screen.col) normal++;
      if (p.idSquare.row === 7 - p.screen.row && p.idSquare.col === 7 - p.screen.col) mirrored++;
    }
    if (normal === mirrored) return null;
    return mirrored > normal;
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
  function squareName({ row, col }) {
    return "abcdefgh"[col] + (8 - row);
  }

  /** Turns an 8x8 grid (row 0 = rank 8) into FEN piece placement. */
  function toPlacement(grid) {
    return grid
      .map((rank) => {
        let text = "";
        let empty = 0;
        for (const letter of rank) {
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
   * Returns { ok: true, placement, flipped } on success, or
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

    const flipped = flippedFromLabels(board) ?? flippedFromIds(pieces);
    if (flipped === null) return { ok: false, reason: "can't tell which way up the board is" };

    const grid = Array.from({ length: 8 }, () => Array(8).fill(null));

    for (const p of pieces) {
      if (!PIECE_LETTERS.has(p.letter)) {
        return { ok: false, reason: `unknown piece "${p.letter}" (id ${p.el.id})` };
      }
      if (!p.screen) {
        return { ok: false, reason: `piece ${p.letter} is between squares (${p.el.style.transform})` };
      }

      const square = flipped
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

    return { ok: true, placement: toPlacement(grid), flipped };
  }

  return { findBoards, readBoard };
})();
