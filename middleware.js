import { next } from "@vercel/edge";

/* 사이트 전체를 Basic 인증으로 막는다.
   비밀번호는 저장소에 두지 않고 Vercel 환경변수 SITE_PASSWORD로 주입한다.
   아이디는 확인하지 않으므로 로그인 창에서 비워두고 비밀번호만 넣으면 된다. */
const REALM = "Hana Bond ETF Monitoring";

export const config = {
  matcher: "/(.*)"
};

export function readPassword(header) {
  if (typeof header !== "string" || !header.startsWith("Basic ")) {
    return null;
  }
  try {
    const decoded = atob(header.slice(6).trim());
    const separator = decoded.indexOf(":");
    return separator === -1 ? null : decoded.slice(separator + 1);
  } catch {
    return null;
  }
}

// 길이가 달라도 같은 횟수를 돌려, 응답 시간으로 비밀번호 길이가 새지 않게 한다
export function matchesPassword(input, expected) {
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

export default function middleware(request) {
  const expected = process.env.SITE_PASSWORD;

  // 환경변수가 없으면 열어두지 않고 막는다. 설정 누락이 곧 무방비가 되면 안 된다.
  if (!expected) {
    return new Response("SITE_PASSWORD 환경변수가 설정되지 않았습니다.", {
      status: 503,
      headers: {
        "content-type": "text/plain; charset=utf-8",
        "cache-control": "no-store"
      }
    });
  }

  const supplied = readPassword(request.headers.get("authorization"));
  if (supplied !== null && matchesPassword(supplied, expected)) {
    return next();
  }

  return new Response("인증이 필요합니다.", {
    status: 401,
    headers: {
      "www-authenticate": `Basic realm="${REALM}", charset="UTF-8"`,
      "content-type": "text/plain; charset=utf-8",
      "cache-control": "no-store"
    }
  });
}
