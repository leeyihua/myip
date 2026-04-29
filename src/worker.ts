interface IpInfo {
  ip: string | null;
  headers: {
    "CF-Connecting-IP": string | null;
    "True-Client-IP": string | null;
    "X-Real-IP": string | null;
    "X-Forwarded-For": string | null;
  };
  geo: {
    country: string | null;
    asn: number | null;
    city: string | null;
    region: string | null;
  };
}

function extractIpInfo(request: Request): IpInfo {
  const h = request.headers;
  const cf = request.cf as Record<string, unknown> | undefined;

  const cfConnectingIp = h.get("CF-Connecting-IP");
  const trueClientIp = h.get("True-Client-IP");
  const xRealIp = h.get("X-Real-IP");
  const xForwardedFor = h.get("X-Forwarded-For");

  const ip =
    cfConnectingIp ??
    trueClientIp ??
    xRealIp ??
    (xForwardedFor ? xForwardedFor.split(",")[0].trim() : null);

  return {
    ip,
    headers: {
      "CF-Connecting-IP": cfConnectingIp,
      "True-Client-IP": trueClientIp,
      "X-Real-IP": xRealIp,
      "X-Forwarded-For": xForwardedFor,
    },
    geo: {
      country: (cf?.country as string) ?? null,
      asn: (cf?.asn as number) ?? null,
      city: (cf?.city as string) ?? null,
      region: (cf?.region as string) ?? null,
    },
  };
}

function isIPv6(ip: string | null): boolean {
  return ip !== null && ip.includes(":");
}

function jsonResponse(info: IpInfo): Response {
  return new Response(JSON.stringify(info, null, 2), {
    headers: { "Content-Type": "application/json; charset=utf-8" },
  });
}

function row(label: string, value: string | number | null, id?: string): string {
  const val = value !== null
    ? String(value)
    : '<span class="none">（無）</span>';
  return `
    <tr>
      <td class="label">${label}</td>
      <td class="value"${id ? ` id="${id}"` : ""}>${val}</td>
    </tr>`;
}

function htmlResponse(info: IpInfo): Response {
  const ipv6 = isIPv6(info.ip);

  // IPv6 時：主顯示區先放 loading，等 client 端查到 IPv4 再填入；另外顯示 IPv6
  const mainIpDisplay = ipv6
    ? `<span class="loading" id="ip-main-val">查詢中…</span>`
    : (info.ip ?? "無法偵測");

  const ipv6Row = ipv6 ? `
  <h2>IPv6 位址</h2>
  <table>
    <tr>
      <td class="label">IPv6</td>
      <td class="value">${info.ip}</td>
    </tr>
  </table>` : "";

  const ipv4Script = ipv6 ? `
<script>
  fetch("https://api4.ipify.org?format=json")
    .then(r => r.json())
    .then(d => {
      document.getElementById("ip-main-val").textContent = d.ip || "（無法取得）";
      document.getElementById("ip-main-val").className = "";
    })
    .catch(() => {
      document.getElementById("ip-main-val").textContent = "（無法取得）";
      document.getElementById("ip-main-val").className = "";
    });
</script>` : "";

  const html = `<!DOCTYPE html>
<html lang="zh-TW">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<title>我的 IP</title>
<style>
  *, *::before, *::after { box-sizing: border-box; }
  body {
    font-family: ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace;
    background: #0f172a;
    color: #e2e8f0;
    display: flex;
    justify-content: center;
    align-items: flex-start;
    min-height: 100vh;
    padding: 2rem 1rem;
    margin: 0;
  }
  .card {
    background: #1e293b;
    border: 1px solid #334155;
    border-radius: 12px;
    padding: 2rem;
    width: 100%;
    max-width: 560px;
  }
  h1 { margin: 0 0 0.25rem; font-size: 1.4rem; color: #f8fafc; }
  .ip-main {
    font-size: 2rem;
    font-weight: 700;
    color: #38bdf8;
    margin: 0.5rem 0 1.5rem;
    word-break: break-all;
  }
  h2 { font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.1em; color: #64748b; margin: 1.5rem 0 0.5rem; }
  table { width: 100%; border-collapse: collapse; }
  td { padding: 0.4rem 0; font-size: 0.875rem; vertical-align: top; }
  td.label { color: #94a3b8; width: 45%; }
  td.value { color: #e2e8f0; word-break: break-all; }
  .none { color: #475569; font-style: italic; }
  .loading { color: #475569; font-style: italic; }
  .api-hint {
    margin-top: 1.5rem;
    padding: 0.75rem 1rem;
    background: #0f172a;
    border-radius: 8px;
    font-size: 0.8rem;
    color: #64748b;
  }
  .api-hint code { color: #7dd3fc; }
</style>
</head>
<body>
<div class="card">
  <h1>我的 IP</h1>
  <div class="ip-main">${mainIpDisplay}</div>

  ${ipv6Row}

  <h2>HTTP Headers</h2>
  <table>
    ${row("CF-Connecting-IP", info.headers["CF-Connecting-IP"])}
    ${row("True-Client-IP", info.headers["True-Client-IP"])}
    ${row("X-Real-IP", info.headers["X-Real-IP"])}
    ${row("X-Forwarded-For", info.headers["X-Forwarded-For"])}
  </table>

  <h2>地理資訊</h2>
  <table>
    ${row("國家", info.geo.country)}
    ${row("城市", info.geo.city)}
    ${row("地區", info.geo.region)}
    ${row("ASN", info.geo.asn)}
  </table>

  <div class="api-hint">
    JSON API：<code>GET /api</code> 或加上 <code>Accept: application/json</code> header
  </div>
</div>
${ipv4Script}
</body>
</html>`;

  return new Response(html, {
    headers: { "Content-Type": "text/html; charset=utf-8" },
  });
}

export default {
  async fetch(request: Request): Promise<Response> {
    const url = new URL(request.url);
    const info = extractIpInfo(request);

    const wantsJson =
      url.pathname === "/api" ||
      (request.headers.get("Accept") ?? "").includes("application/json");

    return wantsJson ? jsonResponse(info) : htmlResponse(info);
  },
} satisfies ExportedHandler;
