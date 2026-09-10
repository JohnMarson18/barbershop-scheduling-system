import { NextRequest, NextResponse } from "next/server";

// Estrutura em memória para rastreamento de requisições por IP
interface RateLimitRecord {
  count: number;
  resetTime: number;
}

const rateLimitMap = new Map<string, RateLimitRecord>();

// Limpeza periódica para evitar vazamento de memória (a cada 5 minutos)
const CLEANUP_INTERVAL_MS = 5 * 60 * 1000;
let lastCleanup = Date.now();

function cleanupExpiredRecords(now: number) {
  if (now - lastCleanup > CLEANUP_INTERVAL_MS) {
    lastCleanup = now;
    rateLimitMap.forEach((record, key) => {
      if (now > record.resetTime) {
        rateLimitMap.delete(key);
      }
    });
  }
}

// Configuração de limites por rota e método
interface RouteLimitRule {
  windowMs: number;
  maxRequests: number;
}

const ROUTE_RULES: Record<string, RouteLimitRule> = {
  "POST:/api/auth/login": { windowMs: 60 * 1000, maxRequests: 10 },    // Max 10 logins por minuto por IP
  "POST:/api/auth/register": { windowMs: 60 * 1000, maxRequests: 5 },  // Max 5 cadastros por minuto por IP
  "POST:/api/appointments": { windowMs: 60 * 1000, maxRequests: 10 },  // Max 10 agendamentos por minuto por IP
};

export function middleware(request: NextRequest) {
  const method = request.method;
  const pathname = request.nextUrl.pathname;
  const ruleKey = `${method}:${pathname}`;
  const rule = ROUTE_RULES[ruleKey];

  // Apenas rotas com regras ativas são inspecionadas
  if (!rule) {
    return NextResponse.next();
  }

  // Identificação do IP do cliente de forma resiliente a proxies/CDNs
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded ? forwarded.split(",")[0].trim() : request.headers.get("x-real-ip") || "127.0.0.1";
  const rateLimitKey = `${ruleKey}:${ip}`;

  const now = Date.now();
  cleanupExpiredRecords(now);

  let record = rateLimitMap.get(rateLimitKey);

  if (!record || now > record.resetTime) {
    record = {
      count: 1,
      resetTime: now + rule.windowMs,
    };
    rateLimitMap.set(rateLimitKey, record);
  } else {
    record.count += 1;
  }

  const remaining = Math.max(0, rule.maxRequests - record.count);
  const resetSeconds = Math.ceil((record.resetTime - now) / 1000);

  if (record.count > rule.maxRequests) {
    return NextResponse.json(
      {
        success: false,
        error: "Muitas requisições em um curto intervalo de tempo. Por favor, aguarde alguns instantes antes de tentar novamente.",
      },
      {
        status: 429,
        headers: {
          "Retry-After": String(resetSeconds),
          "X-RateLimit-Limit": String(rule.maxRequests),
          "X-RateLimit-Remaining": "0",
          "X-RateLimit-Reset": String(record.resetTime),
        },
      }
    );
  }

  const response = NextResponse.next();
  response.headers.set("X-RateLimit-Limit", String(rule.maxRequests));
  response.headers.set("X-RateLimit-Remaining", String(remaining));
  response.headers.set("X-RateLimit-Reset", String(record.resetTime));

  return response;
}

// Configuração do matcher para executar o middleware exclusivamente nos endpoints sensíveis
export const config = {
  matcher: [
    "/api/auth/login",
    "/api/auth/register",
    "/api/appointments",
  ],
};
