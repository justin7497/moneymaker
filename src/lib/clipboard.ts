function copyViaExecCommand(text: string, html?: string): void {
  const container = document.createElement("div");
  container.setAttribute("contenteditable", "true");
  container.style.position = "fixed";
  container.style.left = "-9999px";
  container.style.top = "0";

  if (html) {
    container.innerHTML = html;
  } else {
    container.textContent = text;
  }

  document.body.appendChild(container);

  const selection = window.getSelection();
  const range = document.createRange();
  range.selectNodeContents(container);
  selection?.removeAllRanges();
  selection?.addRange(range);

  const ok = document.execCommand("copy");
  selection?.removeAllRanges();
  document.body.removeChild(container);

  if (!ok) {
    throw new Error("execCommand copy failed");
  }
}

export async function copyText(text: string): Promise<void> {
  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(text);
      return;
    }
  } catch {
    // Fall through to execCommand (e.g. unfocused document).
  }

  copyViaExecCommand(text);
}

/** Copy HTML for rich paste (Naver editor) with plain-text fallback. */
export async function copyHtml(html: string, plainText: string): Promise<void> {
  try {
    if (navigator.clipboard?.write && typeof ClipboardItem !== "undefined") {
      const item = new ClipboardItem({
        "text/html": new Blob([html], { type: "text/html" }),
        "text/plain": new Blob([plainText], { type: "text/plain" }),
      });
      await navigator.clipboard.write([item]);
      return;
    }
  } catch {
    // Fall through.
  }

  try {
    if (navigator.clipboard?.writeText) {
      await navigator.clipboard.writeText(plainText);
      return;
    }
  } catch {
    // Fall through to execCommand with HTML for rich paste.
  }

  copyViaExecCommand(plainText, html);
}
