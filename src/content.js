import { ChessNotesPosition } from "./position.js";

/**
 * Watches the page for board changes and logs the position each time it
 * settles. For now this only writes to the browser console; the notes box
 * comes next.
 *
 * The site is a single-page app, so the board can appear, disappear or be
 * replaced without the page reloading. We therefore watch the whole page
 * rather than one board element.
 */
(() => {
  const LOG_PREFIX = "[chess-notes]";
  const SETTLE_MS = 150; // wait this long after the last change before reading
  const RETRY_MS = 250; // if the board couldn't be read, try again after this
  const MAX_RETRIES = 8;

  let lastPlacement = null;
  let timer = null;
  let retries = 0;

  function scheduleRead(delay) {
    clearTimeout(timer);
    timer = setTimeout(readNow, delay);
  }

  function readNow() {
    const found = ChessNotesPosition.findBoard();
    if (!found.ok) {
      lastPlacement = null;
      return;
    }

    const result = ChessNotesPosition.readBoard(found.board);

    if (!result.ok) {
      if (retries < MAX_RETRIES) {
        retries++;
        scheduleRead(RETRY_MS);
      } else {
        console.warn(LOG_PREFIX, "couldn't read the board:", result.reason);
      }
      return;
    }

    retries = 0;
    if (result.placement !== lastPlacement) {
      lastPlacement = result.placement;
      const bottom = result.orientation === "black" ? "Black" : "White";
      console.log(LOG_PREFIX, "position:", result.placement, `(${bottom} at bottom)`);
    }
  }

  const observer = new MutationObserver(() => {
    retries = 0;
    scheduleRead(SETTLE_MS);
  });

  observer.observe(document.body, {
    childList: true,
    subtree: true,
    attributes: true,
    attributeFilter: ["style", "id", "class"],
  });

  console.log(LOG_PREFIX, "loaded");
  scheduleRead(0);
})();
