# Manual de Usuario — SistemaCasita

**Sistema de gestión comercial para La Casita de la Computadora S.R.LTDA.**
Punto de venta, cotizaciones, pedidos de venta, guías de remisión, servicio técnico, caja, compras, inventario, órdenes de compra del Estado y cancelación de comprobantes.

> Este manual está dirigido al usuario final. No contiene detalles técnicos de programación: cada sección explica **qué hace cada pantalla y cómo usarla, paso a paso**.

---

## Índice

1. [Introducción e Inicio de Sesión](#1-introducción-e-inicio-de-sesión)
2. [Módulo de Ventas y Emisión de Comprobantes](#2-módulo-de-ventas-y-emisión-de-comprobantes)
3. [Módulo de Guías de Remisión](#3-módulo-de-guías-de-remisión)
4. [Módulo de Servicio Técnico](#4-módulo-de-servicio-técnico)
5. [Gestión de Caja y Cierre Diario](#5-gestión-de-caja-y-cierre-diario)
6. [Administración, Permisos y Roles de Usuario](#6-administración-permisos-y-roles-de-usuario)
7. [Módulos complementarios](#7-módulos-complementarios)
   - 7.1 [Inventario (Productos, Categorías, Marcas, Almacenes)](#71-inventario-productos-categorías-marcas-almacenes)
   - 7.2 [Clientes y Proveedores](#72-clientes-y-proveedores)
   - 7.3 [Compras](#73-compras)
   - 7.4 [Reportes y Reportes SUNAT](#74-reportes-y-reportes-sunat)
   - 7.5 [Búsqueda de productos (distingue mayúsculas y minúsculas)](#75-búsqueda-de-productos-distingue-mayúsculas-y-minúsculas)
8. [Módulo de Cotizaciones (Proformas)](#8-módulo-de-cotizaciones-proformas)
9. [Pedidos de Venta, Pedidos a Demanda y Stock Reservado](#9-pedidos-de-venta-pedidos-a-demanda-y-stock-reservado)
10. [Órdenes de Compra del Estado](#10-órdenes-de-compra-del-estado)
11. [Cancelación de Comprobantes](#11-cancelación-de-comprobantes)
12. [Preguntas frecuentes y solución de problemas](#12-preguntas-frecuentes-y-solución-de-problemas)

---

## 1. Introducción e Inicio de Sesión

### 1.1 ¿Qué es SistemaCasita?

SistemaCasita es el sistema interno de **La Casita de la Computadora S.R.LTDA.** para:

- Vender productos y servicios y emitir Boletas, Facturas y Notas de Venta.
- Elaborar cotizaciones (proformas) y convertirlas en pedidos o ventas sin volver a digitar los ítems.
- Registrar pedidos de venta que reservan stock para el cliente y gestionar la compra de lo que se vende "a demanda".
- Hacer seguimiento de las órdenes de compra de entidades del Estado frente al stock disponible.
- Registrar la cancelación (pago) de facturas, notas de crédito y letras con su operación bancaria.
- Emitir Guías de Remisión para el traslado de mercadería.
- Registrar la recepción, diagnóstico y entrega de equipos en el taller de Servicio Técnico.
- Controlar la apertura y cierre de caja de cada turno.
- Administrar inventario, compras a proveedores, clientes y reportes de ventas (incluyendo los formatos oficiales para SUNAT).

### 1.2 Roles del sistema

El acceso a cada módulo depende del **rol** asignado al usuario. Los roles base son:

| Rol | Para quién es | Acceso típico |
|---|---|---|
| **Super Admin** | Dueño / soporte técnico del sistema | Acceso total, sin restricciones |
| **Administrador** | Gerencia / administración | Todo excepto la gestión fina de roles y permisos |
| **Vendedor / Cajero** | Personal de ventas / caja | Punto de Venta, Caja, Clientes, Guías de Remisión, consulta de inventario |
| **Técnico** | Personal del taller | Servicio Técnico, consulta de inventario y clientes |
| **Usuario** | Cuenta recién registrada, sin permisos | Ninguno hasta que un administrador le asigne un rol |

> Si al ingresar no ves un módulo esperado (por ejemplo, "Reportes" o "Administración"), es porque tu rol no tiene el permiso correspondiente. Solicita a un Administrador que revise tus permisos (ver [sección 6](#6-administración-permisos-y-roles-de-usuario)).

### 1.3 Cómo iniciar sesión

1. Abre SistemaCasita en el navegador.
2. En la pantalla **"Iniciar sesión"**, ingresa tu **correo electrónico** y **contraseña**.
3. Presiona **"Ingresar"**.
4. Si los datos son correctos, entrarás al **Panel principal**. Si el sistema detecta demasiados intentos fallidos seguidos, te pedirá esperar unos minutos antes de volver a intentar (protección de seguridad).
5. Si tu cuenta fue deshabilitada por un administrador, verás el mensaje *"Esta cuenta ha sido deshabilitada"*: contacta a un Administrador.

Para salir del sistema, haz clic en tu nombre (esquina superior derecha) y selecciona **"Cerrar sesión"**.

### 1.4 El Panel principal (Dashboard)

Al ingresar verás:

- Tu nombre, correo y el/los rol(es) asignados.
- Accesos rápidos: **+ Nueva Venta (POS)**, **+ Recepción de Equipo**, **+ Nuevo Producto**, **Ver Reportes** (solo aparecen los que tu rol puede usar).
- Si tienes permiso de Reportes: indicadores del día y del mes (ventas de hoy, ventas del mes, ganancia neta, servicios en proceso, alertas de stock), el gráfico de ventas diarias del mes y el desglose por método de pago.
- La barra superior muestra si tienes **Caja Abierta** o **Caja Cerrada**, y el menú de navegación con los módulos habilitados para tu rol: Panel, Punto de Venta, Ventas, Cotizaciones, Pedidos, Servicio Técnico, Guías de Remisión, Compras, OC del Estado, Cancelaciones, Inventario, Clientes y Proveedores, Caja, Reportes, Administración.

---

## 2. Módulo de Ventas y Emisión de Comprobantes

Este módulo cubre el **Punto de Venta (POS)** —donde se registran las ventas— y el **Historial de Ventas** —donde se consultan y anulan comprobantes ya emitidos.

> ⚠️ **Requisito previo:** para vender necesitas tener una **caja abierta** (ver [sección 5](#5-gestión-de-caja-y-cierre-diario)). Si no la tienes abierta, el sistema te llevará automáticamente a la pantalla de apertura de caja.

### 2.1 Registrar una venta (Punto de Venta)

Ve a **Punto de Venta** en el menú superior (o el botón **"+ Nueva Venta POS"**).

1. **Buscar y agregar productos**: usa el buscador ("Buscar por nombre, código de barras o serie...") y/o el filtro de categoría. Haz clic sobre la tarjeta del producto para agregarlo al carrito.
   - Si el producto **requiere número de serie** (por ejemplo, equipos con garantía), el sistema te pedirá elegir la serie disponible antes de agregarlo.
   - Los productos sin stock aparecen deshabilitados y no se pueden seleccionar.
   - El stock que se muestra es el **disponible**: no incluye las unidades reservadas para pedidos de otros clientes (ver [sección 9](#9-pedidos-de-venta-pedidos-a-demanda-y-stock-reservado)).
   - La búsqueda distingue mayúsculas y minúsculas (ver [sección 7.5](#75-búsqueda-de-productos-distingue-mayúsculas-y-minúsculas)).
2. **Editar el carrito**: en el panel derecho ("Carrito de Compra") puedes ajustar la cantidad de cada línea o quitarla con la **✕**. El sistema calcula Subtotal, IGV (18%) y Total automáticamente.
3. Presiona **"Cobrar"**.
4. En la ventana **"Cobrar venta"**:
   - **Cliente**: busca un cliente existente por nombre o documento, o usa **"+ Nuevo"** para registrar uno rápido sin salir de la venta. Si no seleccionas ninguno, la venta queda a nombre de **"Clientes Varios"**.
   - **Comprobante**: elige **Boleta**, **Factura** o **Nota de Venta**.
     - Para emitir **Factura**, el cliente seleccionado debe tener **RUC** (documento tipo 6); si no lo tiene, el sistema te avisará y no permitirá continuar hasta corregirlo.
   - **Métodos de pago**: por defecto se carga el efectivo por el total de la venta. Puedes cambiar el método (Efectivo, Yape/Plin, Tarjeta, Transferencia) y usar **"+ Agregar pago"** para dividir el pago entre varios métodos (pago mixto). Los métodos distintos de efectivo piden un **N° de operación** de referencia.
   - El sistema muestra el **Total a pagar**, lo **Pagado** y el **Vuelto** calculado en tiempo real.
5. Presiona **"Confirmar venta"**. Si el monto pagado es menor al total, el sistema no dejará continuar.
6. Al confirmarse, el stock del almacén asociado a tu caja se descuenta automáticamente y se genera el correlativo del comprobante (serie y número).

### 2.2 Imprimir el comprobante

Al completar la venta se abre la ventana **"Venta registrada"** con el número de comprobante y el monto:

1. Elige el formato: **"Ticket 80mm"** (impresora térmica) o **"Formato A4"** (hoja completa).
2. Revisa la vista previa: incluye el membrete completo de la empresa (RUC, razón social, dirección, teléfonos, correos, eslogan), los datos del cliente, el detalle de ítems, el total en letras ("SON: ..."), el desglose de impuestos (Op. Gravada / Exonerada / Inafecta, IGV 18%, Importe Total) y la nota legal *"NO SE ACEPTAN CAMBIOS NI DEVOLUCIONES"*.
3. Presiona **"Imprimir"** para enviar a la impresora, o **"Nueva venta"** para continuar vendiendo.

### 2.3 Consultar el Historial de Ventas

Ve a **Ventas** en el menú superior:

1. Filtra por texto (correlativo o cliente), tipo de comprobante, estado (Completado / Anulado) y rango de fechas.
2. Haz clic en **"Ver detalle"** para abrir el comprobante: cliente, ítems, IGV, total y pagos registrados.
3. Si tu rol tiene permiso de anulación, verás el botón **"Anular comprobante"**: debes escribir un **motivo** obligatorio y confirmar. Al anular, el sistema:
   - Marca el comprobante como **Anulado** (se conserva en el historial, no se borra).
   - Repone automáticamente el stock y libera las series vendidas.
   - Revierte el monto de la venta de los totales de la caja, si el turno sigue abierto.

### 2.4 Cobrar una orden de Servicio Técnico desde el POS

Cuando una orden de servicio técnico está **Reparada**, se puede enviar a cobrar directamente desde el módulo de Servicio Técnico (botón **"Enviar a cobro (POS)"**). Esto abre el Punto de Venta con una línea de "Servicio Técnico" ya cargada con el monto acordado; al completarse el cobro, la orden se marca automáticamente como **Entregada** (ver [sección 4](#4-módulo-de-servicio-técnico)).

### 2.5 Facturar una cotización o un pedido desde el POS

El POS también puede abrirse con los ítems ya cargados desde una **cotización aprobada** (botón **"Facturar en POS"**, [sección 8.4.1](#841-convertir-la-cotización-en-pedido-o-en-venta)) o desde un **pedido "Listo para facturar"** (botón **"Facturar en POS"**, [sección 9.5](#95-facturar-el-pedido)). En ambos casos verás el aviso *"Facturando la cotización / el pedido …"* sobre el carrito y el cliente ya seleccionado. El cobro, la elección de comprobante y la impresión son iguales a una venta normal.

- **Desde una cotización**: las líneas siguen siendo editables (puedes ajustar cantidades o quitar productos) y se valida el stock disponible del almacén de tu caja. Al confirmar, la cotización queda como **Convertida** y enlazada a la venta.
- **Desde un pedido**: las líneas quedan **fijas** (no se pueden cambiar productos ni cantidades) porque ese stock ya estaba reservado para el cliente, y el cliente no se puede cambiar. Debes facturarlo desde una caja cuyo almacén sea el mismo del pedido. Al confirmar, el pedido pasa a **Facturado**.

---

## 3. Módulo de Guías de Remisión

Sirve para emitir la **Guía de Remisión Electrónica Remitente** que sustenta el traslado de mercadería (por ejemplo, la entrega de una venta al domicilio del cliente).

Ve a **Guías de Remisión** en el menú superior.

### 3.1 Consultar guías emitidas

La tabla lista cada guía con su número (serie **T001** + correlativo), destinatario, motivo, fecha de traslado y estado (**Emitida** / **Anulada**). Usa el buscador para filtrar por número o destinatario, y **"Ver / Imprimir"** para abrir cualquiera de ellas nuevamente.

### 3.2 Emitir una nueva guía

Presiona **"+ Nueva Guía"** y completa:

1. **Destinatario**: busca el cliente/empresa que recibe la mercadería (por nombre, RUC o DNI). Al seleccionarlo, la **dirección de llegada** se autocompleta con su dirección registrada (editable).
2. **Comprobante referenciado** *(opcional)*: si la guía corresponde a una venta ya emitida, búscala por serie/número para vincularla.
3. **Dirección de partida / llegada**: la de partida viene precargada con la dirección del local; ajusta ambas si corresponde.
4. **Motivo de traslado**: Venta, Traslado entre establecimientos de la misma empresa, Traslado por emisor itinerante, u Otros.
5. **Peso Bruto (KGM)** y **N° de bultos**.
6. **Fechas**: de inicio de traslado (obligatoria) y de entrega (opcional).
7. **Vehículo y conductor**: placa, marca del vehículo, DNI y N° de licencia del conductor.
8. **Ítems a trasladar**: agrega una o más filas con código, descripción, cantidad, unidad y peso. Usa **"+ Agregar ítem"** para más líneas y **"Quitar"** para eliminarlas.
9. **Observaciones** y **N° de Orden de compra** son opcionales.
10. Presiona **"Emitir guía"**. El sistema asigna el correlativo automáticamente y abre de inmediato la vista de impresión.

### 3.3 Imprimir la guía

La guía se imprime en **formato A4**, replicando el formato oficial: cabecera de la empresa con RUC y título "GUÍA DE REMISIÓN ELECTRÓNICA REMITENTE", datos del destinatario y del comprobante referenciado, direcciones de partida/llegada, fechas, tabla de ítems, observaciones, y los datos del vehículo/conductor. Usa el botón **"Imprimir"** dentro de la ventana de vista previa.

---

## 4. Módulo de Servicio Técnico

Gestiona el ciclo completo de un equipo que ingresa al taller: **recepción → diagnóstico → reparación → cobro → entrega**.

Ve a **Servicio Técnico** en el menú superior. Puedes alternar entre vista **Kanban** (columnas por estado) y vista **Tabla**.

### 4.1 Registrar la recepción de un equipo

Presiona **"+ Nueva recepción"**:

1. **Cliente**: búscalo por nombre o DNI/RUC, o presiona **"+ Nuevo"** para registrar uno nuevo (documento, nombre, teléfono) sin salir del formulario.
2. **Técnico asignado** *(opcional)*: puedes dejarlo "Sin asignar" y definirlo después.
3. **Tipo de equipo**: Laptop, PC Escritorio, Impresora, Monitor u Otro.
4. **Marca**, **Modelo**, **N° de serie**.
5. **Clave** *(opcional)*: contraseña del equipo o del usuario, útil para que el técnico pueda encender/probar el equipo.
6. **Accesorios dejados** (ej.: cargador, funda, mouse).
7. **Falla reportada por el cliente** (obligatorio): describe el motivo del ingreso tal como lo indica el cliente.
8. **Costo estimado** *(opcional)*.
9. Presiona **"Registrar recepción"**. El sistema genera un código correlativo de orden (formato **ST-00001**) y abre el detalle de la orden recién creada.

Desde el detalle puedes presionar **"Ver comprobante"** para imprimir el **ticket de recepción (80mm)**, con el membrete de la empresa, N° de Registro, fecha, datos del cliente, descripción del equipo, serie, clave, accesorios y falla — el comprobante que se entrega al cliente como constancia.

### 4.2 Seguimiento y diagnóstico

Abre la orden (desde el Kanban o la Tabla, botón **"Ver detalle"**). Un usuario con permiso de gestión puede:

- Asignar/cambiar el **técnico responsable**.
- Registrar el **Diagnóstico / informe técnico**.
- Ajustar el **Costo estimado** y el **Costo final** (mano de obra + repuestos).
- Agregar **repuestos utilizados**: busca el producto en el almacén de "Servicio Técnico", indica la cantidad y presiona **"Agregar"** — esto descuenta el stock automáticamente. Se puede **"Quitar"** un repuesto ya agregado (repone el stock).
- Avanzar el estado de la orden con los botones de acción:
  - **"Iniciar diagnóstico"** (Recibido → En Diagnóstico).
  - **"Marcar como reparado"** (En Diagnóstico → Reparado). Exige haber completado el diagnóstico y el costo final antes de continuar.
  - **"Cancelar orden"**, disponible en cualquier momento (con confirmación).

> Una orden **Entregada** o **Cancelada** queda bloqueada: ya no se pueden editar sus datos, diagnóstico ni repuestos.

### 4.3 Cobro y entrega

Cuando la orden está **Reparada**, aparece el botón **"Enviar a cobro (POS)"** (solo para roles con permiso de entrega). Esto abre el Punto de Venta con el monto acordado precargado como un ítem de "Servicio Técnico" y el cliente ya seleccionado. Al confirmar esa venta:

1. Se emite el comprobante de venta correspondiente (Boleta/Factura/Nota de Venta).
2. La orden de servicio se marca automáticamente como **Entregada**, quedando enlazada al comprobante generado.
3. Desde el detalle de la orden entregada se puede reimprimir el **comprobante de entrega**, que añade el diagnóstico, los repuestos utilizados y el total cobrado.

---

## 5. Gestión de Caja y Cierre Diario

Controla el efectivo y los comprobantes SUNAT de cada punto de cobro (caja física). Ve a **Caja** en el menú superior; tiene tres pestañas: **Caja Actual**, **Historial** y **Series SUNAT**.

### 5.1 Apertura de caja

En **Caja Actual**, si no tienes un turno abierto verás el formulario **"Apertura de Caja"**:

1. Selecciona la **Caja** (por ejemplo, "Caja Principal 01").
2. Ingresa el **Monto inicial (S/)** en efectivo con el que arrancas el turno.
3. Presiona **"Abrir caja"**.

> Solo puede haber **un turno abierto por caja** y **un turno abierto por usuario** a la vez — el sistema lo valida automáticamente. Además, la caja debe tener un **almacén asignado** (lo configura un administrador) para poder vender desde el POS.

### 5.2 Durante el turno

Con la caja abierta, la pantalla muestra en tiempo real:

- Monto de apertura.
- Ventas en efectivo, con tarjeta, por transferencia y Yape/Plin (se acumulan automáticamente con cada venta cobrada).
- **Efectivo esperado en caja** = monto de apertura + ventas en efectivo.

Desde aquí puedes ir directo a **"Ir al Punto de Venta"**, o iniciar el **cierre**.

### 5.3 Cierre de caja (arqueo)

Presiona **"Cerrar caja / Arqueo"**:

1. Cuenta el efectivo físico y regístralo en **"Monto real contado (S/)"**.
2. El sistema calcula al instante la **diferencia** frente al efectivo esperado, e indica si hay **sobrante**, **faltante** o **cuadre exacto**.
3. Agrega **Observaciones** si es necesario (por ejemplo, para explicar un faltante).
4. Presiona **"Confirmar cierre"**. El turno pasa a estado **Cerrada** y queda registrado en el **Historial** con su monto inicial, monto real, diferencia y horarios de apertura/cierre — no se puede volver a modificar.

### 5.4 Historial de turnos

La pestaña **Historial** lista todos los turnos (propios y de otros usuarios, según permisos): caja, usuario, apertura, cierre, montos y diferencia, con paginación.

### 5.5 Series de comprobantes SUNAT

La pestaña **Series SUNAT** (solo para roles con permiso de gestión de series) administra las series y correlativos de cada tipo de comprobante (Boleta, Factura, Nota de Venta) por caja:

- **"+ Nueva serie"**: define tipo de documento, código de serie (ej. `B001`), la caja a la que se asigna y su estado (Activo/Inactivo).
- **"Editar"**: permite además corregir manualmente el correlativo actual si fuera necesario.
- **"Eliminar"**: quita la serie (con confirmación).

> Cada caja necesita una serie **activa** por cada tipo de comprobante que va a emitir; si falta, el POS no podrá generar ese comprobante desde esa caja.

---

## 6. Administración, Permisos y Roles de Usuario

Disponible en **Administración** (menú superior), con las pestañas **Usuarios** y **Roles y Permisos**. Solo accesible para roles con los permisos correspondientes (típicamente Administrador y Super Admin).

### 6.1 Gestión de usuarios

En la pestaña **Usuarios**:

- Filtra por nombre/correo, rol o estado (Activo/Inactivo).
- **"+ Nuevo usuario"**: nombre, correo, contraseña (con confirmación) y los roles a asignar.
- **"Editar"**: cambia nombre, correo, contraseña (déjala en blanco para no modificarla) y sus roles.
- **"Deshabilitar" / "Habilitar"**: bloquea o restaura el acceso de la cuenta sin eliminarla. No puedes deshabilitar tu propia cuenta.
- **"Eliminar"**: borra la cuenta de forma permanente (con confirmación). No puedes eliminar tu propia cuenta.

### 6.2 Roles y permisos

En la pestaña **Roles y Permisos**:

1. Selecciona un rol de la lista de la izquierda (se muestra cuántos usuarios tiene asignados).
2. A la derecha se listan todos los **permisos disponibles**, agrupados por módulo (usuarios, roles, inventario, clientes, caja, series, pos, ventas, despatches, compras, servicios, reportes, quotations (cotizaciones), sales-orders (pedidos), government-orders (OC del Estado), settlements (cancelaciones), etc.). Marca o desmarca las casillas según lo que ese rol debe poder hacer.
3. Presiona **"Guardar cambios"**.
4. Con el permiso adecuado puedes también **crear un nuevo rol** (nombre + "+") o **eliminar** uno personalizado.

> Los roles **"Super Admin"** y **"Usuario"** son roles base del sistema: su nombre no se puede editar ni eliminar. Además, "Super Admin" siempre tiene acceso completo, independientemente de las casillas marcadas.

### 6.3 Matriz de referencia de permisos por rol (configuración de fábrica)

| Módulo | Super Admin | Administrador | Vendedor / Cajero | Técnico |
|---|:---:|:---:|:---:|:---:|
| Punto de Venta | ✅ | ✅ | ✅ | — |
| Ventas (consulta / anular) | ✅ | ✅ | Consulta | — |
| Cotizaciones | ✅ | ✅ | ✅ | — |
| Pedidos de Venta / Compras a demanda | ✅ | ✅ | ✅ | — |
| Guías de Remisión | ✅ | ✅ | ✅ | — |
| Caja (abrir/cerrar/historial) | ✅ | ✅ | ✅ | — |
| Series SUNAT | ✅ | — | — | — |
| Servicio Técnico | ✅ | ✅ | — | ✅ |
| Compras | ✅ | ✅ | — | — |
| OC del Estado | ✅ | ✅ | — | — |
| Cancelación de Comprobantes | ✅ | ✅ | — | — |
| Inventario (ver) | ✅ | ✅ | ✅ | ✅ |
| Inventario (gestionar) | ✅ | ✅ | — | — |
| Clientes y Proveedores | ✅ | ✅ | ✅ | Consulta |
| Reportes / SUNAT | ✅ | ✅ | — | — |
| Administración (usuarios/roles) | ✅ | Parcial* | — | — |

\* Un Administrador puede crear/editar usuarios y asignarles roles, pero no puede crear roles nuevos ni modificar qué permisos tiene cada rol — eso está reservado a Super Admin.

> Para que el Vendedor/Cajero pueda usar **"Comprar faltantes"** o **"Generar compra"** desde un pedido, su rol necesita además el permiso de Compras (`purchases.create`), que no trae de fábrica. Sin él puede ver la pestaña "Compras a demanda", pero la compra la registra un Administrador.

---

## 7. Módulos complementarios

Estos módulos alimentan de datos a los procesos anteriores (ventas, guías y servicio técnico).

### 7.1 Inventario (Productos, Categorías, Marcas, Almacenes)

Menú **Inventario**, con pestañas internas para cada catálogo.

**Productos:**
- Lista con búsqueda (nombre, código, código de barras, serie — distingue mayúsculas y minúsculas, ver [7.5](#75-búsqueda-de-productos-distingue-mayúsculas-y-minúsculas)), filtro por categoría/marca, precio de venta y stock (resaltado en rojo si está en o por debajo del mínimo). Si parte del stock está comprometido con pedidos de clientes, debajo aparece en ámbar *"N reservada(s) en pedidos"*.
- Un **ajuste de stock** no puede dejar el stock del almacén por debajo de las unidades reservadas para pedidos, y los **repuestos de Servicio Técnico** solo pueden tomarse del stock disponible.
- **"+ Nuevo producto"** / **"Editar"**: nombre, código interno, código de barras, categoría, marca, precio de compra/venta, unidad de medida SUNAT, afectación de IGV, stock mínimo, y las casillas **"Es un servicio"** (no maneja stock — usado para mano de obra), **"Requiere serie"** (equipos con número de serie individual) y **"Activo"**.
- **"Ver series"** (productos con número de serie): consulta y administra las series registradas por almacén y su estado (disponible / vendida).
- **"Eliminar"**: da de baja el producto.

**Categorías y Marcas:** catálogos simples de apoyo para clasificar productos (nombre + estado activo).

**Almacenes:** ubicaciones físicas de stock (nombre, código, dirección). Cada caja registradora debe tener un almacén asignado para poder vender.

### 7.2 Clientes y Proveedores

Menú **Clientes y Proveedores**: un único directorio de contactos usado tanto en ventas/guías (clientes) como en compras (proveedores).

- Pestañas: Todos / Clientes / Proveedores. Búsqueda por DNI, RUC o nombre.
- **"+ Nuevo contacto"** / **"Editar"**: tipo (Cliente, Proveedor o Ambos), tipo y número de documento, nombre o razón social, dirección, correo y teléfono.
- **"Deshabilitar" / "Habilitar"** y **"Eliminar"** el contacto.

### 7.3 Compras

Menú **Compras**: registra el ingreso de mercadería de proveedores y actualiza el costo y el stock.

- **Historial de Compras**: filtra por texto, estado (Completado/Anulado) y fechas; **"Ver detalle"** abre cada compra.
- **"Nueva Compra"**:
  1. Selecciona **Proveedor** (o créalo con **"+ Nuevo"**) y el **Almacén de destino**.
  2. Indica **Tipo de comprobante** (Factura/Boleta), **N° de documento** y **Fecha de compra**.
  3. Busca y agrega **productos**, definiendo cantidad y costo unitario por línea. Si el producto requiere serie, el sistema exige registrar el número exacto de series antes de guardar.
  4. Revisa el resumen (Subtotal, IGV 18%, Total) y presiona **"Registrar Compra"**.
- Al registrarse: se incrementa el stock del almacén elegido, se actualiza el costo del producto y se registran las series nuevas si aplica.
- **"Anular"** una compra (con motivo) revierte el stock incrementado y elimina las series registradas, siempre que ninguna ya haya sido vendida. Además, el **stock disponible** (sin contar lo reservado para pedidos) debe alcanzar para revertir la compra.
- **Compras vinculadas a pedidos a demanda**: si la compra se genera desde la pestaña **"Compras a demanda"** de Pedidos, cada línea muestra *"Para pedido PED-…"* con las unidades asignadas a ese pedido, y el almacén queda fijado al del pedido. Al registrarla, esas unidades se reservan automáticamente para el cliente. Si se anula, vuelven a quedar pendientes de compra en su pedido (ver [sección 9.4](#94-compras-a-demanda-comprar-lo-que-falta)).

### 7.4 Reportes y Reportes SUNAT

Menú **Reportes**.

**Reportes generales:**
- **Registro de Ventas** y **Kardex de Inventario**, filtrables por período (hoy, semana, mes o rango personalizado).
- Botón **"Descargar CSV / Excel"** para exportar la pestaña activa.

**Reportes Oficiales SUNAT (SIRE/PLE)** — enlace *"Reportes Oficiales SUNAT →"*:
- **Ventas SUNAT (SIRE)**, **Compras SUNAT (SIRE)**, **Kardex 13.1** e **Inventario Físico 12.1**.
- Filtra por **mes/año** (período tributario) o por **rango de fechas** personalizado.
- Exporta en **TXT** (formato para subir al aplicativo SIRE/PLE de SUNAT) o en **CSV** (para revisar en Excel).

### 7.5 Búsqueda de productos (distingue mayúsculas y minúsculas)

Todas las búsquedas de **productos** del sistema respetan **exactamente las mayúsculas y minúsculas** con las que se registró el producto. Esto aplica en Inventario, Punto de Venta, Cotizaciones, Pedidos, Compras, OC del Estado y repuestos de Servicio Técnico, y a los campos **nombre**, **código interno**, **código de barras** y **N° de serie**.

Ejemplo, con los productos registrados como *"iPhone 15"* e *"IPHONE Case"*:

| Escribes | Resultado |
|---|---|
| `iPhone` | iPhone 15 |
| `IPHONE` | IPHONE Case |
| `iphone` | *(ningún resultado)* |

- La búsqueda encuentra el texto en cualquier parte del campo (no hace falta escribir el nombre completo), pero con la misma capitalización.
- Los caracteres `%` y `_` se buscan como texto literal (no funcionan como comodines).
- Si no encuentras un producto que sabes que existe, revisa cómo fue registrado (por ejemplo "Mouse" vs "MOUSE") o búscalo por su código.
- Las búsquedas de **clientes y proveedores** (por nombre, RUC o DNI) no cambian.

> **Recomendación:** acuerden un criterio único para registrar nombres y códigos de productos (por ejemplo, códigos siempre en mayúsculas) para facilitar las búsquedas.

---

## 8. Módulo de Cotizaciones (Proformas)

Permite preparar una **proforma** para un cliente con productos y precios, imprimirla y, cuando el cliente la acepta, convertirla en **Pedido de Venta** o en **Venta (POS)** sin volver a digitar los ítems.

Ve a **Cotizaciones** en el menú superior.

> Una cotización **no reserva stock** ni lo descuenta: solo informa la disponibilidad al momento de cotizar.

### 8.1 Consultar cotizaciones

La lista muestra código (formato **COT-000001**), cliente, fecha de emisión, vigencia (con la etiqueta *"(vencida)"* si ya pasó), total y estado. Puedes filtrar por código o cliente, por estado y por rango de fechas. **"Ver detalle"** abre la cotización.

**Estados de una cotización:**

| Estado | Significado |
|---|---|
| **Borrador** | Recién creada. Es la única que se puede editar. |
| **Aprobada** | El cliente aceptó. Ya no se edita, y se puede convertir en pedido o facturar. |
| **Rechazada** | El cliente no aceptó (se puede rechazar desde Borrador o Aprobada). |
| **Convertida** | Ya se generó el pedido o la venta a partir de ella. |

### 8.2 Crear una cotización

Presiona **"Nueva Cotización"**:

1. **Cliente**: búscalo por RUC/DNI o razón social y selecciónalo (con **"Cambiar"** eliges otro). El cliente debe estar **registrado previamente** en **Clientes y Proveedores** ([sección 7.2](#72-clientes-y-proveedores)); si es nuevo, regístralo allí primero con su RUC (si luego se le emitirá Factura) o DNI.
2. **Almacén de referencia** *(opcional)*: solo sirve para mostrar el stock disponible de cada producto; no reserva nada. Para cambiarlo, primero quita los productos agregados.
3. **Fecha de emisión** y **Válida hasta** (la vigencia no puede ser anterior a la emisión).
4. **Observaciones / condiciones** *(opcional)*: forma de pago, plazo de entrega, garantía, etc. Se imprimen en la proforma.
5. **Productos**: búscalos por nombre, código o código de barras (distingue mayúsculas/minúsculas, [7.5](#75-búsqueda-de-productos-distingue-mayúsculas-y-minúsculas)) y haz clic para agregarlos. Si agregas un producto que ya está en la lista, se suma una unidad.
   - Ajusta la **Cantidad** y el **Precio Unit. (inc. IGV)** de cada línea; se propone el precio de venta del producto, pero puedes modificarlo. Quita líneas con la **✕**.
   - Debajo de cada producto se indica la disponibilidad: *"Stock disponible: N"* o, si no alcanza, cuántas unidades irían *"a demanda (sin stock suficiente)"*. Se puede cotizar aunque no haya stock.
6. Presiona **"Guardar cotización"**. Se genera el código correlativo y se abre su detalle.

Mientras esté en **Borrador**, el botón **"Editar"** permite cambiar cualquier dato o la lista de productos.

### 8.3 Cálculo del IGV

Los precios que ingresas **incluyen IGV**, igual que en el POS. Por cada línea el sistema calcula:

- **Productos gravados** (afectación de IGV "10 - Gravado"): Base = Total de la línea ÷ 1.18, e IGV = Total − Base. Se suman en **Op. Gravada** e **IGV (18%)**.
- **Productos exonerados o inafectos**: todo el importe va a **Op. Exonerada** y no llevan IGV.
- **Importe Total** = Op. Gravada + Op. Exonerada + IGV.

Ejemplo: 2 unidades de un producto gravado a S/ 59.00 c/u dan un total de S/ 118.00, con Op. Gravada S/ 100.00 e IGV S/ 18.00.

La afectación de IGV se toma de la ficha de cada producto (Inventario). Los mismos importes pasan al pedido o a la venta cuando se convierte la cotización.

### 8.4 Aprobar, imprimir y convertir la cotización

Desde **"Ver detalle"**:

- **"Imprimir proforma"**: genera la proforma con el membrete de la empresa, datos del cliente (RUC/DNI y dirección), fechas de emisión y vigencia, vendedor, ítems, el desglose Op. Gravada / Op. Exonerada / IGV 18% / TOTAL y las condiciones, lista para imprimir o entregar al cliente. Disponible en cualquier estado.
- **"Aprobar"** (solo en Borrador): registra que el cliente aceptó la cotización.
- **"Rechazar"** (en Borrador o Aprobada): la cotización queda cerrada.

Si la cotización está vencida verás el aviso *"Esta cotización venció el …"*: confirma precios y stock antes de continuar.

#### 8.4.1 Convertir la cotización en pedido o en venta

Una cotización **Aprobada** tiene dos caminos. En ambos se copian automáticamente el cliente, los productos, las cantidades y los precios.

**A) "Convertir en pedido"**: úsalo cuando la mercadería se entrega después o hay productos sin stock.
1. Elige el **Almacén de despacho** (donde se reservará el stock y se recibirá lo que se compre a demanda).
2. Indica la **Entrega comprometida** *(opcional)*.
3. Confirma. Se crea el pedido (formato **PED-000001**) con la fecha de hoy, y la cotización pasa a **Convertida** con la referencia *"Convertida en el pedido PED-…"*. El pedido reserva el stock disponible y marca el resto **a demanda** ([sección 9](#9-pedidos-de-venta-pedidos-a-demanda-y-stock-reservado)).

**B) "Facturar en POS"**: úsalo cuando el cliente paga y se lleva la mercadería en el momento.
1. Se abre el Punto de Venta con el cliente y los productos cargados (requiere tener caja abierta).
2. Puedes ajustar las líneas si es necesario; la venta valida el stock disponible del almacén de tu caja.
3. Al confirmar la venta, la cotización pasa a **Convertida** con la referencia *"Convertida en la venta B001-…"* ([sección 2.5](#25-facturar-una-cotización-o-un-pedido-desde-el-pos)).

---

## 9. Pedidos de Venta, Pedidos a Demanda y Stock Reservado

Un **Pedido de Venta** compromete mercadería con un cliente antes de facturarla. Lo que hay en stock se **reserva** para ese cliente y lo que falta queda **a demanda**: se compra al proveedor por la cantidad exacta y, al llegar, se reserva automáticamente para el pedido.

Ve a **Pedidos** en el menú superior. Tiene dos pestañas: **Pedidos** y **Compras a demanda**.

### 9.1 Stock físico, reservado y disponible

Para cada producto y almacén el sistema maneja tres cantidades:

| Concepto | Qué es |
|---|---|
| **Stock físico** | Unidades que realmente hay en el almacén. |
| **Stock reservado** | Unidades del stock físico comprometidas con pedidos abiertos (Esperando compra o Listo para facturar). Siguen en el almacén, pero ya tienen dueño. |
| **Stock disponible** | Stock físico − Stock reservado. Es lo único que se puede vender o usar. |

Ejemplo: hay 10 laptops en el almacén y un pedido reservó 4. El stock físico es 10, el reservado 4 y el disponible 6. En el POS solo se pueden vender 6 a otros clientes.

El stock disponible es el que usan el **POS**, las **salidas de Servicio Técnico**, la **anulación de compras**, el **reporte de las OC del Estado** y los avisos de stock de Cotizaciones y Pedidos. En **Inventario → Productos** se indica cuántas unidades están *"reservada(s) en pedidos"*.

La reserva se libera cuando el pedido se **factura** (las unidades salen del almacén con la venta) o se **cancela** (las unidades vuelven a estar disponibles).

### 9.2 Registrar un pedido

Un pedido se crea de dos formas: convirtiendo una cotización aprobada ([8.4.1](#841-convertir-la-cotización-en-pedido-o-en-venta)) o directamente con **"Nuevo Pedido"**:

1. **Cliente** (debe estar registrado en Clientes y Proveedores).
2. **Almacén de despacho**: allí se reserva el stock y allí deberá ingresar la compra a demanda. Para cambiarlo, quita primero los productos.
3. **Fecha del pedido** y **Entrega comprometida** *(opcional, no anterior a la fecha del pedido)*.
4. **Observaciones** *(opcional)*.
5. **Productos**, con cantidad y precio unitario (inc. IGV), igual que en la cotización. Debajo de cada línea verás *"Se reservan N de stock"* o cuántas unidades quedarán *"a demanda"*. Si hay unidades sin stock, un aviso indica que el pedido quedará *"Esperando compra"* hasta que ingrese la mercadería.
6. Presiona **"Registrar pedido"**.

Al registrarlo, **cada línea toma lo que puede del stock disponible** (lo reserva) y el resto queda **a demanda**. Los servicios no reservan stock.

### 9.3 Estados del pedido

| Estado | Significado |
|---|---|
| **Esperando compra** | Al menos una línea tiene unidades a demanda que aún no llegan. |
| **Listo para facturar** | Todas las unidades están reservadas (desde el inicio o porque ya llegó la compra). |
| **Facturado** | Se emitió el comprobante desde el POS. |
| **Cancelado** | Se anuló el pedido y se liberó su stock. |

El paso de *Esperando compra* a *Listo para facturar* es **automático** al registrar la compra que cubre lo que faltaba.

En el detalle del pedido, la tabla muestra por cada producto: **Cant.**, **De stock** (reservado al crear), **A demanda**, **Recibido** (llegado por compras vinculadas), **Por comprar** (en rojo si falta) y **Total**, además de las compras vinculadas (*"↳ Compra F001-… (proveedor): N und."*).

### 9.4 Compras a demanda: comprar lo que falta

La pestaña **"Compras a demanda"** lista **todas las líneas de pedidos pendientes que esperan mercadería**, ordenadas por fecha de entrega comprometida, con: producto, **cantidad exacta por comprar**, pedido y cliente, entrega, almacén y **proveedor sugerido** (el último proveedor al que se le compró ese producto).

Para generar la compra:

1. Marca las líneas a comprar. Deben ser **del mismo almacén**, porque una compra ingresa a un solo almacén (si mezclas almacenes, el sistema te avisa).
2. Presiona **"Generar compra (N)"**. También puedes usar **"Comprar faltantes"** desde el detalle de un pedido en *Esperando compra*.
3. Se abre **Nueva Compra** con:
   - El **almacén** del pedido, fijo (*"Fijado por los pedidos a demanda"*).
   - El **proveedor sugerido** preseleccionado, si todas las líneas tienen el mismo; si no, elígelo.
   - Cada producto con la **cantidad exacta** que falta y la etiqueta *"Para pedido PED-…"* con las unidades asignadas a cada pedido.
4. Completa tipo y número de comprobante del proveedor, fecha y costos, y presiona **"Registrar Compra"**.

Reglas de la vinculación:
- Puedes comprar **más** unidades de las asignadas (el excedente queda como stock libre), pero **no menos** de lo asignado a pedidos. Si hace falta, desvincula un pedido de la línea.
- No se puede asignar a un pedido más de lo que le falta.

Al registrar la compra, el stock del almacén aumenta, las unidades asignadas **se reservan para cada cliente** y los pedidos que quedan completos pasan a **Listo para facturar**. Si después se anula la compra, esas unidades vuelven a *Por comprar* y el pedido regresa a **Esperando compra**.

### 9.5 Facturar el pedido

Con el pedido en **Listo para facturar**, presiona **"Facturar en POS"** en su detalle. Se abre el Punto de Venta con el cliente y los productos del pedido **fijos**. Elige comprobante y pagos y confirma: el stock reservado se descuenta con la venta y el pedido pasa a **Facturado**, enlazado al comprobante.

- Debe facturarse desde una caja cuyo almacén sea el **almacén del pedido**.
- La venta debe incluir **exactamente** los productos y cantidades del pedido.
- Si un producto requiere serie, elige las series antes de cobrar.
- Un pedido en *Esperando compra* no se puede facturar.

### 9.6 Cancelar un pedido

En un pedido *Esperando compra* o *Listo para facturar*, **"Cancelar pedido"** pide un **motivo de cancelación** obligatorio. Al confirmar se libera todo el stock reservado. Las unidades que ya se habían comprado para el pedido quedan como **stock libre** en el almacén. Un pedido facturado o cancelado no se puede cancelar.

---

## 10. Órdenes de Compra del Estado

Registra las **órdenes de compra (OC)** que emiten entidades del Estado y compara lo solicitado con el **stock disponible** para saber si se puede atender la entrega o qué hay que comprar.

Ve a **OC del Estado** en el menú superior.

> Registrar una OC del Estado **no reserva ni descuenta stock**: es una herramienta de seguimiento y planificación. La entrega física se factura y se despacha por los módulos habituales (POS, Guías de Remisión).

### 10.1 Consultar órdenes

La lista muestra N° de OC, entidad, emisión, plazo de entrega, monto y estado (**Pendiente**, **Entregada**, **Anulada**). Puedes buscar por N° de OC, N° SIAF o entidad y filtrar por estado.

### 10.2 Registrar una orden de compra

Presiona **"Nueva Orden de Compra del Estado"** y completa:

1. **Entidad del Estado**: búscala por RUC o nombre. Debe estar registrada como **cliente** en Clientes y Proveedores; si no aparece, regístrala allí primero.
2. **N° de OC** (obligatorio, ej. `OC-2026-000123`). No puede repetirse para la misma entidad.
3. **N° SIAF** *(opcional)*.
4. **Fecha de emisión** y **Plazo de entrega** *(opcional, no anterior a la emisión)*.
5. **Almacén de atención** *(opcional)*: define qué stock se compara contra la orden. Si eliges "Todos los almacenes", se suma el stock disponible de todos.
6. **Observaciones** *(opcional)*.
7. **Ítems solicitados**: busca cada producto e indica cantidad y precio unitario (inc. IGV), tal como figuran en la OC.
8. Presiona **"Registrar y ver reporte de stock"**.

### 10.3 Reporte de stock: disponible vs. por comprar

Al registrar la orden (y en cualquier momento desde **"Ver detalle"**) se muestra el reporte **"Stock disponible vs. qué se tiene que comprar"**:

- **Resumen**: unidades solicitadas, unidades cubiertas con stock, unidades **por comprar** y el **costo estimado de compra** (unidades faltantes × precio de compra del producto). Si no falta nada verás *"El stock actual cubre toda la orden. No es necesario comprar."*
- **Por producto**: solicitado, stock disponible (con el detalle por almacén), por comprar, costo estimado y el estado de la línea:

| Estado de línea | Significado |
|---|---|
| **Stock completo** | El stock disponible cubre lo solicitado. |
| **Stock parcial** | Hay stock, pero no alcanza. |
| **Sin stock** | No hay unidades disponibles. |
| **Servicio** | No maneja stock. |

El reporte usa el **stock disponible**: no cuenta las unidades reservadas para pedidos de venta. Como el stock cambia con las ventas y compras, usa **"Recalcular con stock actual"** antes de planificar la compra o la entrega. Si un producto aparece en varias líneas de la OC, el reporte lo agrupa en una sola.

### 10.4 Entregar o anular la orden

Con la orden **Pendiente**:
- **"Marcar como entregada"**: cuando se completó la entrega a la entidad.
- **"Anular orden"**: pide un **motivo de anulación** obligatorio.

Una orden Entregada o Anulada ya no cambia de estado.

---

## 11. Cancelación de Comprobantes

Registra la **cancelación (pago)** de **Facturas**, **Notas de Crédito** y **Letras** con los datos de la operación bancaria, para llevar el control de qué documentos ya fueron pagados y cómo.

Ve a **Cancelaciones** en el menú superior.

### 11.1 Consultar cancelaciones

La lista muestra comprobante, cliente/proveedor, importe, fecha de pago, medio de pago y N° de operación, banco/cuenta y estado (**Registrado** / **Anulado**). Puedes buscar por N° de comprobante, N° de operación o contacto, y filtrar por tipo de comprobante, medio de pago, estado y rango de fechas.

### 11.2 Registrar una cancelación

Presiona **"Registrar cancelación"** y completa:

| Campo | ¿Obligatorio? | Detalle |
|---|:---:|---|
| **Cliente / Proveedor** | Sí | Contacto dueño del comprobante. Búscalo por RUC/DNI o razón social. |
| **Tipo de comprobante** | Sí | Factura, Nota de Crédito o Letra. |
| **N° de comprobante** | Sí | Ej. `F001-000123`. |
| **Importe pagado** | Sí | Mayor a cero, en **S/** (soles) o **US$** (dólares). |
| **Fecha de pago** | Sí | No puede ser posterior a hoy. |
| **Medio de pago** | Sí | Transferencia, Depósito en cuenta, Cheque, Efectivo, Tarjeta o Yape/Plin. |
| **Banco** | Sí | Se sugieren los más comunes (BCP, BBVA, Interbank, Scotiabank, Banco de la Nación, BanBif, Banco Pichincha, Caja Arequipa, Caja Huancayo), pero se puede escribir cualquiera. |
| **Cuenta** | Sí | N° de cuenta o CCI donde se recibió o desde donde se hizo el pago. |
| **N° de operación** | No *(opcional)* | Código de la operación bancaria o voucher. Si se deja vacío, figura como *"Sin N° de operación"*. |
| **Observaciones** | No *(opcional)* | Cualquier comentario adicional. |

Presiona **"Registrar cancelación"** para guardar.

> **Control de duplicados:** no se puede registrar dos veces el mismo **N° de operación en el mismo banco** mientras la primera cancelación siga vigente. El sistema mostrará: *"Ya existe una cancelación registrada con este N° de operación en el mismo banco."*

### 11.3 Anular una cancelación

Si se registró por error, usa **"Anular cancelación"** e indica el **motivo de anulación** (obligatorio). La cancelación queda como **Anulada** en el historial (no se borra), y su N° de operación queda libre para volver a registrarse correctamente.

---

## 12. Preguntas frecuentes y solución de problemas

**No veo el botón para vender / el sistema me dice que abra caja.**
Debes abrir un turno de caja primero (sección 5.1). Si ya lo hiciste y sigue sin funcionar, confirma con un administrador que tu caja tenga un **almacén asignado**.

**No puedo emitir Factura a un cliente.**
El cliente seleccionado debe tener **RUC** registrado (documento tipo 6). Edítalo en Clientes y Proveedores o créalo con el RUC correcto antes de facturar.

**No aparece la serie/correlativo al vender.**
Falta configurar una **serie SUNAT activa** para ese tipo de comprobante en la caja que estás usando (sección 5.5).

**No veo un módulo que debería usar.**
Tu rol no tiene el permiso necesario. Pide a un Administrador que revise tus permisos en Administración → Roles y Permisos (sección 6).

**Anulé un comprobante por error.**
Las anulaciones quedan registradas de forma permanente con el motivo indicado; no existe un "deshacer". Si corresponde, registra una nueva venta.

**El equipo del cliente ya fue entregado pero la orden sigue "Reparado".**
La entrega solo se marca automáticamente al completar el cobro desde "Enviar a cobro (POS)" (sección 4.3); una orden no se marca como entregada manualmente.

**Busco un producto y no aparece, pero sé que existe.**
La búsqueda de productos distingue mayúsculas y minúsculas: "mouse" no encuentra "Mouse". Escribe el texto como fue registrado o búscalo por su código (sección 7.5).

**Hay stock físico en el almacén, pero el POS dice que no hay suficiente.**
Parte de ese stock está reservado para pedidos de otros clientes. Revisa en Inventario cuántas unidades están "reservada(s) en pedidos" y en Pedidos a qué clientes pertenecen (sección 9.1).

**No puedo editar una cotización.**
Solo se editan cotizaciones en **Borrador**. Si ya está aprobada y hay que cambiarla, recházala y crea una nueva (sección 8).

**El botón "Facturar en POS" del pedido no aparece.**
El pedido debe estar **Listo para facturar**: si está en "Esperando compra", primero registra la compra de lo que falta desde "Compras a demanda" (sección 9.4). Además, debes facturarlo desde una caja cuyo almacén sea el del pedido.

**No puedo seleccionar líneas de distintos pedidos en "Compras a demanda".**
Puedes combinar pedidos distintos, pero las líneas deben ser del mismo almacén, porque una compra ingresa a un solo almacén. Genera una compra por almacén.

**Al registrar una cancelación me dice que el N° de operación ya existe.**
Ya hay una cancelación vigente con ese N° de operación en el mismo banco. Verifica que no sea un pago duplicado; si la anterior fue un error, anúlala primero (sección 11.3).

**No veo los módulos Cotizaciones, Pedidos, OC del Estado o Cancelaciones.**
Tu rol no tiene los permisos correspondientes (sección 6.3). Si eres administrador y tampoco los ves tras una actualización del sistema, pide a soporte que actualice los permisos del sistema y vuelve a iniciar sesión.

---

*Fin del manual. Ante cualquier duda adicional, contacta al equipo de soporte / Administración de SistemaCasita.*
