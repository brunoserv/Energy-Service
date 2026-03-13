import Link from "next/link";
import { Zap, ArrowLeft } from "lucide-react";

export default function NotFound() {
  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-4">
      <div className="text-center">
        <div className="flex items-center justify-center gap-2.5 mb-8">
          <div className="w-9 h-9 bg-amber-500 rounded-xl flex items-center justify-center">
            <Zap className="w-4 h-4 text-white" />
          </div>
          <span className="text-white font-bold text-lg">Energy Service</span>
        </div>
        <p className="text-7xl font-bold text-amber-500 mb-2">404</p>
        <h1 className="text-xl font-bold text-white mb-2">Página não encontrada</h1>
        <p className="text-slate-400 mb-8">
          O recurso que você está procurando não existe ou foi removido.
        </p>
        <Link
          href="/dashboard"
          className="inline-flex items-center gap-2 text-sm font-medium text-amber-400 hover:text-amber-300 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          Voltar ao dashboard
        </Link>
      </div>
    </div>
  );
}
