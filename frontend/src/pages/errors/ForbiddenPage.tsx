import { Link } from "react-router-dom";

export default function ForbiddenPage() {
  return (
    <div className="flex min-h-[60vh] items-center justify-center">
      <div className="card w-full max-w-md p-8 text-center">
        <p className="text-5xl font-bold text-red-600">403</p>
        <h1 className="mt-3 text-lg font-semibold text-slate-900">Acceso no autorizado</h1>
        <p className="mt-2 text-sm text-slate-500">
          No tienes permisos para ver esta sección. Si crees que es un error, contacta a un administrador.
        </p>
        <Link
          to="/"
          className="btn btn-primary mt-6"
        >
          Volver al Panel
        </Link>
      </div>
    </div>
  );
}
