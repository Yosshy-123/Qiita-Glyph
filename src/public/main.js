const userId = document.getElementById("userId");
const theme = document.getElementById("theme");
const badge = document.getElementById("badge");
const output = document.getElementById("output");
const loader = document.getElementById("loader");
const buttons = document.querySelectorAll(".exports button");

let timer;

function buildUrl() {
  return `/api/${encodeURIComponent(userId.value)}/qiita.svg?theme=${theme.value}`;
}

function update() {
  clearTimeout(timer);

  if (!userId.value.trim()) return;

  timer = setTimeout(() => {
    const url = buildUrl();

    badge.parentElement.classList.add("loading");
    badge.onload = () =>
      badge.parentElement.classList.remove("loading");

    badge.src = url;
    output.textContent = location.origin + url;
  }, 300);
}

userId.addEventListener("input", update);
theme.addEventListener("change", update);

buttons.forEach((btn) => {
  btn.addEventListener("click", () => {
    const url = location.origin + buildUrl();

    const text =
      btn.dataset.type === "md"
        ? `![Qiita Badge](${url})`
        : btn.dataset.type === "html"
        ? `<img src="${url}" />`
        : url;

    navigator.clipboard.writeText(text);
    output.textContent = text;
  });
});
