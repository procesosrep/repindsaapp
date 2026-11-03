# Combustible con Intelyvale · V1.1

El Administrador configura una tarjeta por usuario en **Control de combustible → Intelyvale · Tarjetas y saldos por usuario**, indicando sus últimos cuatro dígitos. El saldo inicia en cero; no se obtiene del proveedor ni se permite escribir un saldo desde la ficha. No se almacenan el número completo, NIP ni credenciales de Intelyvale.

Las solicitudes nuevas de combustible se vinculan en el servidor a la tarjeta del usuario solicitante. El usuario no puede cambiar su titular mediante campos manipulados. El combustible conserva placas, unidad, litros, precio y kilometrajes para los reportes existentes.

Tesorería registra la carga realizada con fecha, referencia y comprobante de transferencia. Al aplicar solicitudes mixtas, se registran por separado **Saldo Intelyvale** y **Transferencia · otros conceptos**; sus importes no pueden superar cada componente. Una carga parcial mantiene la solicitud en Aplicar hasta completar el anticipo.

El consumo se presenta con «Comprobar» desde el anticipo, o seleccionando **Anticipo de saldo Intelyvale** en una nueva comprobación de combustible. Debe corresponder a un anticipo propio con carga documentada. Las comprobaciones pendientes reservan su importe contra ese anticipo y no pueden duplicar el saldo disponible.

Al aplicar la comprobación, el consumo reduce el saldo de la tarjeta en la misma transacción que registra la aplicación. No genera un segundo reembolso por combustible. Los bloqueos por revisión impiden registrar dos veces un consumo o perder movimientos concurrentes. Las devoluciones de saldo Intelyvale también quedan documentadas y reducen el saldo registrado. La interfaz muestra el saldo registrado por el sistema, no un saldo consultado en tiempo real a Intelyvale.

Las solicitudes y pagos históricos sin esta vinculación mantienen su tratamiento original. No se inventan cargas de saldo para movimientos previos. Si una tarjeta ya tiene saldo externo al comenzar, su conciliación debe documentarse antes de utilizarlo en este control; no se asume que esos fondos provengan de un anticipo existente.
