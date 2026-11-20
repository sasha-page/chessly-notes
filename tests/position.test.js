import { describe, test, expect } from "vitest";
import { ChessNotesPosition } from "../src/position.js";
import { makeBoard, pieceOn, idOf } from "./board.js";

/*
 * Integration tests for readBoard in src/position.js, on boards built by
 * makeBoard (tests/board.js). The unit tests for findBoard and the helpers
 * are in position.unit.test.js.
 */

const read = (board) => ChessNotesPosition.readBoard(board);

// ------------------------------------------------------------------ positions

const START = "rnbqkbnr/pppppppp/8/8/8/8/PPPPPPPP/RNBQKBNR";
const AFTER_E4 = "rnbqkbnr/pppppppp/8/8/4P3/8/PPPP1PPP/RNBQKBNR";
const AFTER_E4_E5 = "rnbqkbnr/pppp1ppp/8/4p3/4P3/8/PPPP1PPP/RNBQKBNR";
// Advance Caro-Kann after 1.e4 c6 2.d4 d5 3.e5 c5 4.c3 Nc6 5.Nf3 cxd4 6.cxd4.
// The pawns captured on d4 stay in the page, hidden (see capture.html).
const AFTER_CAPTURES = "r1bqkbnr/pp2pppp/2n5/3pP3/3P4/5N2/PP3PPP/RNBQKB1R";
const CAPTURED_ON_D4 = [{ letter: "P", on: "d4" }, { letter: "p", on: "d4" }];

const UNSURE = { ok: false, reason: "can't tell which way up the board is" };

describe("readBoard", () => {
  test("starting position, white at bottom", () => {
    expect(read(makeBoard(START))).toStrictEqual({ ok: true, placement: START, orientation: "white" });
  });

  test("after 1.e4 e5, white at bottom", () => {
    expect(read(makeBoard(AFTER_E4_E5))).toStrictEqual({ ok: true, placement: AFTER_E4_E5, orientation: "white" });
  });

  test("after 1.e4, black at bottom", () => {
    const board = makeBoard(AFTER_E4, { orientation: "black" });
    expect(read(board)).toStrictEqual({ ok: true, placement: AFTER_E4, orientation: "black" });
  });

  // The labels and ids must agree when both give an orientation.

  test("labels say black at bottom but every id fits white at bottom", () => {
    const board = makeBoard(AFTER_E4_E5);
    const labels = board.querySelectorAll('[class*="ChessBoard_rankNumber"]');
    labels.forEach((label, i) => (label.textContent = String(i + 1)));
    expect(read(board)).toStrictEqual({
      ok: false,
      reason: "the labels say Black is at the bottom but the ids say White",
    });
  });

  test("captured pieces are skipped", () => {
    const board = makeBoard(AFTER_CAPTURES, { orientation: "black", captured: CAPTURED_ON_D4 });
    expect(read(board)).toStrictEqual({ ok: true, placement: AFTER_CAPTURES, orientation: "black" });
  });

  // Rank labels hidden: orientation has to come from the ids.

  test("no labels: after 1.e4 e5, white at bottom", () => {
    const board = makeBoard(AFTER_E4_E5, { labels: false });
    expect(read(board)).toStrictEqual({ ok: true, placement: AFTER_E4_E5, orientation: "white" });
  });

  test("no labels: after 1.e4, black at bottom", () => {
    const board = makeBoard(AFTER_E4, { orientation: "black", labels: false });
    expect(read(board)).toStrictEqual({ ok: true, placement: AFTER_E4, orientation: "black" });
  });

  test("no labels: captured pieces are skipped", () => {
    const board = makeBoard(AFTER_CAPTURES, { orientation: "black", labels: false, captured: CAPTURED_ON_D4 });
    expect(read(board)).toStrictEqual({ ok: true, placement: AFTER_CAPTURES, orientation: "black" });
  });

  // Every piece must agree on the orientation.

  test("no labels: one piece disagrees (white at bottom)", () => {
    const board = makeBoard(AFTER_E4_E5, { labels: false });
    // The e4 pawn is drawn where d5 would be if Black were at the bottom.
    pieceOn(board, "e4").id = idOf("d5");
    expect(read(board)).toStrictEqual(UNSURE);
  });

  test("no labels: one piece disagrees (black at bottom)", () => {
    const board = makeBoard(AFTER_E4, { orientation: "black", labels: false });
    // The e4 pawn is drawn where d5 would be if White were at the bottom.
    pieceOn(board, "e4").id = idOf("d5");
    expect(read(board)).toStrictEqual(UNSURE);
  });

  test("no labels: one piece fits neither side (white at bottom)", () => {
    const board = makeBoard(AFTER_E4_E5, { labels: false });
    pieceOn(board, "e4").id = idOf("e2");
    expect(read(board)).toStrictEqual(UNSURE);
  });

  test("no labels: one piece fits neither side (black at bottom)", () => {
    const board = makeBoard(AFTER_E4, { orientation: "black", labels: false });
    pieceOn(board, "e4").id = idOf("e2");
    expect(read(board)).toStrictEqual(UNSURE);
  });

  test("labels present: a piece whose id disagrees is caught by the id check", () => {
    const board = makeBoard(AFTER_E4_E5);
    pieceOn(board, "e4").id = idOf("d5");
    expect(read(board)).toStrictEqual({ ok: false, reason: "piece P is drawn on e4 but its id says d5" });
  });

  // Boards that can't be read yet.

  test("a piece between squares is rejected", () => {
    const board = makeBoard(AFTER_E4_E5);
    pieceOn(board, "e4").style.transform = "translate(400%, 450%)";
    expect(read(board)).toStrictEqual({ ok: false, reason: "piece P is between squares (translate(400%, 450%))" });
  });

  test("two pieces on one square are rejected", () => {
    const board = makeBoard(AFTER_E4_E5);
    const blackPawn = pieceOn(board, "e5");
    blackPawn.removeAttribute("id");
    blackPawn.style.transform = "translate(400%, 400%)"; // drawn on e4
    expect(read(board)).toStrictEqual({ ok: false, reason: "two pieces on e4" });
  });

  test("an empty board is rejected", () => {
    expect(read(makeBoard("8/8/8/8/8/8/8/8"))).toStrictEqual({ ok: false, reason: "no pieces found" });
  });

  test("an unknown piece letter is rejected", () => {
    const board = makeBoard(AFTER_E4_E5);
    pieceOn(board, "e4").querySelector("img").alt = "X";
    expect(read(board)).toStrictEqual({ ok: false, reason: `unknown piece "X" (id ${idOf("e4")})` });
  });
});
