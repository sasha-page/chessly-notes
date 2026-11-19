/*
 * Board fixtures for the integration tests.
 *
 * Instead of saved copies of the site's page, the tests build small boards
 * with the same structure as the site's HTML (see the sample files in the
 * project root). Only the parts the reader uses are built: the board
 * container, the piece wrappers (id, transform, img alt) and the rank labels.
 * If the site changes its HTML, update makeBoard to match.
 */

/** "e4" -> { row: 4, col: 4 }  (row 0 = rank 8, col 0 = a-file, like the site's ids) */
export function square(name) {
  return { row: 8 - Number(name[1]), col: "abcdefgh".indexOf(name[0]) };
}

/** "e4" -> "44", the id the site gives a piece on that square. */
export function idOf(name) {
  const { row, col } = square(name);
  return `${row}${col}`;
}

export function div(className) {
  const el = document.createElement("div");
  el.className = className;
  return el;
}

/** One piece wrapper, as the site draws it. */
export function makePiece(letter, { row, col }, orientation, removed = false) {
  // Seen from Black's side the board is rotated 180°.
  const screen = orientation === "black" ? { x: 7 - col, y: 7 - row } : { x: col, y: row };
  const wrapper = div("ChessBoard_pieceWrapper__m95pT" + (removed ? " ChessBoard_removed__kaYG3" : ""));
  wrapper.id = `${row}${col}`;
  wrapper.style.transform = `translate(${screen.x * 100}%, ${screen.y * 100}%)`;
  const piece = div("piece_piece__JbwmA");
  const img = document.createElement("img");
  img.alt = letter;
  img.className = "piece_image__sXVkQ";
  piece.append(img);
  wrapper.append(piece);
  return wrapper;
}

/**
 * Builds a board showing a FEN piece placement and adds it to the page.
 *   orientation: "white" or "black", the side at the bottom
 *   labels:      false to leave out the rank labels
 *   captured:    captured pieces the site keeps hidden, e.g. [{ letter: "P", on: "d4" }]
 */
export function makeBoard(placement, { orientation = "white", labels = true, captured = [] } = {}) {
  const container = div("ChessBoard_relative__3gr96");
  const helper = div("ChessBoard_dimensionHelper__j_WGx");
  const board = div("flex-column ChessBoard_board__Vgpvk");

  placement.split("/").forEach((rank, row) => {
    let col = 0;
    for (const ch of rank) {
      if (/\d/.test(ch)) {
        col += Number(ch);
      } else {
        board.append(makePiece(ch, { row, col }, orientation));
        col++;
      }
    }
  });
  for (const c of captured) {
    board.append(makePiece(c.letter, square(c.on), orientation, true));
  }

  helper.append(board);
  if (labels) {
    const legend = div("flex-vertical-spaced ChessBoard_legend__bOKws ChessBoard_rank__y3XGp");
    const ranks = orientation === "black" ? "12345678" : "87654321";
    for (const r of ranks) {
      const label = div("ChessBoard_rankNumber__YLkVg");
      label.textContent = r;
      legend.append(label);
    }
    helper.append(legend);
  }
  container.append(helper);
  document.body.append(container);
  return container;
}

/** The piece wrapper on a square (looked up by its id). */
export function pieceOn(board, name) {
  return board.querySelector(`[id="${idOf(name)}"]:not([class*="ChessBoard_removed"])`);
}
