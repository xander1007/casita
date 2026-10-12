import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "./routes/ProtectedRoute";
import { RequirePermission } from "./routes/RequirePermission";
import { AppLayout } from "./components/AppLayout";
import Login from "./pages/Login";
import Dashboard from "./pages/Dashboard";
import AdminLayout from "./pages/admin/AdminLayout";
import UsersPage from "./pages/admin/UsersPage";
import RolesPage from "./pages/admin/RolesPage";
import InventoryLayout from "./pages/inventory/InventoryLayout";
import ProductsPage from "./pages/inventory/ProductsPage";
import CategoriesPage from "./pages/inventory/CategoriesPage";
import BrandsPage from "./pages/inventory/BrandsPage";
import WarehousesPage from "./pages/inventory/WarehousesPage";
import CustomersPage from "./pages/customers/CustomersPage";
import CashLayout from "./pages/cash/CashLayout";
import CashCurrentPage from "./pages/cash/CashCurrentPage";
import CashHistoryPage from "./pages/cash/CashHistoryPage";
import DocumentSeriesPage from "./pages/cash/DocumentSeriesPage";
import PosPage from "./pages/pos/PosPage";
import SalesHistoryPage from "./pages/sales/SalesHistoryPage";
import DespatchesListPage from "./pages/despatches/DespatchesListPage";
import PurchaseListPage from "./pages/purchases/PurchaseListPage";
import PurchaseFormPage from "./pages/purchases/PurchaseFormPage";
import ServicesListPage from "./pages/services/ServicesListPage";
import ReportsPage from "./pages/reports/ReportsPage";
import SunatReportsPage from "./pages/reports/SunatReportsPage";
import NotFoundPage from "./pages/errors/NotFoundPage";

function App() {
  return (
    <Routes>
      <Route path="/login" element={<Login />} />

      <Route element={<ProtectedRoute />}>
        <Route element={<AppLayout />}>
          <Route path="/" element={<Dashboard />} />

          <Route
            path="/admin"
            element={
              <RequirePermission anyOf={["users.view", "roles.view", "permissions.view"]}>
                <AdminLayout />
              </RequirePermission>
            }
          >
            <Route index element={<Navigate to="usuarios" replace />} />
            <Route
              path="usuarios"
              element={
                <RequirePermission anyOf={["users.view"]}>
                  <UsersPage />
                </RequirePermission>
              }
            />
            <Route
              path="roles"
              element={
                <RequirePermission anyOf={["roles.view"]}>
                  <RolesPage />
                </RequirePermission>
              }
            />
          </Route>

          <Route
            path="/inventory"
            element={
              <RequirePermission anyOf={["inventory.view"]}>
                <InventoryLayout />
              </RequirePermission>
            }
          >
            <Route index element={<Navigate to="productos" replace />} />
            <Route path="productos" element={<ProductsPage />} />
            <Route path="categorias" element={<CategoriesPage />} />
            <Route path="marcas" element={<BrandsPage />} />
            <Route path="almacenes" element={<WarehousesPage />} />
          </Route>

          <Route
            path="/customers"
            element={
              <RequirePermission anyOf={["customers.view"]}>
                <CustomersPage />
              </RequirePermission>
            }
          />

          <Route
            path="/cash"
            element={
              <RequirePermission anyOf={["cash.open-close", "cash.view-history", "series.manage"]}>
                <CashLayout />
              </RequirePermission>
            }
          >
            <Route index element={<Navigate to="actual" replace />} />
            <Route
              path="actual"
              element={
                <RequirePermission anyOf={["cash.open-close"]}>
                  <CashCurrentPage />
                </RequirePermission>
              }
            />
            <Route
              path="historial"
              element={
                <RequirePermission anyOf={["cash.view-history"]}>
                  <CashHistoryPage />
                </RequirePermission>
              }
            />
            <Route
              path="series"
              element={
                <RequirePermission anyOf={["series.manage"]}>
                  <DocumentSeriesPage />
                </RequirePermission>
              }
            />
          </Route>

          <Route
            path="/pos"
            element={
              <RequirePermission anyOf={["pos.access"]}>
                <PosPage />
              </RequirePermission>
            }
          />

          <Route
            path="/sales"
            element={
              <RequirePermission anyOf={["sales.view"]}>
                <SalesHistoryPage />
              </RequirePermission>
            }
          />

          <Route
            path="/despatches"
            element={
              <RequirePermission anyOf={["despatches.view"]}>
                <DespatchesListPage />
              </RequirePermission>
            }
          />

          <Route
            path="/purchases"
            element={
              <RequirePermission anyOf={["purchases.view"]}>
                <PurchaseListPage />
              </RequirePermission>
            }
          />

          <Route
            path="/purchases/nueva"
            element={
              <RequirePermission anyOf={["purchases.create"]}>
                <PurchaseFormPage />
              </RequirePermission>
            }
          />

          <Route
            path="/services"
            element={
              <RequirePermission anyOf={["services.view"]}>
                <ServicesListPage />
              </RequirePermission>
            }
          />

          <Route
            path="/reports"
            element={
              <RequirePermission anyOf={["reports.view"]}>
                <ReportsPage />
              </RequirePermission>
            }
          />

          <Route
            path="/reports/sunat"
            element={
              <RequirePermission anyOf={["reports.sunat"]}>
                <SunatReportsPage />
              </RequirePermission>
            }
          />

          <Route path="*" element={<NotFoundPage />} />
        </Route>
      </Route>

      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
