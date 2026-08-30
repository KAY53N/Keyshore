/**
 * Keyshore — Manifest V3 Service Worker
 * Service Worker 随时可能被 Chrome 休眠，状态不要只放内存变量里。
 */

const DEFAULT_SETTINGS = {
    enabled: true,
    theme: "system"
};

chrome.runtime.onInstalled.addListener(async (details) => {
    if (details.reason === "install") {
        await chrome.storage.sync.set({ settings: DEFAULT_SETTINGS });
    }

    chrome.contextMenus.removeAll(() => {
        chrome.contextMenus.create({
            id: "keyshore-toggle",
            title: "启用 / 停用 Keyshore",
            contexts: ["action", "page"]
        });
    });
});

// 配置了 default_popup 时，点击图标会打开弹窗，这段不会触发
chrome.action.onClicked.addListener(async (tab) => {
    if (!tab?.id) return;
    const enabled = await getEnabled();
    await setEnabled(!enabled);
});

chrome.contextMenus.onClicked.addListener(async (info, tab) => {
    if (info.menuItemId !== "keyshore-toggle") return;
    const enabled = await getEnabled();
    await setEnabled(!enabled);

    if (tab?.id) {
        chrome.tabs.sendMessage(tab.id, {
            type: "KEYSHORE_TOGGLE",
            enabled: !enabled
        }).catch(() => {});
    }
});

chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
    handleMessage(message, sender)
        .then(sendResponse)
        .catch((error) => sendResponse({ ok: false, error: String(error) }));
    return true; // 异步回复必须写
});

async function handleMessage(message, sender) {
    switch (message?.type) {
        case "GET_SETTINGS":
            return { ok: true, settings: await getSettings() };
        case "SET_SETTINGS":
            await chrome.storage.sync.set({
                settings: { ...(await getSettings()), ...message.payload }
            });
            return { ok: true };
        case "TOGGLE": {
            const next = !(await getEnabled());
            await setEnabled(next);
            return { ok: true, enabled: next };
        }
        default:
            return { ok: false, error: `未知消息类型: ${message?.type}` };
    }
}

async function getSettings() {
    const { settings } = await chrome.storage.sync.get("settings");
    return { ...DEFAULT_SETTINGS, ...settings };
}

async function getEnabled() {
    return Boolean((await getSettings()).enabled);
}

async function setEnabled(enabled) {
    const settings = await getSettings();
    await chrome.storage.sync.set({ settings: { ...settings, enabled } });
    await chrome.action.setBadgeText({ text: enabled ? "" : "OFF" });
    await chrome.action.setBadgeBackgroundColor({ color: "#64748b" });
}