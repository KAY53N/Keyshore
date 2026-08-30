const FULL_ADDRESS = "0x9cb0b6a4e1c2d8f40b";

const toastEl = document.getElementById("toast");
const copyBtn = document.getElementById("copyBtn");
const addrBtn = document.getElementById("addrBtn");
const rangeBtn = document.getElementById("rangeBtn");

function toast(text) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => {
    toastEl.hidden = true;
  }, 1400);
}

async function copyAddress() {
  try {
    await navigator.clipboard.writeText(FULL_ADDRESS);
    toast("地址已复制");
  } catch {
    toast(FULL_ADDRESS);
  }
}

copyBtn.addEventListener("click", copyAddress);
addrBtn.addEventListener("click", copyAddress);

rangeBtn.addEventListener("click", () => {
  const next = rangeBtn.dataset.range === "7d" ? ["1d", "1日"] : ["7d", "7日"];
  rangeBtn.dataset.range = next[0];
  rangeBtn.innerHTML = `${next[1]} <span class="chevron">▾</span>`;
});

document.querySelectorAll(".tabs button").forEach((tab) => {
  tab.addEventListener("click", () => {
    document.querySelectorAll(".tabs button").forEach((t) => t.classList.remove("is-active"));
    document.querySelectorAll(".panel").forEach((p) => p.classList.remove("is-active"));
    tab.classList.add("is-active");
    document.getElementById(`panel-${tab.dataset.tab}`).classList.add("is-active");
  });
});

document.querySelectorAll(".actions button").forEach((btn) => {
  btn.addEventListener("click", () => {
    const labels = {
      send: "发送（示例）",
      receive: "接收（示例）",
      swap: "兑换（示例）",
      history: "交易历史（示例）",
      more: "更多（示例）"
    };
    toast(labels[btn.dataset.action] || "示例操作");
  });
});

document.getElementById("qrBtn").addEventListener("click", () => toast("收款码（示例）"));
document.getElementById("webBtn").addEventListener("click", () => toast("浏览器（示例）"));
