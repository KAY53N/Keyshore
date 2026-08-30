/**
 * Keyshore — Content Script
 * 和页面 JS 隔离，不能直接用页面里的变量。
 */

const STATE = {
    enabled: false,
    host: location.hostname
};

init();

async function init() {
    const res = await chrome.runtime.sendMessage({ type: "GET_SETTINGS" }).catch(() => null);
    STATE.enabled = Boolean(res?.settings?.enabled);

    if (STATE.enabled) enable();

    chrome.runtime.onMessage.addListener((message) => {
        if (message?.type === "KEYSHORE_TOGGLE") {
            message.enabled ? enable() : disable();
        }
    });
}

function enable() {
    STATE.enabled = true;
    renderBadge();
    // TODO: Keyshore 真正要对页面做的事写这里
}

function disable() {
    STATE.enabled = false;
    document.getElementById("keyshore-badge")?.remove();
}

function renderBadge() {
    if (document.getElementById("keyshore-badge")) return;

    const badge = document.createElement("div");
    badge.id = "keyshore-badge";
    badge.textContent = "Keyshore";
    Object.assign(badge.style, {
        position: "fixed",
        right: "16px",
        bottom: "16px",
        zIndex: "2147483647",
        padding: "6px 10px",
        borderRadius: "999px",
        background: "#0b3a4a",
        color: "#f5d76e",
        font: "12px/1.2 system-ui, sans-serif",
        boxShadow: "0 4px 16px rgba(0,0,0,.25)",
        pointerEvents: "none"
    });
    document.documentElement.appendChild(badge);
}