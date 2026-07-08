import { collectFingerprint, type FingerprintPayload } from "./api";

const SESSION_KEY = "liora.fp.sent";

type NavigatorWithExtras = Navigator & {
  deviceMemory?: number;
  connection?: { effectiveType?: string };
};

async function computeCanvasHash(): Promise<string | undefined> {
  try {
    const canvas = document.createElement("canvas");
    canvas.width = 240;
    canvas.height = 60;
    const ctx = canvas.getContext("2d");
    if (!ctx) return undefined;
    ctx.textBaseline = "top";
    ctx.font = "14px 'Arial'";
    ctx.fillStyle = "#f60";
    ctx.fillRect(0, 0, 240, 60);
    ctx.fillStyle = "#069";
    ctx.fillText("liora-fp", 2, 15);
    ctx.fillStyle = "rgba(102,204,0,0.7)";
    ctx.fillText("liora-fp", 4, 17);
    const data = canvas.toDataURL();
    let hash = 0;
    for (let i = 0; i < data.length; i++) {
      hash = (hash << 5) - hash + data.charCodeAt(i);
      hash |= 0;
    }
    return String(hash);
  } catch {
    return undefined;
  }
}

function readGpu(): { vendor?: string; renderer?: string } {
  try {
    const canvas = document.createElement("canvas");
    const gl = (canvas.getContext("webgl") ??
      canvas.getContext("experimental-webgl")) as WebGLRenderingContext | null;
    if (!gl) return {};
    const info = gl.getExtension("WEBGL_debug_renderer_info");
    if (!info) return {};
    return {
      vendor: gl.getParameter(info.UNMASKED_VENDOR_WEBGL) as string,
      renderer: gl.getParameter(info.UNMASKED_RENDERER_WEBGL) as string,
    };
  } catch {
    return {};
  }
}

async function buildPayload(): Promise<FingerprintPayload> {
  const nav = navigator as NavigatorWithExtras;
  const [canvasHash, gpu] = await Promise.all([
    computeCanvasHash(),
    Promise.resolve(readGpu()),
  ]);
  return {
    userAgent: nav.userAgent,
    platform: nav.platform,
    vendor: nav.vendor,
    language: nav.language,
    languages: (nav.languages ?? []).join(","),
    cookiesEnabled: nav.cookieEnabled,
    doNotTrack: nav.doNotTrack ?? "",
    cpuCores: nav.hardwareConcurrency,
    deviceMemory: nav.deviceMemory,
    maxTouchPoints: nav.maxTouchPoints,
    screenWidth: window.screen.width,
    screenHeight: window.screen.height,
    screenColorDepth: window.screen.colorDepth,
    devicePixelRatio: window.devicePixelRatio,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
    timezoneOffset: new Date().getTimezoneOffset(),
    connectionType: nav.connection?.effectiveType,
    canvasHash,
    gpuVendor: gpu.vendor,
    gpuRenderer: gpu.renderer,
    referrer: document.referrer,
    pageUrl: window.location.href,
    webdriver: nav.webdriver === true,
  };
}

export async function sendFingerprintOnce(): Promise<void> {
  if (typeof window === "undefined") return;
  try {
    if (window.sessionStorage.getItem(SESSION_KEY)) return;
    window.sessionStorage.setItem(SESSION_KEY, "1");
  } catch {
    // sessionStorage unavailable — just proceed
  }
  try {
    const payload = await buildPayload();
    await collectFingerprint(payload);
  } catch {
    // endpoint always returns 200; any local error is swallowed
  }
}
