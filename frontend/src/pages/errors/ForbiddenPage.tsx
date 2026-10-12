import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="w-full max-w-md rounded-xl bg-white p-8 text-center shadow-sm">
        <p className="text-5xl font-bold text-red-600">403</p>
        <h1 className="mt-3 text-lg font-semibold text-slate-900">Acceso no autorizado</h1>
        <p className="mt-2 text-sm text-slate-500">
          No tienes permisos para ver esta sección. Si crees que es un error, contacta a un administrador.
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
