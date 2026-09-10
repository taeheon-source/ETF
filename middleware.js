import { next } from "@vercel/edge";

/* 사이트 전체를 로그인 뒤로 숨긴다.
   비밀번호는 저장소에 두지 않고 Vercel 환경변수 SITE_PASSWORD로 주입한다.
   세션 쿠키는 그 비밀번호를 키로 서명하므로, 비밀번호를 바꾸면
   기존 세션이 한꺼번에 무효가 된다. */
const SESSION_COOKIE = "hb_session";
const SESSION_MAX_AGE = 60 * 60 * 12;
const LOGIN_PATH = "/login";
const AUTH_PATH = "/__auth";
const LOGOUT_PATH = "/__logout";
// 로그인 화면 자체와 탭 아이콘은 열어둔다. 그 외에는 전부 막힌다.
const PUBLIC_PATHS = new Set([LOGIN_PATH, "/login.html", "/favicon.svg"]);

export const config = {
  matcher: "/(.*)"
};

const encoder = new TextEncoder();

async function sign(value, secret) {
  const key = await crypto.subtle.importKey(
    "raw",
    encoder.encode(secret),
    { name: "HMAC", hash: "SHA-256" },
    false,
    ["sign"]
  );
  const signature = await crypto.subtle.sign("HMAC", key, encoder.encode(value));
  return [...new Uint8Array(signature)].map((byte) => byte.toString(16).padStart(2, "0")).join("");
}

// 길이가 달라도 같은 횟수를 돌려, 응답 시간으로 정답 길이가 새지 않게 한다
export function timingSafeEqual(input, expected) {
  if (typeof input !== "string" || typeof expected !== "string") {
    return false;
  }
  let diff = input.length ^ expected.length;
  const length = Math.max(input.length, expected.length);
  for (let i = 0; i < length; i += 1) {
    diff |= (input.charCodeAt(i) || 0) ^ (expected.charCodeAt(i) || 0);
  }
  return diff === 0;
}

export function readCookie(header, name) {
  if (typeof header !== "string") {
    return null;
  }
  for (const part of header.split(";")) {
    const separator = part.indexOf("=");
    if (separator === -1) {
      continue;
    }
    if (part.slice(0, separator).trim() === name) {
      return part.slice(separator + 1).trim();
    }
  }
  return null;
}

// 열린 리디렉션을 막기 위해 같은 사이트의 경로만 되돌려준다
export function safeNextPath(value) {
  if (typeof value !== "string" || !value.startsWith("/") || value.startsWith("//")) {
    return "/";
  }
  return value;
}

export async function createSessionToken(secret, now = Date.now()) {
  const expires = String(now + SESSION_MAX_AGE * 1000);
  return `${expires}.${await sign(expires, secret)}`;
}

export async function isSessionValid(token, secret, now = Date.now()) {
  if (typeof token !== "string") {
    return false;
  }
  const separator = token.indexOf(".");
  if (separator === -1) {
    return false;
  }
  const expires = token.slice(0, separator);
  const signature = token.slice(separator + 1);
  const expiresAt = Number(expires);
  if (!expires || !Number.isFinite(expiresAt) || expiresAt <= now) {
    return false;
  }
  return timingSafeEqual(signature, await sign(expires, secret));
}

function sessionCookie(token, secure) {
  const parts = [
    `${SESSION_COOKIE}=${token}`,
    "Path=/",
    "HttpOnly",
    "SameSite=Lax",
    `Max-Age=${token ? SESSION_MAX_AGE : 0}`
  ];
  if (secure) {
    parts.push("Secure");
  }
  return parts.join("; ");
}

async function readSubmittedPassword(request) {
  const contentType = request.headers.get("content-type") || "";
  try {
    if (contentType.includes("application/json")) {
      const body = await request.json();
      return typeof body?.password === "string" ? body.password : "";
    }
    const form = await request.formData();
    const value = form.get("password");
    return typeof value === "string" ? value : "";
  } catch {
    return "";
  }
}

function jsonResponse(body, status, extraHeaders = {}) {
  return new Response(JSON.stringify(body), {
    status,
    headers: {
      "content-type": "application/json; charset=utf-8",
      "cache-control": "no-store",
      ...extraHeaders
    }
  });
}

export default async function middleware(request) {
  const password = process.env.SITE_PASSWORD;

  // 환경변수가 없으면 열어두지 않고 막는다. 설정 누락이 곧 무방비가 되면 안 된다.
  if (!password) {
    return new Response("SITE_PASSWORD 환경변수가 설정되지 않았습니다.", {
      status: 503,
      headers: { "content-type": "text/plain; charset=utf-8", "cache-control": "no-store" }
    });
  }

  const url = new URL(request.url);
  const secure = url.protocol === "https:";

  if (url.pathname === AUTH_PATH) {
    if (request.method !== "POST") {
      return jsonResponse({ error: "POST만 허용됩니다." }, 405);
    }
    const submitted = await readSubmittedPassword(request);
    if (!timingSafeEqual(submitted, password)) {
      return jsonResponse({ error: "비밀번호가 올바르지 않습니다." }, 401);
    }
    const token = await createSessionToken(password);
    return jsonResponse({ ok: true }, 200, { "set-cookie": sessionCookie(token, secure) });
  }

  if (url.pathname === LOGOUT_PATH) {
    return new Response(null, {
      status: 303,
      headers: {
        location: LOGIN_PATH,
        "set-cookie": sessionCookie("", secure),
        "cache-control": "no-store"
      }
    });
  }

  if (PUBLIC_PATHS.has(url.pathname)) {
    return next();
  }

  const token = readCookie(request.headers.get("cookie"), SESSION_COOKIE);
  if (await isSessionValid(token, password)) {
    return next();
  }

  /* API 요청에 로그인 화면을 돌려주면 프런트가 HTML을 JSON으로 파싱한다.
     화면 이동만 로그인으로 보내고 나머지는 401로 끊는다. */
  if (url.pathname.startsWith("/api/")) {
    return jsonResponse({ error: "로그인이 필요합니다." }, 401);
  }

  const target = new URL(LOGIN_PATH, url);
  target.searchParams.set("next", url.pathname + url.search);
  return new Response(null, {
    status: 303,
    headers: { location: target.toString(), "cache-control": "no-store" }
  });
}
