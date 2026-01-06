const copiedHtml = `<span style="display: flex; gap: 4px; align-items: center"><svg xmlns="http://www.w3.org/2000/svg" height="20px" viewBox="0 -960 960 960" width="20px" fill="green"><path d="M382-240 154-468l57-57 171 171 367-367 57 57-424 424Z"/></svg>Copied!</span>`;

const initCopyButtons = () => {
  const isCopyAllowed = navigator.clipboard !== undefined;
  document.querySelectorAll(".copy-code-button").forEach(copyButton => {
    if (!isCopyAllowed) {
      copyButton.classList.add("disabled");
      return;
    }
    const codeBlock = copyButton.previousElementSibling;
    const prevText = copyButton.innerHTML;
    copyButton.addEventListener("click", () => {
      const text = codeBlock?.textContent || codeBlock?.innerText;
      navigator.clipboard.writeText(text).then(() => {
        copyButton.innerHTML = "Copied!";
        // setTimeout(() => copyButton.innerHTML = prevText, 2000);
      }).catch(err => {
        console.error(`Clipboard Copy failed: ${err}`);
        copyButton.innerHTML = "❌ Failed!";
        setTimeout(() => copyButton.innerHTML = prevText, 2000);
      })
    });
  })
};

document.addEventListener("DOMContentLoaded", function () {
  initCopyButtons();
});
