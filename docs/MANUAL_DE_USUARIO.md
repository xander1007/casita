# Manual de Usuario — SistemaCasita

**Sistema de gestión comercial para La Casita de la Computadora S.R.LTDA.**
Punto de venta, guías de remisión, servicio técnico, caja, compras e inventario.

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
8. [Preguntas frecuentes y solución de problemas](#8-preguntas-frecuentes-y-solución-de-problemas)

---

## 1. Introducción e Inicio de Sesión

### 1.1 ¿Qué es SistemaCasita?

SistemaCasita es el sistema interno de **La Casita de la Computadora S.R.LTDA.** para:

- Vender productos y servicios y emitir Boletas, Facturas y Notas de Venta.
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
- La barra superior muestra si tienes **Caja Abierta** o **Caja Cerrada**, y el menú de navegación con los módulos habilitados para tu rol: Panel, Punto de Venta, Ventas, Servicio Técnico, Guías de Remisión, Compras, Inventario, Clientes y Proveedores, Caja, Reportes, Administración.

---

## 2. Módulo de Ventas y Emisión de Comprobantes

Este módulo cubre el **Punto de Venta (POS)** —donde se registran las ventas— y el **Historial de Ventas** —donde se consultan y anulan comprobantes ya emitidos.

> ⚠️ **Requisito previo:** para vender necesitas tener una **caja abierta** (ver [sección 5](#5-gestión-de-caja-y-cierre-diario)). Si no la tienes abierta, el sistema te llevará automáticamente a la pantalla de apertura de caja.

### 2.1 Registrar una venta (Punto de Venta)

Ve a **Punto de Venta** en el menú superior (o el botón **"+ Nueva Venta POS"**).

1. **Buscar y agregar productos**: usa el buscador ("Buscar por nombre, código de barras o serie...") y/o el filtro de categoría. Haz clic sobre la tarjeta del producto para agregarlo al carrito.
   - Si el producto **requiere número de serie** (por ejemplo, equipos con garantía), el sistema te pedirá elegir la serie disponible antes de agregarlo.
   - Los productos sin stock aparecen deshabilitados y no se pueden seleccionar.
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
2. A la derecha se listan todos los **permisos disponibles**, agrupados por módulo (usuarios, roles, inventario, clientes, caja, series, pos, ventas, despatches, compras, servicios, reportes, etc.). Marca o desmarca las casillas según lo que ese rol debe poder hacer.
3. Presiona **"Guardar cambios"**.
4. Con el permiso adecuado puedes también **crear un nuevo rol** (nombre + "+") o **eliminar** uno personalizado.

> Los roles **"Super Admin"** y **"Usuario"** son roles base del sistema: su nombre no se puede editar ni eliminar. Además, "Super Admin" siempre tiene acceso completo, independientemente de las casillas marcadas.

### 6.3 Matriz de referencia de permisos por rol (configuración de fábrica)

| Módulo | Super Admin | Administrador | Vendedor / Cajero | Técnico |
|---|:---:|:---:|:---:|:---:|
| Punto de Venta | ✅ | ✅ | ✅ | — |
| Ventas (consulta / anular) | ✅ | ✅ | Consulta | — |
| Guías de Remisión | ✅ | ✅ | ✅ | — |
| Caja (abrir/cerrar/historial) | ✅ | ✅ | ✅ | — |
| Series SUNAT | ✅ | — | — | — |
| Servicio Técnico | ✅ | ✅ | — | ✅ |
| Compras | ✅ | ✅ | — | — |
| Inventario (ver) | ✅ | ✅ | ✅ | ✅ |
| Inventario (gestionar) | ✅ | ✅ | — | — |
| Clientes y Proveedores | ✅ | ✅ | ✅ | Consulta |
| Reportes / SUNAT | ✅ | ✅ | — | — |
| Administración (usuarios/roles) | ✅ | Parcial* | — | — |

\* Un Administrador puede crear/editar usuarios y asignarles roles, pero no puede crear roles nuevos ni modificar qué permisos tiene cada rol — eso está reservado a Super Admin.

---

## 7. Módulos complementarios

Estos módulos alimentan de datos a los procesos anteriores (ventas, guías y servicio técnico).

### 7.1 Inventario (Productos, Categorías, Marcas, Almacenes)

Menú **Inventario**, con pestañas internas para cada catálogo.

**Productos:**
- Lista con búsqueda (nombre, código, serie), filtro por categoría/marca, precio de venta y stock (resaltado en rojo si está en o por debajo del mínimo).
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
- **"Anular"** una compra (con motivo) revierte el stock incrementado y elimina las series registradas, siempre que ninguna ya haya sido vendida.

### 7.4 Reportes y Reportes SUNAT

Menú **Reportes**.

**Reportes generales:**
- **Registro de Ventas** y **Kardex de Inventario**, filtrables por período (hoy, semana, mes o rango personalizado).
- Botón **"Descargar CSV / Excel"** para exportar la pestaña activa.

**Reportes Oficiales SUNAT (SIRE/PLE)** — enlace *"Reportes Oficiales SUNAT →"*:
- **Ventas SUNAT (SIRE)**, **Compras SUNAT (SIRE)**, **Kardex 13.1** e **Inventario Físico 12.1**.
- Filtra por **mes/año** (período tributario) o por **rango de fechas** personalizado.
- Exporta en **TXT** (formato para subir al aplicativo SIRE/PLE de SUNAT) o en **CSV** (para revisar en Excel).

---

## 8. Preguntas frecuentes y solución de problemas

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

---

*Fin del manual. Ante cualquier duda adicional, contacta al equipo de soporte / Administración de SistemaCasita.*
