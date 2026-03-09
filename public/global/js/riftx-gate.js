(function () {
    const QUERY_KEY = "rx";
    const NOVA_MODE = "nova";
    const SKIP_ONCE_KEY = "riftx__skip_prompt_once";
    const CHOSEN_KEY = "riftx__chosen";
    const MODE_KEY = "riftx__mode";

    function normalizeMode(mode) {
        return String(mode || "").toLowerCase() === NOVA_MODE ? NOVA_MODE : "rift";
    }

    function getCurrentMode() {
        try {
            const params = new URLSearchParams(window.location.search || "");
            if (normalizeMode(params.get(QUERY_KEY)) === NOVA_MODE) return NOVA_MODE;
            if (String(window.location.pathname || "").toLowerCase().startsWith("/nova/")) return NOVA_MODE;
            return "rift";
        } catch {
            return "rift";
        }
    }

    function buildUrlForMode(mode) {
        const targetMode = normalizeMode(mode);
        const url = new URL(window.location.href);
        if (targetMode === NOVA_MODE) {
            url.searchParams.set(QUERY_KEY, NOVA_MODE);
        } else {
            url.searchParams.delete(QUERY_KEY);
        }
        if (/^\/nova\//i.test(url.pathname)) {
            url.pathname = url.pathname.replace(/^\/nova/i, "") || "/";
        }
        return `${url.pathname}${url.search}${url.hash}`;
    }

    function ensureStyles() {
        if (document.getElementById("riftx-gate-style")) return;
        const style = document.createElement("style");
        style.id = "riftx-gate-style";
        style.textContent = `
            .riftx-modal{position:fixed;inset:0;z-index:25000;display:none;place-items:center;background:rgba(0,0,0,.65);backdrop-filter:blur(8px)}
            .riftx-modal.active{display:grid}
            .riftx-card{width:min(520px,94vw);padding:18px;border-radius:16px;border:1px solid rgba(255,255,255,.2);background:linear-gradient(150deg,rgba(16,18,26,.95),rgba(11,13,20,.96));box-shadow:0 26px 54px rgba(0,0,0,.45)}
            .riftx-head h2{margin:0;color:#fff;font-size:19px;letter-spacing:.08em;text-transform:lowercase}
            .riftx-head p{margin:8px 0 0;color:rgba(255,255,255,.68);font-size:12px;letter-spacing:.05em;text-transform:lowercase}
            .riftx-modes{margin-top:14px;display:grid;grid-template-columns:repeat(2,minmax(0,1fr));gap:10px}
            .riftx-mode-btn{border:1px solid rgba(255,255,255,.22);border-radius:12px;background:rgba(255,255,255,.06);padding:12px 10px;color:#fff;cursor:pointer;text-align:left}
            .riftx-mode-btn:hover{background:rgba(255,255,255,.12);border-color:rgba(255,255,255,.4)}
            .riftx-mode-btn.active{background:rgba(255,255,255,.18);border-color:rgba(255,255,255,.52)}
            .riftx-mode-title{display:block;font-size:14px;letter-spacing:.07em;text-transform:lowercase}
            .riftx-mode-sub{display:block;margin-top:5px;font-size:10px;color:rgba(255,255,255,.65);text-transform:lowercase}
            .riftx-controls{position:fixed;top:12px;right:12px;z-index:13000;display:flex;gap:6px}
            .riftx-btn{border:1px solid rgba(255,255,255,.28);border-radius:999px;background:rgba(10,14,20,.74);color:#fff;padding:7px 11px;min-height:34px;cursor:pointer;font-size:10px;letter-spacing:.08em;text-transform:lowercase;font-family:"Run",Arial,sans-serif;backdrop-filter:blur(8px)}
            .riftx-btn:hover{background:rgba(22,28,38,.82)}
        `;
        document.head.appendChild(style);
    }

    function ensureUi() {
        ensureStyles();

        let modal = document.getElementById("riftx-mode-modal");
        if (!modal) {
            modal = document.createElement("div");
            modal.id = "riftx-mode-modal";
            modal.className = "riftx-modal";
            modal.innerHTML = `
                <div class="riftx-card" role="dialog" aria-modal="true" aria-label="Choose interface">
                    <div class="riftx-head">
                        <h2>choose interface</h2>
                        <p>this choice is saved for this tab only.</p>
                    </div>
                    <div class="riftx-modes">
                        <button type="button" class="riftx-mode-btn" data-riftx-mode="rift">
                            <span class="riftx-mode-title">rift</span>
                            <span class="riftx-mode-sub">classic rift layout</span>
                        </button>
                        <button type="button" class="riftx-mode-btn" data-riftx-mode="nova">
                            <span class="riftx-mode-title">nova</span>
                            <span class="riftx-mode-sub">nova centered style</span>
                        </button>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
            modal.addEventListener("click", (event) => {
                if (event.target === modal && sessionStorage.getItem(CHOSEN_KEY) === "1") {
                    modal.classList.remove("active");
                }
            });
            modal.querySelectorAll("[data-riftx-mode]").forEach((btn) => {
                btn.addEventListener("click", () => {
                    setMode(btn.getAttribute("data-riftx-mode"), { fromChooser: true });
                });
            });
        }

        let controls = document.getElementById("riftx-controls");
        if (!controls) {
            controls = document.createElement("div");
            controls.id = "riftx-controls";
            controls.className = "riftx-controls";
            controls.innerHTML = `
                <button id="riftx-quick-switch" type="button" class="riftx-btn"></button>
                <button id="riftx-open-chooser" type="button" class="riftx-btn">choose</button>
            `;
            document.body.appendChild(controls);
            controls.querySelector("#riftx-quick-switch")?.addEventListener("click", () => {
                const current = getCurrentMode();
                const next = current === NOVA_MODE ? "rift" : NOVA_MODE;
                setMode(next, { fromChooser: false });
            });
            controls.querySelector("#riftx-open-chooser")?.addEventListener("click", () => {
                const m = document.getElementById("riftx-mode-modal");
                if (m) m.classList.add("active");
                updateUi();
            });
        }

        return { modal, controls };
    }

    function updateUi() {
        const mode = getCurrentMode();
        const quick = document.getElementById("riftx-quick-switch");
        if (quick) quick.textContent = mode === NOVA_MODE ? "quick -> rift" : "quick -> nova";
        document.querySelectorAll("[data-riftx-mode]").forEach((btn) => {
            btn.classList.toggle("active", normalizeMode(btn.getAttribute("data-riftx-mode")) === mode);
        });
    }

    function waitForBootThenOpen() {
        let checks = 0;
        const timer = window.setInterval(() => {
            checks += 1;
            const body = document.body;
            if (!body || body.classList.contains("rift-boot-active")) {
                if (checks < 220) return;
            }
            window.clearInterval(timer);
            const modal = document.getElementById("riftx-mode-modal");
            if (modal) modal.classList.add("active");
            updateUi();
        }, 120);
    }

    function setMode(mode, options = {}) {
        const next = normalizeMode(mode);
        const current = getCurrentMode();
        sessionStorage.setItem(CHOSEN_KEY, "1");
        sessionStorage.setItem(MODE_KEY, next);
        updateUi();
        if (next === current) {
            const modal = document.getElementById("riftx-mode-modal");
            if (modal) modal.classList.remove("active");
            return;
        }
        sessionStorage.setItem(SKIP_ONCE_KEY, "1");
        if (options.fromChooser === true) {
            window.location.assign(buildUrlForMode(next));
        } else {
            window.location.replace(buildUrlForMode(next));
        }
    }

    function init() {
        ensureUi();

        if (sessionStorage.getItem(SKIP_ONCE_KEY) === "1") {
            sessionStorage.removeItem(SKIP_ONCE_KEY);
        }

        const chosen = sessionStorage.getItem(CHOSEN_KEY) === "1";
        const savedMode = normalizeMode(sessionStorage.getItem(MODE_KEY));
        const currentMode = getCurrentMode();

        if (chosen) {
            if (savedMode !== currentMode) {
                window.location.replace(buildUrlForMode(savedMode));
                return;
            }
            updateUi();
            return;
        }

        waitForBootThenOpen();
    }

    window.RiftXMode = {
        get: getCurrentMode,
        set(mode) {
            setMode(mode, { fromChooser: true });
        },
        open() {
            const modal = document.getElementById("riftx-mode-modal");
            if (modal) modal.classList.add("active");
            updateUi();
        },
    };

    if (document.readyState === "loading") {
        document.addEventListener("DOMContentLoaded", init, { once: true });
    } else {
        init();
    }
})();
