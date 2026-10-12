<?php

use App\Http\Controllers\Api\Admin\PermissionController;
use App\Http\Controllers\Api\Admin\RoleController;
use App\Http\Controllers\Api\Admin\UserController;
use App\Http\Controllers\Api\AuthController;
use App\Http\Controllers\Api\Cash\CashRegisterController;
use App\Http\Controllers\Api\Cash\CashShiftController;
use App\Http\Controllers\Api\Cash\DocumentSeriesController;
use App\Http\Controllers\Api\ContactController;
use App\Http\Controllers\Api\Despatches\DespatchController;
use App\Http\Controllers\Api\Inventory\BrandController;
use App\Http\Controllers\Api\Inventory\CategoryController;
use App\Http\Controllers\Api\Inventory\ProductController;
use App\Http\Controllers\Api\Inventory\WarehouseController;
use App\Http\Controllers\Api\Pos\POSController;
use App\Http\Controllers\Api\Purchases\PurchaseController;
use App\Http\Controllers\Api\Reports\ReportController;
use App\Http\Controllers\Api\Reports\SunatReportController;
use App\Http\Controllers\Api\Sales\SaleController;
use App\Http\Controllers\Api\Services\TechnicalServiceController;
use App\Http\Controllers\Api\SettingsController;
use Illuminate\Support\Facades\Route;

Route::middleware(['auth:sanctum', 'active'])->get('/settings/company', [SettingsController::class, 'company']);

Route::prefix('auth')->group(function () {
    Route::post('/register', [AuthController::class, 'register']);
    Route::post('/login', [AuthController::class, 'login']);

    Route::middleware(['auth:sanctum', 'active'])->group(function () {
        Route::post('/logout', [AuthController::class, 'logout']);
        Route::get('/me', [AuthController::class, 'me']);
    });
});

Route::middleware(['auth:sanctum', 'active'])->prefix('admin')->group(function () {
    Route::middleware('permission:users.view')->group(function () {
        Route::get('/users', [UserController::class, 'index']);
        Route::get('/users/{user}', [UserController::class, 'show']);
    });
    Route::middleware('permission:users.create')->post('/users', [UserController::class, 'store']);
    Route::middleware('permission:users.update')->put('/users/{user}', [UserController::class, 'update']);
    Route::middleware('permission:users.manage-status')->patch('/users/{user}/status', [UserController::class, 'updateStatus']);
    Route::middleware('permission:users.manage-roles')->put('/users/{user}/roles', [UserController::class, 'syncRoles']);
    Route::middleware('permission:users.delete')->delete('/users/{user}', [UserController::class, 'destroy']);

    Route::middleware('permission:roles.view')->group(function () {
        Route::get('/roles', [RoleController::class, 'index']);
        Route::get('/roles/{role}', [RoleController::class, 'show']);
    });
    Route::middleware('permission:roles.create')->post('/roles', [RoleController::class, 'store']);
    Route::middleware('permission:roles.update')->put('/roles/{role}', [RoleController::class, 'update']);
    Route::middleware('permission:permissions.assign')->put('/roles/{role}/permissions', [RoleController::class, 'syncPermissions']);
    Route::middleware('permission:roles.delete')->delete('/roles/{role}', [RoleController::class, 'destroy']);

    Route::middleware('permission:permissions.view')->get('/permissions', [PermissionController::class, 'index']);
});

Route::middleware(['auth:sanctum', 'active'])->prefix('inventory')->group(function () {
    Route::middleware('permission:inventory.view')->group(function () {
        Route::get('/categories', [CategoryController::class, 'index']);
        Route::get('/brands', [BrandController::class, 'index']);
        Route::get('/warehouses', [WarehouseController::class, 'index']);
        Route::get('/products', [ProductController::class, 'index']);
        Route::get('/products/{product}', [ProductController::class, 'show']);
        Route::get('/products/{product}/serials', [ProductController::class, 'listSerials']);
        Route::get('/products/{product}/stock-history', [ProductController::class, 'stockHistory']);
    });

    Route::middleware('permission:inventory.manage')->group(function () {
        Route::post('/categories', [CategoryController::class, 'store']);
        Route::put('/categories/{category}', [CategoryController::class, 'update']);
        Route::delete('/categories/{category}', [CategoryController::class, 'destroy']);

        Route::post('/brands', [BrandController::class, 'store']);
        Route::put('/brands/{brand}', [BrandController::class, 'update']);
        Route::delete('/brands/{brand}', [BrandController::class, 'destroy']);

        Route::post('/warehouses', [WarehouseController::class, 'store']);
        Route::put('/warehouses/{warehouse}', [WarehouseController::class, 'update']);
        Route::delete('/warehouses/{warehouse}', [WarehouseController::class, 'destroy']);

        Route::post('/products', [ProductController::class, 'store']);
        Route::put('/products/{product}', [ProductController::class, 'update']);
        Route::delete('/products/{product}', [ProductController::class, 'destroy']);
    });

    Route::middleware('permission:inventory.manage-stock')->group(function () {
        Route::post('/products/{product}/stock-movements', [ProductController::class, 'adjustStock']);
        Route::post('/products/{product}/serials', [ProductController::class, 'storeSerials']);
        Route::delete('/products/{product}/serials/{serial}', [ProductController::class, 'destroySerial']);
    });
});

Route::middleware(['auth:sanctum', 'active'])->prefix('contacts')->group(function () {
    Route::middleware('permission:customers.view')->group(function () {
        Route::get('/', [ContactController::class, 'index']);
        Route::get('/{contact}', [ContactController::class, 'show']);
    });

    Route::middleware('permission:customers.manage')->group(function () {
        Route::post('/', [ContactController::class, 'store']);
        Route::put('/{contact}', [ContactController::class, 'update']);
        Route::patch('/{contact}/status', [ContactController::class, 'updateStatus']);
        Route::delete('/{contact}', [ContactController::class, 'destroy']);
    });
});

Route::middleware(['auth:sanctum', 'active'])->group(function () {
    Route::middleware('permission:cash.open-close')->group(function () {
        Route::get('/cash-registers', [CashRegisterController::class, 'index']);
        Route::get('/shifts/current', [CashShiftController::class, 'current']);
        Route::post('/shifts/open', [CashShiftController::class, 'open']);
        Route::post('/shifts/{shift}/close', [CashShiftController::class, 'close']);
    });

    Route::middleware('permission:cash.view-history')->group(function () {
        Route::get('/shifts', [CashShiftController::class, 'index']);
        Route::get('/shifts/{shift}', [CashShiftController::class, 'show']);
    });

    Route::middleware('permission:series.manage')->group(function () {
        Route::get('/document-series', [DocumentSeriesController::class, 'index']);
        Route::post('/document-series', [DocumentSeriesController::class, 'store']);
        Route::put('/document-series/{series}', [DocumentSeriesController::class, 'update']);
        Route::delete('/document-series/{series}', [DocumentSeriesController::class, 'destroy']);
    });
});

Route::middleware(['auth:sanctum', 'active', 'permission:pos.access'])->prefix('pos')->group(function () {
    Route::get('/categories', [CategoryController::class, 'index']);
    Route::get('/products', [ProductController::class, 'index']);
    Route::get('/products/{product}/serials', [ProductController::class, 'listSerials']);
    Route::get('/contacts', [ContactController::class, 'index']);
    Route::post('/contacts', [ContactController::class, 'store']);
    Route::post('/sales', [POSController::class, 'store']);
    Route::get('/sales/{sale}/print', [POSController::class, 'print']);
});

Route::middleware(['auth:sanctum', 'active'])->prefix('sales')->group(function () {
    Route::middleware('permission:sales.view')->group(function () {
        Route::get('/', [SaleController::class, 'index']);
        Route::get('/{sale}', [SaleController::class, 'show']);
        Route::get('/{sale}/print', [POSController::class, 'print']);
    });

    Route::middleware('permission:sales.annul')->post('/{sale}/annul', [SaleController::class, 'annul']);
});

Route::middleware(['auth:sanctum', 'active'])->prefix('despatches')->group(function () {
    Route::middleware('permission:despatches.view')->group(function () {
        Route::get('/', [DespatchController::class, 'index']);
        Route::get('/{despatch}', [DespatchController::class, 'show']);
        Route::get('/{despatch}/print', [DespatchController::class, 'print']);
    });

    Route::middleware('permission:despatches.create')->post('/', [DespatchController::class, 'store']);
});

Route::middleware(['auth:sanctum', 'active'])->prefix('purchases')->group(function () {
    Route::middleware('permission:purchases.create')->group(function () {
        Route::get('/lookups/warehouses', [PurchaseController::class, 'warehouses']);
        Route::get('/lookups/suppliers', [PurchaseController::class, 'suppliers']);
        Route::post('/lookups/suppliers', [ContactController::class, 'store']);
        Route::get('/lookups/products', [PurchaseController::class, 'products']);
        Route::post('/', [PurchaseController::class, 'store']);
    });

    Route::middleware('permission:purchases.view')->group(function () {
        Route::get('/', [PurchaseController::class, 'index']);
        Route::get('/{purchase}', [PurchaseController::class, 'show']);
    });

    Route::middleware('permission:purchases.annul')->post('/{purchase}/annul', [PurchaseController::class, 'annul']);
});

Route::middleware(['auth:sanctum', 'active'])->prefix('reports')->group(function () {
    Route::middleware('permission:reports.view')->group(function () {
        Route::get('/summary', [ReportController::class, 'summary']);
        Route::get('/pos-metrics', [ReportController::class, 'posMetrics']);
        Route::get('/daily-sales', [ReportController::class, 'dailySales']);
        Route::get('/critical-inventory', [ReportController::class, 'criticalInventory']);
        Route::get('/sales-registry', [ReportController::class, 'salesRegistry']);
        Route::get('/kardex', [ReportController::class, 'kardex']);
    });

    Route::middleware('permission:reports.export')->group(function () {
        Route::get('/sales-registry/export', [ReportController::class, 'exportSalesRegistry']);
        Route::get('/kardex/export', [ReportController::class, 'exportKardex']);
    });

    Route::middleware('permission:reports.sunat')->prefix('sunat')->group(function () {
        Route::get('/ventas', [SunatReportController::class, 'ventasPreview']);
        Route::get('/ventas/export-txt', [SunatReportController::class, 'exportVentasTxt']);
        Route::get('/ventas/export-csv', [SunatReportController::class, 'exportVentasCsv']);

        Route::get('/compras', [SunatReportController::class, 'comprasPreview']);
        Route::get('/compras/export-txt', [SunatReportController::class, 'exportComprasTxt']);
        Route::get('/compras/export-csv', [SunatReportController::class, 'exportComprasCsv']);

        Route::get('/kardex13', [SunatReportController::class, 'kardex13Preview']);
        Route::get('/kardex13/export-txt', [SunatReportController::class, 'exportKardex13Txt']);
        Route::get('/kardex13/export-csv', [SunatReportController::class, 'exportKardex13Csv']);

        Route::get('/inventario12', [SunatReportController::class, 'inventory12Preview']);
        Route::get('/inventario12/export-txt', [SunatReportController::class, 'exportInventory12Txt']);
        Route::get('/inventario12/export-csv', [SunatReportController::class, 'exportInventory12Csv']);
    });
});

Route::middleware(['auth:sanctum', 'active'])->prefix('services')->group(function () {
    Route::middleware('permission:services.view')->group(function () {
        Route::get('/', [TechnicalServiceController::class, 'index']);
        Route::get('/technicians', [TechnicalServiceController::class, 'technicians']);
    });

    Route::middleware('permission:services.create')->group(function () {
        Route::post('/', [TechnicalServiceController::class, 'store']);
        Route::get('/customers', [TechnicalServiceController::class, 'searchCustomers']);
    });

    Route::middleware('permission:services.manage')->get('/parts', [TechnicalServiceController::class, 'parts']);

    Route::middleware('permission:services.view')->group(function () {
        Route::get('/{service}', [TechnicalServiceController::class, 'show']);
        Route::get('/{service}/receipt', [TechnicalServiceController::class, 'receipt']);
    });

    Route::middleware('permission:services.manage')->group(function () {
        Route::put('/{service}', [TechnicalServiceController::class, 'update']);
        Route::post('/{service}/items', [TechnicalServiceController::class, 'addItem']);
        Route::delete('/{service}/items/{item}', [TechnicalServiceController::class, 'removeItem']);
    });

    Route::middleware('permission:services.deliver')->group(function () {
        Route::get('/{service}/charge', [TechnicalServiceController::class, 'chargePayload']);
        Route::post('/{service}/deliver', [TechnicalServiceController::class, 'deliver']);
    });
});
