const FULL_ADDRESS = "0x9cb0b6a4e1c2d8f40b";
const STORE_KEY = "keyshore-wallets";

const toastEl = document.getElementById("toast");
const copyBtn = document.getElementById("copyBtn");
const addrBtn = document.getElementById("addrBtn");
const rangeBtn = document.getElementById("rangeBtn");
const identiconEl = document.getElementById("identicon");
const addrText = document.getElementById("addrText");
const walletMeta = document.getElementById("walletMeta");
const pickerList = document.getElementById("pickerList");
const manageList = document.getElementById("manageList");
const walletMenu = document.getElementById("walletMenu");
const createName = document.getElementById("createName");
const importName = document.getElementById("importName");
const importSecret = document.getElementById("importSecret");
const importSecretLabel = document.getElementById("importSecretLabel");
const dialogEl = document.getElementById("dialog");
const dialogTitle = document.getElementById("dialogTitle");
const dialogText = document.getElementById("dialogText");
const dialogInput = document.getElementById("dialogInput");
const dialogOk = document.getElementById("dialogOk");
const dialogCancel = document.getElementById("dialogCancel");

const VIEWS = ["picker", "manage", "add", "create", "import"];
const KIND_LABEL = {
  privateKey: "私钥钱包",
  mnemonic: "助记词钱包",
  watch: "观察钱包"
};

const state = {
  view: "home",
  importKind: "mnemonic",
  menuWalletId: null,
  currentAccountId: "a1",
  wallets: [
    {
      id: "w1",
      name: "KAY53N-OKX-001",
      kind: "privateKey",
      accounts: [
        { id: "a1", name: "账户 1", address: FULL_ADDRESS, usd: 22.3 }
      ]
    }
  ]
};

function toast(text) {
  toastEl.textContent = text;
  toastEl.hidden = false;
  clearTimeout(toastEl._t);
  toastEl._t = setTimeout(() => {
    toastEl.hidden = true;
  }, 1400);
}

function shortAddr(address) {
  if (!address || address.length < 12) return address;
  return `${address.slice(0, 6)}...${address.slice(-4)}`;
}

function formatUsd(n) {
  return `$${Number(n).toFixed(2)}`;
}

function hash32(str) {
  let h = 2166136261;
  for (let i = 0; i < str.length; i++) {
    h ^= str.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function identiconBackground(address) {
  if (address === FULL_ADDRESS) {
    return [
      "linear-gradient(90deg, #19c37d 0 7px, #0b0f0c 7px 14px, #19c37d 14px 21px, #0b0f0c 21px 28px)",
      "linear-gradient(#19c37d, #19c37d)"
    ].join(",");
  }
  const h = hash32(address);
  const c1 = `hsl(${h % 360} 72% 38%)`;
  const c2 = `hsl(${(h >> 8) % 360} 18% 12%)`;
  return [
    `linear-gradient(90deg, ${c1} 0 7px, ${c2} 7px 14px, ${c1} 14px 21px, ${c2} 21px 28px)`,
    `linear-gradient(${c1}, ${c1})`
  ].join(",");
}

function mockAddress(seed) {
  const h1 = hash32(String(seed)).toString(16).padStart(8, "0");
  const h2 = hash32(`${seed}:b`).toString(16).padStart(8, "0");
  const h3 = hash32(`${seed}:c`).toString(16).padStart(8, "0");
  const h4 = hash32(`${seed}:d`).toString(16).padStart(8, "0");
  const h5 = hash32(`${seed}:e`).toString(16).padStart(8, "0");
  return `0x${(h1 + h2 + h3 + h4 + h5).slice(0, 40)}`;
}

function uid(prefix) {
  return `${prefix}-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`;
}

function currentAccount() {
  for (const wallet of state.wallets) {
    const account = wallet.accounts.find((item) => item.id === state.currentAccountId);
    if (account) return { wallet, account };
  }
  const wallet = state.wallets[0];
  const account = wallet?.accounts[0];
  if (account) state.currentAccountId = account.id;
  return { wallet, account };
}

function nextWalletName() {
  const n = state.wallets.length + 1;
  return `钱包 ${n}`;
}

function persist() {
  const payload = {
    currentAccountId: state.currentAccountId,
    wallets: state.wallets
  };
  try {
    localStorage.setItem(STORE_KEY, JSON.stringify(payload));
  } catch {
    /* ignore quota / private mode */
  }
  if (globalThis.chrome?.storage?.local) {
    chrome.storage.local.set({ [STORE_KEY]: payload }).catch(() => {});
  }
}

function loadPersisted(raw) {
  if (!raw?.wallets?.length) return;
  state.wallets = raw.wallets;
  state.currentAccountId = raw.currentAccountId || raw.wallets[0].accounts[0].id;
}

async function restore() {
  try {
    const local = localStorage.getItem(STORE_KEY);
    if (local) loadPersisted(JSON.parse(local));
  } catch {
    /* ignore */
  }
  if (globalThis.chrome?.storage?.local) {
    try {
      const data = await chrome.storage.local.get(STORE_KEY);
      if (data[STORE_KEY]) loadPersisted(data[STORE_KEY]);
    } catch {
      /* ignore */
    }
  }
}

function showView(name) {
  state.view = name;
  closeMenu();
  addrBtn.classList.toggle("is-open", name === "picker");
  addrBtn.setAttribute("aria-expanded", String(name === "picker"));
  for (const id of VIEWS) {
    document.getElementById(`view-${id}`).hidden = id !== name;
  }
  if (name === "create") {
    createName.value = nextWalletName();
    createName.focus();
  }
  if (name === "import") {
    setImportKind("mnemonic");
    importName.value = nextWalletName();
    importSecret.value = "";
    importSecret.focus();
  }
}

function renderHome() {
  const { wallet, account } = currentAccount();
  if (!account) return;
  identiconEl.style.background = identiconBackground(account.address);
  identiconEl.style.backgroundSize = "28px 7px, 28px 28px";
  addrText.textContent = shortAddr(account.address);
  walletMeta.textContent = `${KIND_LABEL[wallet.kind]} · ${wallet.name}`;
  document.querySelector(".balance h1").textContent = formatUsd(account.usd);
}

function renderPicker() {
  pickerList.innerHTML = state.wallets
    .map((wallet) => {
      const rows = wallet.accounts
        .map((account) => {
          const current = account.id === state.currentAccountId;
          return `
            <button type="button" class="account-row${current ? " is-current" : ""}" data-select="${account.id}">
              <div class="identicon" style="background:${identiconBackground(account.address)};background-size:28px 7px, 28px 28px"></div>
              <div class="account-main">
                <div class="account-addr">${shortAddr(account.address)}</div>
                <div class="account-sub">${KIND_LABEL[wallet.kind]} · ${wallet.name}</div>
              </div>
              <div class="account-right">
                <span class="account-usd">${formatUsd(account.usd)}</span>
                ${current ? checkIcon() : ""}
              </div>
            </button>
          `;
        })
        .join("");
      return `<section class="wallet-group">${rows}</section>`;
    })
    .join("");
}

function renderManage() {
  manageList.innerHTML = state.wallets
    .map((wallet) => {
      const total = wallet.accounts.reduce((sum, item) => sum + item.usd, 0);
      const accounts = wallet.accounts
        .map((account) => {
          const current = account.id === state.currentAccountId;
          return `
            <button type="button" class="account-row${current ? " is-current" : ""}" data-select="${account.id}">
              <div class="identicon" style="background:${identiconBackground(account.address)};background-size:28px 7px, 28px 28px"></div>
              <div class="account-main">
                <div class="account-addr">${account.name}</div>
                <div class="account-sub">${shortAddr(account.address)}</div>
              </div>
              <div class="account-right">
                <span class="account-usd">${formatUsd(account.usd)}</span>
                ${current ? checkIcon() : ""}
              </div>
            </button>
          `;
        })
        .join("");
      return `
        <section class="wallet-group">
          <div class="manage-card">
            <div class="identicon" style="background:${identiconBackground(wallet.accounts[0].address)};background-size:28px 7px, 28px 28px"></div>
            <div class="manage-main">
              <div class="manage-title">${wallet.name}</div>
              <div class="account-sub">${KIND_LABEL[wallet.kind]} · ${wallet.accounts.length} 个账户 · ${formatUsd(total)}</div>
            </div>
            <button type="button" class="more-btn" data-more="${wallet.id}" title="更多">⋯</button>
          </div>
          ${accounts}
        </section>
      `;
    })
    .join("");
}

function checkIcon() {
  return `
    <svg class="check" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.2">
      <path d="M5 12l5 5L20 7"/>
    </svg>
  `;
}

function render() {
  renderHome();
  renderPicker();
  renderManage();
}

function selectAccount(id) {
  state.currentAccountId = id;
  persist();
  render();
  showView("home");
}

function addWallet({ name, kind, address, usd = 0 }) {
  const accountId = uid("a");
  state.wallets.push({
    id: uid("w"),
    name: name.trim() || nextWalletName(),
    kind,
    accounts: [{ id: accountId, name: "账户 1", address, usd }]
  });
  state.currentAccountId = accountId;
  persist();
  render();
  showView("picker");
}

function openDialog({ title, text = "", value = null, confirmText = "确定", danger = false }) {
  return new Promise((resolve) => {
    if (!dialogEl.hidden) dialogEl._finish?.(null);
    dialogTitle.textContent = title;
    dialogText.textContent = text;
    dialogText.hidden = !text;
    dialogOk.textContent = confirmText;
    dialogOk.classList.toggle("danger", danger);
    const useInput = value != null;
    dialogInput.hidden = !useInput;
    dialogInput.value = useInput ? value : "";
    dialogEl.hidden = false;
    if (useInput) dialogInput.focus();
    else dialogOk.focus();

    const finish = (result) => {
      dialogEl.hidden = true;
      dialogCancel.removeEventListener("click", onCancel);
      dialogOk.removeEventListener("click", onOk);
      dialogInput.removeEventListener("keydown", onKey);
      resolve(result);
    };
    const onCancel = () => finish(null);
    const onOk = () => finish(useInput ? dialogInput.value : true);
    const onKey = (event) => {
      if (event.key === "Enter") onOk();
    };
    dialogCancel.addEventListener("click", onCancel);
    dialogOk.addEventListener("click", onOk);
    dialogInput.addEventListener("keydown", onKey);
    dialogEl._finish = onCancel;
  });
}

async function renameWallet(id) {
  const wallet = state.wallets.find((item) => item.id === id);
  if (!wallet) return;
  const next = await openDialog({
    title: "重命名钱包",
    value: wallet.name,
    confirmText: "保存"
  });
  if (next == null) return;
  const name = next.trim();
  if (!name) {
    toast("名称不能为空");
    return;
  }
  wallet.name = name;
  persist();
  render();
}

async function deleteWallet(id) {
  if (state.wallets.length === 1) {
    toast("至少保留一个钱包");
    return;
  }
  const wallet = state.wallets.find((item) => item.id === id);
  if (!wallet) return;
  const ok = await openDialog({
    title: "删除钱包",
    text: `删除「${wallet.name}」？仅移除本机数据。`,
    confirmText: "删除",
    danger: true
  });
  if (!ok) return;
  const removingCurrent = wallet.accounts.some((item) => item.id === state.currentAccountId);
  state.wallets = state.wallets.filter((item) => item.id !== id);
  if (removingCurrent) state.currentAccountId = state.wallets[0].accounts[0].id;
  persist();
  render();
  toast("钱包已删除");
}

function closeMenu() {
  walletMenu.hidden = true;
  state.menuWalletId = null;
}

function openMenu(walletId, anchor) {
  state.menuWalletId = walletId;
  walletMenu.hidden = false;
  const rect = anchor.getBoundingClientRect();
  const top = Math.min(rect.bottom + 4, window.innerHeight - 96);
  const left = Math.min(rect.right - 148, window.innerWidth - 160);
  walletMenu.style.top = `${Math.max(8, top)}px`;
  walletMenu.style.left = `${Math.max(8, left)}px`;
}

async function copyAddress() {
  const { account } = currentAccount();
  const address = account?.address || FULL_ADDRESS;
  try {
    await navigator.clipboard.writeText(address);
    toast("地址已复制");
  } catch {
    toast(address);
  }
}

copyBtn.addEventListener("click", copyAddress);

addrBtn.addEventListener("click", () => {
  showView(state.view === "picker" ? "home" : "picker");
});

document.querySelectorAll("[data-nav]").forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.nav));
});

document.getElementById("manageWalletsBtn").addEventListener("click", () => showView("manage"));
document.getElementById("addWalletBtn").addEventListener("click", () => showView("add"));
document.getElementById("manageAddBtn").addEventListener("click", () => showView("add"));

pickerList.addEventListener("click", (event) => {
  const row = event.target.closest("[data-select]");
  if (row) selectAccount(row.dataset.select);
});

manageList.addEventListener("click", (event) => {
  const more = event.target.closest("[data-more]");
  if (more) {
    event.stopPropagation();
    if (state.menuWalletId === more.dataset.more && !walletMenu.hidden) {
      closeMenu();
      return;
    }
    openMenu(more.dataset.more, more);
    return;
  }
  const row = event.target.closest("[data-select]");
  if (row) selectAccount(row.dataset.select);
});

walletMenu.addEventListener("click", (event) => {
  const act = event.target.closest("[data-menu]")?.dataset.menu;
  const id = state.menuWalletId;
  closeMenu();
  if (act === "rename") renameWallet(id);
  if (act === "delete") deleteWallet(id);
});

document.addEventListener("click", (event) => {
  if (!walletMenu.hidden && !event.target.closest("#walletMenu, [data-more]")) {
    closeMenu();
  }
});

document.querySelectorAll("[data-add]").forEach((btn) => {
  btn.addEventListener("click", () => showView(btn.dataset.add));
});

document.getElementById("createForm").addEventListener("submit", (event) => {
  event.preventDefault();
  addWallet({
    name: createName.value,
    kind: "mnemonic",
    address: mockAddress(createName.value + Date.now()),
    usd: 0
  });
  toast("钱包已创建");
});

function setImportKind(kind) {
  state.importKind = kind;
  document.querySelectorAll("[data-import-kind]").forEach((item) => {
    item.classList.toggle("is-active", item.dataset.importKind === kind);
  });
  const mnemonic = kind === "mnemonic";
  importSecretLabel.textContent = mnemonic ? "助记词" : "私钥";
  importSecret.placeholder = mnemonic ? "用空格分隔的单词" : "0x 开头的私钥";
}

document.querySelectorAll("[data-import-kind]").forEach((btn) => {
  btn.addEventListener("click", () => setImportKind(btn.dataset.importKind));
});

document.getElementById("importForm").addEventListener("submit", (event) => {
  event.preventDefault();
  const secret = importSecret.value.trim();
  if (!secret) {
    toast(state.importKind === "mnemonic" ? "请输入助记词" : "请输入私钥");
    return;
  }
  addWallet({
    name: importName.value,
    kind: state.importKind === "mnemonic" ? "mnemonic" : "privateKey",
    address: mockAddress(secret),
    usd: 0
  });
  toast("钱包已导入");
});

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

dialogEl.addEventListener("click", (event) => {
  if (event.target === dialogEl) dialogEl._finish?.(null);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Escape") return;
  if (!dialogEl.hidden) {
    dialogEl._finish?.(null);
    return;
  }
  if (!walletMenu.hidden) {
    closeMenu();
    return;
  }
  const back = {
    picker: "home",
    manage: "picker",
    add: "picker",
    create: "add",
    import: "add"
  };
  if (back[state.view]) showView(back[state.view]);
});

restore().then(() => {
  render();
  const initial = new URLSearchParams(location.search).get("view");
  if (VIEWS.includes(initial)) showView(initial);
});
