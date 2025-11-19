

// src/pages/Layout.jsx
import React from "react";
import { Outlet, useLocation, Link } from "react-router-dom";
import { DropdownMenuTrigger } from "@components/ui/dropdown-menu";
import { hasPageAccess } from "@components/permissions";
import AccessDeniedPage from "./AccessDeniedPage";

const menu = [
  { name: "Dashboard", path: "/dashboard" },
  { name: "Financeiro", path: "/financial" },
  { name: "Contratos", path: "/contracts" },
  { name: "Funcionários", path: "/employees" },
  { name: "Ofícios", path: "/oficios" },
  { name: "CRM", path: "/crm" },
];

export default function Layout({ user }) {
  const location = useLocation();
  const pageName =
    menu.find((item) => item.path === location.pathname)?.name || "Sistema";

  if (!hasPageAccess(user, location.pathname)) {
    return <AccessDeniedPage />;
  }

  return (
    <div className="flex h-screen bg-gray-100">

      <aside className="w-64 bg-white shadow-sm p-4 flex flex-col">
        <h1 className="text-xl font-semibold mb-6">FACILITE-360 Gestão</h1>

        <nav className="flex flex-col gap-2">
          {menu.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`px-3 py-2 rounded text-sm ${
                location.pathname === item.path
                  ? "bg-blue-600 text-white"
                  : "text-gray-700 hover:bg-gray-200"
              }`}
            >
              {item.name}
            </Link>
          ))}
        </nav>
      </aside>

      <main className="flex-1 p-6 overflow-auto">
        <header className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold">{pageName}</h2>

          <DropdownMenuTrigger>
            <div className="w-10 h-10 rounded-full bg-gray-300 flex items-center justify-center cursor-pointer">
              {user?.name?.[0] || "U"}
            </div>
          </DropdownMenuTrigger>
        </header>

        <Outlet />
      </main>

    </div>
  );
}

