import { Link } from "react-router-dom";

export default function NotFoundPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-5xl font-bold text-indigo-600">404</p>
        <h1 className="mt-3 text-lg font-semibold text-slate-900">Ruta no encontrada</h1>
        <p className="mt-2 text-sm text-slate-500">
          La página que buscas no existe o fue movida a otra sección.
        </p>
        <Link
          to="/"
          className="mt-6 inline-block rounded-md bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700"
        >
          Volver al Panel
        </Link>
      </div>
    </div>
  );
}
