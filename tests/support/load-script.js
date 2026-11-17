import positionSource from "../../src/position.js?raw";

/**
 * Runs a plain browser script, as a <script> tag would, and returns the
 * top-level names asked for. position.js is a Firefox content script, which
 * can't use export, so the tests load it this way and it stays unchanged.
 */
export function loadScript(source, names) {
  return new Function(`${source}\nreturn { ${names.join(", ")} };`)();
}

export const { ChessNotesPosition } = loadScript(positionSource, ["ChessNotesPosition"]);
