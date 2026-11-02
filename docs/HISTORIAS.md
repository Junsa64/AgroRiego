# Historias de usuario de los 3 sprints

Formato: Como… quiero… para… Criterios de aceptación en Dado / Cuando / Entonces. SP = puntos de historia.

## Sprint 1

### HU-01 · Iniciar sesión (3 SP)
Como productor, quiero iniciar sesión con mi correo y contraseña, para acceder solo yo a la información y control de mis parcelas.

- Dado un usuario registrado, cuando ingresa correo y contraseña correctos, entonces entra al panel principal.
- Dado un usuario, cuando ingresa datos incorrectos, entonces ve el mensaje «Correo o contraseña incorrectos» sin indicar cuál de los dos falló.
- Dado un usuario, cuando falla 5 intentos seguidos, entonces la cuenta se bloquea 15 minutos.
- Dado un usuario que olvidó su contraseña, cuando la solicita, entonces recibe un enlace de restablecimiento por correo.

Nota: para el MVP el correo de restablecimiento puede mostrarse en la consola del servidor en lugar de enviarse.

### HU-03 · Registrar parcela (3 SP)
Como productor, quiero registrar mis parcelas con nombre, superficie, cultivo y ubicación, para organizar el monitoreo por terreno.

- Dado el productor, cuando captura nombre, superficie en hectáreas, cultivo y ubicación en el mapa, entonces la parcela aparece en su panel.
- Dado el formulario, cuando falta un campo obligatorio, entonces no se guarda y se marca el campo faltante.
- Dado una parcela, cuando el productor la edita, entonces los cambios se reflejan de inmediato.

### HU-04 · Vincular sensor y válvula a una parcela (5 SP)
Como técnico de campo, quiero vincular un sensor de humedad y una válvula a una parcela mediante su código, para que la parcela empiece a enviar lecturas y se pueda regar.

- Dado un sensor encendido, cuando el técnico captura o escanea su código QR, entonces queda vinculado a la parcela elegida.
- Dado un código que ya está vinculado a otra parcela, cuando se intenta registrar, entonces el sistema lo rechaza con un aviso.
- Dado un sensor recién vinculado, cuando envía su primera lectura, entonces su estado cambia a «En línea».

## Sprint 2

### HU-05 · Ver panel de humedad en tiempo real (8 SP)
Como productor, quiero ver en un panel la humedad de suelo actual de todas mis parcelas, para saber de un vistazo cuál necesita riego.

- Dado un productor con parcelas, cuando abre el panel, entonces ve cada parcela con su humedad en porcentaje y la hora de la última lectura.
- Dado un sensor que envía lecturas cada 5 minutos, cuando llega una lectura nueva, entonces el panel se actualiza sin recargar la página.
- Dado una parcela, cuando su humedad está bajo el umbral, entonces se muestra en rojo; en rango, en verde.

### HU-07 · Encender y apagar riego manualmente (8 SP)
Como productor, quiero abrir y cerrar la válvula de una parcela desde la app, para regar sin tener que ir al campo.

- Dado una válvula en línea, cuando el productor pulsa «Iniciar riego» y confirma, entonces la válvula se abre en menos de 30 segundos y el estado cambia a «Regando».
- Dado un riego activo, cuando pulsa «Detener», entonces la válvula se cierra y se registra la duración.
- Dado una válvula sin conexión, cuando se intenta regar, entonces el botón aparece deshabilitado con el aviso «Equipo sin conexión».

### HU-11 · Recibir alerta de humedad crítica (5 SP)
Como productor, quiero recibir una notificación cuando una parcela tenga humedad crítica, para actuar a tiempo y no perder el cultivo.

- Dado una parcela, cuando su humedad baja del nivel crítico, entonces el productor recibe una notificación push y la alerta aparece en la bandeja.
- Dado una alerta, cuando el productor la abre, entonces va al detalle de la parcela con la opción de regar.
- Dado una alerta ya enviada, no se repite durante 1 hora para la misma parcela.

## Sprint 3

### HU-08 · Programar riego por horario (5 SP)
Como productor, quiero programar riegos por día, hora y duración, para que se rieguen las parcelas en las horas de menor evaporación.

- Dado una parcela, cuando el productor crea un programa (días, hora de inicio y minutos), entonces queda guardado y visible en la agenda.
- Dado un programa, cuando llega su hora, entonces la válvula se abre y se cierra al cumplir la duración.
- Dado dos programas que se empalman en la misma parcela, cuando se intenta guardar el segundo, entonces el sistema avisa del conflicto.

### HU-09 · Riego automático por umbral de humedad (8 SP)
Como productor, quiero definir un umbral mínimo de humedad para cada parcela, para que el sistema riegue solo cuando el suelo lo necesite.

- Dado un umbral de 35 %, cuando la humedad baja de 35 %, entonces el riego inicia automáticamente.
- Dado un riego automático, cuando la humedad llega al nivel objetivo, entonces el riego se detiene.
- Dado el modo automático, cuando el productor lo desactiva, entonces solo funcionan los riegos manuales y programados.

### HU-12 · Recibir alerta de falla de equipo (3 SP)
Como técnico de campo, quiero recibir un aviso cuando un sensor o válvula deje de reportar, para ir a revisarlo cuanto antes.

- Dado un sensor, cuando pasa 30 minutos sin enviar lecturas, entonces su estado cambia a «Sin conexión» y se avisa al técnico.
- Dado un sensor con batería menor a 15 %, entonces se envía un aviso de batería baja.

## Definición de Terminado (DoD)

- El código está en GitHub e integrado a `main` mediante pull request revisado por otro integrante.
- Cumple todos sus criterios de aceptación.
- Sus casos de prueba se ejecutaron y los defectos se registraron y cerraron en GitHub Issues.
- Funciona desplegada en el ambiente de pruebas.
- El Product Owner la aceptó en la revisión del sprint.
