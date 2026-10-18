# Mi semana

Calendario y rutinas para un peque de 4 años, pensado para un iPad antiguo con iOS 12.
Es una app web que se instala en la pantalla de inicio: no necesita App Store ni Xcode
(el Xcode actual ya no compila para iOS 12).

## Qué hace

- **Hoy**: qué día es, si hay cole o no, y cuántas noches faltan para el fin de semana (en lunas 🌙).
- **La semana**: de lunes a domingo, con 🏫 los días de cole y 🏡 los días en casa. Tocar un día enseña lo que toca ese día.
- **Mañana / Tarde / Noche**: tarjetas grandes con dibujo. Al tocarlas se marcan con una ⭐ y la app dice en voz alta qué son. Al terminar una parte del día hay una pequeña celebración.
- **Zona de mayores** (rueda de arriba a la derecha, protegida con una multiplicación):
  - Semana: tipo de día y actividades de cada parte del día, ordenar, quitar, copiar a otros días.
  - Actividades: cambiar dibujo y nombre, o crear nuevas.
  - Fechas especiales: cumpleaños, excursiones, festivos (un festivo puede usar la rutina de otro día).
  - Ajustes: nombre para el saludo, voz y sonidos, horas de tarde y noche.

Todo se guarda en el propio iPad (localStorage). No se envía nada a ningún sitio.

## Probarla en el Mac

```sh
python3 -m http.server 8642
```

y abrir <http://localhost:8642>.

## Instalarla en el iPad

1. Publicar esta carpeta en un sitio con HTTPS (por ejemplo, GitHub Pages).
2. En el iPad, abrir la dirección con **Safari** › botón compartir › **Añadir a pantalla de inicio**.
3. Abrirla una vez con conexión: a partir de ahí funciona sin internet.
4. Para que el peque no salga de la app: Ajustes › General › Accesibilidad › **Acceso guiado**, y con la app abierta pulsar tres veces el botón de inicio.

## Estructura

- `index.html`, `styles.css`, `app.js`: la app, sin dependencias ni compilación.
- `sw.js`: guarda la app para usarla sin conexión. Subir `CACHE` si cambia la lista de ficheros.
- `fonts/`: Nunito (Google Fonts, licencia OFL) para que funcione sin internet.
- `icons/`: icono de la pantalla de inicio.

Compatibilidad con iOS 12: nada de `?.`, `??`, `gap` en flex, `inset`, `clamp()` ni emojis posteriores a Emoji 11.
