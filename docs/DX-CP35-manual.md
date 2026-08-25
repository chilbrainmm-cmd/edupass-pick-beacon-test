# Manual DX-SMART DX-CP35 — Baliza Bluetooth

Guardado el 2026-08-16 desde [eu.manuals.plus](https://eu.manuals.plus/dx-smart/dx-cp35-bluetooth-beacon-manual)
(la pagina bloquea descargas directas/curl con 403 -- se rescato navegando con un
navegador real). Version del manual: **2.0, 2025/12/10**. Contenido tecnico
reproducido tal cual del original (la pagina fuente mezcla ingles y vasco en
los titulos de seccion; el contenido tecnico util esta en ingles/valores
numericos, que es lo que importa para configurar el dispositivo).

Fabricante: Shenzhen DX-SMART Technology Co., Ltd. — mismo modelo que
compramos para la prueba de EduPass Pick.

## 1. Descripcion general

BLE 5.1, soporta protocolos **iBeacon** y **Eddystone** simultaneamente.
Carcasa tipo tarjeta (PC), bateria de litio reemplazable, pensado para
gestion de activos, posicionamiento interior y "advertising push". El
fabricante ofrece SDK y personalizacion OEM/ODM si algun dia se necesita.

## 2. Caracteristicas del producto

- Chip principal: **Dialog DA14531**, procesador ARM Cortex-M0
- Protocolo Bluetooth **BLE 5.1**
- Bajo consumo:
  - Consumo normal: **38.61 uA**
  - Con ACC (acelerometro) de emision activado: **34.41 uA**
- **Vida util de bateria: 9 meses** (con los parametros por defecto: potencia
  +2.5dBm, intervalo de emision 500ms -- dura mas si se baja la potencia o se
  alarga el intervalo)
- Bateria de litio **reemplazable**
- Distancia de comunicacion en linea de vista abierta: **50-70m**
- Soporta iBeacon y Eddystone
- **7 UUID en carrusel** (puede rotar hasta 7 identificadores distintos)
- Tamano reducido: **40 x 25 x 5.6 mm**
- Grado de proteccion: **IP67**

## 3. Parametros Bluetooth por defecto (de fabrica)

Esto es lo importante para cuando lleguen las balizas y haya que
identificarlas/configurarlas:

| Parametro | Valor por defecto |
|---|---|
| Nombre Bluetooth | `CP35-XX` (XX = ultimos 2 bytes de la direccion MAC) |
| Potencia de transmision | +2.5 dBm |
| Intervalo de emision (broadcast) | 500 ms |
| **iBeacon** — UUID | `E2C56DB5-DFFB-48D2-B060-D0F5A71096E0` |
| **iBeacon** — Major | 5 |
| **iBeacon** — Minor | 6 |
| **Eddystone UID** — Namespace ID | `e5a4a7e5a48f31323334` |
| **Eddystone UID** — Instance ID | `44584c29191a` |
| **Eddystone URL** | `http://en.szdx-smart.com` |
| Contrasena de reinicio (restart) | `dx1234` |
| Contrasena de reset de fabrica | `1234` |

> ⚠️ Importante para EduPass Pick: si compran varias balizas, **todas van a
> traer el mismo UUID/Major/Minor de fabrica por defecto** (son valores del
> firmware, no unicos de verdad salvo el nombre Bluetooth `CP35-XX`, que si
> cambia por baliza segun su MAC). Para que `pairing-store.js` pueda
> distinguir una baliza de otra de forma confiable, lo mas facil es usar el
> **nombre Bluetooth (`CP35-XX`, unico por MAC)** o la **direccion MAC** como
> `beaconId`, en vez de UUID/Major/Minor -- salvo que decidan configurar un
> Major/Minor distinto a mano en cada una desde la app (mencionado en la
> seccion 5 de abajo), lo cual es mas trabajo pero da control total sobre los
> identificadores.

## 4. Tabla de parametros basicos

| Parametro | Valor | Parametro | Valor |
|---|---|---|---|
| Chip | DA14531 | Modelo | DX-CP35 |
| Especificacion Bluetooth | BLE 5.1 | Protocolo | GATT, iBeacon, Eddystone |
| Modelo de bateria | **CR2032** | Intervalo de emision | 100 ms a 1500 ms |
| Capacidad de bateria | 210 mAh | Potencia de transmision | -19.5 a +2.5 dBm |
| Metodo de alimentacion | Pila de boton | Sensibilidad | -94dBm @ 0.1% BER |
| Modulacion | GFSK | Banda de frecuencia | 2.402GHz - 2.480GHz (ISM) |
| Impedancia RF de entrada | 50 Ω | Salto de frecuencia/canal | 1600 hops/s, espaciado 2MHz, 40 canales |
| Interfaz de antena | Antena integrada (on-board) | Dimensiones del producto | 40 x 25 x 5.6 mm |
| Temperatura de operacion | MIN -40°C / MAX +85°C | Humedad | 10%-95% sin condensacion |

**Bateria: CR2032, la misma pila de boton comun y facil de conseguir en**
**cualquier tienda** (relojes, tarjetas madre, etc.) -- confirma esto al
recibir el pedido.

## 5. Como configurar los parametros (app movil del fabricante)

El fabricante tiene su propia app llamada **"DX-SMART"** para leer/cambiar los
parametros de la baliza (UUID, Major, Minor, intervalo, potencia, etc.). Esto
es aparte y no tiene nada que ver con la app de EduPass Pick que estamos
construyendo -- se usa solo una vez por baliza, al configurarla, no para el
uso diario.

### Android
1. Descargar `DX-SMART.apk` desde el sitio oficial del fabricante o pedirlo a
   su soporte (`manager@szdx-smart.com`).
2. Abrir la app, ir a la pantalla de busqueda.
3. Buscar el nombre Bluetooth de la baliza (`CP35-XX`) y darle "Connect".
4. Una vez conectado, se pueden modificar los distintos parametros del frame.
5. Modificar segun el formato/rango permitido y darle "Save". Debe aparecer
   "Saved successfully".

### iPhone
1. Descargar la app **DX-SMART** desde el Apple App Store.
2. Abrir la pantalla "Beacon", buscar y conectar por nombre.
3. Una vez conectado, se pueden modificar los parametros de iBeacon y
   Eddystone.
4. Despues de modificar, tocar "Restart", ingresar la contrasena de reinicio
   (`dx1234` por defecto) para que el cambio quede aplicado.

## 6. Indicador luminoso (LED)

| Comportamiento | Que significa |
|---|---|
| Parpadeo unico | El modulo se encendio |
| Parpadeo doble | El modulo volvio a modo "conectable" |
| Parpadeo continuo | La app (Android o iOS) esta conectada al modulo |
| Apagado | Sin conexion |

## 7. Distancia medida por el fabricante (referencia)

Con parametros por defecto (potencia +2.5dBm, intervalo 500ms):

| Celular de prueba | Distancia conectado | Distancia solo de emision (broadcast) |
|---|---|---|
| iPhone 12 | 55m | 65m |
| Google Pixel 6 | 65m | 73m |

Para nuestro caso (solo lectura de RSSI en modo escaneo/broadcast, sin
conectar de verdad) el numero relevante es la columna "emision" -- osea que en
condiciones ideales (linea de vista, sin obstaculos) el fabricante reporta
65-73m. En la prueba real, con carros/obstaculos de por medio, hay que
esperar bastante menos.

## 8. Precauciones

- Evitar aplastar el producto con fuerza externa.
- Usar en interiores o exteriores a temperatura ambiente; no sumergir ni usar
  en ambiente humedo/con agua directa (a pesar del IP67, que es resistencia a
  salpicaduras/polvo, no inmersion prolongada).
- No desarmar ni reparar por cuenta propia si no eres profesional.
- Cumple FCC Parte 15 (Clase B).

## 9. Contacto del fabricante

- Correo: manager@szdx-smart.com
- Tel: 0755-2997 8125
- WhatsApp: +86 15798463070
- Web: eu.szdx-smart.com

---

## Notas para la integracion con EduPass Pick (no es parte del manual original)

- **`beaconId` a usar en `pairing-store.js`**: usar el nombre Bluetooth
  (`CP35-XX`) o la MAC que reporte el plugin de Capacitor al escanear -- NO
  el UUID de iBeacon, porque ese viene igual de fabrica en todas las balizas
  a menos que se reconfigure cada una a mano.
- **Antes de repartir las balizas a las familias**, conviene decidir si:
  (a) se usan tal cual con el `beaconId` = MAC/nombre de fabrica (mas rapido,
  cero configuracion), o (b) se le pone a cada una un Major/Minor distinto
  via la app DX-SMART (mas control, pero hay que conectarse una por una con
  el celular antes de entregarlas).
- **Bateria CR2032**: facil de conseguir en Mexico (farmacias, tiendas de
  electronica, Amazon.com.mx) -- no depende de pedirla al fabricante.
