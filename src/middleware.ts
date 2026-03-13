import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const token = req.nextauth.token;
    const pathname = req.nextUrl.pathname;

    // Apenas ADMINs acessam rotas de administração
    if (pathname.startsWith("/admin") && token?.role !== "ADMIN") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    return NextResponse.next();
  },
  {
    callbacks: {
      // Rota autorizada se houver token JWT válido
      authorized: ({ token }) => !!token,
    },
  }
);

// Rotas protegidas pelo middleware
export const config = {
  matcher: [
    "/dashboard/:path*",
    "/clientes/:path*",
    "/projetos/:path*",
    "/tarefas/:path*",
    "/admin/:path*",
  ],
};
