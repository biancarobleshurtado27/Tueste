# Caso A - Tueste: Sistema de Decisiones de Marketing, Precios y Caja

Aplicación local para analizar por qué vender más en anuncios no siempre deja más dinero en el banco, comparar escenarios comerciales a 12 meses y simular el flujo de caja a 24 meses.

---

## 1. Requisitos del Sistema (Para Ejecutar en Cualquier Equipo)

- **Node.js `>= 22.5.0`** (recomendado **Node.js 22 LTS** o **Node.js 24**).
  - El proyecto utiliza el módulo nativo `node:sqlite` integrado en Node.js desde la versión `22.5.0`, por lo que no requiere compiladores externos (`python`/`node-gyp`) ni servidores de base de datos externos.
  - Puedes comprobar tu versión con:
    ```bash
    node -v
    ```

---

## 2. Pasos para Iniciar la Aplicación desde Cero

1. **Abrir una terminal en la carpeta raíz del proyecto e instalar dependencias:**
   ```bash
   npm install
   ```

2. **Iniciar el servidor local de guardado (Backend en `http://127.0.0.1:3001`):**
   ```bash
   npm run server
   ```
   - La base de datos SQLite se crea y almacena automáticamente en la ruta relativa `./data/tueste.sqlite`.

3. **En una segunda terminal, iniciar la interfaz interactiva (Frontend en `http://127.0.0.1:5173`):**
   ```bash
   npm run dev
   ```

4. **Abrir en el navegador:**
   - Dirección local: `http://127.0.0.1:5173/`

---

## 3. Guía Breve de Demostración (Paso a Paso)

1. **Comparar escenarios (12 meses):**
   - Abre la pestaña **`1. Calculadora`** o **`2. Tablero de decisiones`**.
   - Usa la barra **Escenarios originales de referencia** para alternar entre **Actual (`$8.000`)**, **Agencia (`$16.000 + 30% BF`)**, **Cambio 1 (`$4.000`)**, **Cambio 2 (`Pack $48 + Envío`)** y **Combinado (`$4.000 + Pack/Envío`)**, o mueve los deslizadores para ver cómo cambian el **CAC real**, el **LTV a 12 meses** y el **mes de recuperación (Payback)**.
   - Revisa al final del Tablero la tabla **Escenarios Fijos de Referencia vs. Tu Escenario de Trabajo** y la distinción entre datos originales, supuestos comerciales (no garantizados) y resultados proyectados.

2. **Guardar un escenario propio:**
   - Haz clic en el botón superior **`📁 Mis escenarios · Guardar escenario`**.
   - En el bloque **Guardar escenario**, escribe un **Nombre** (por ejemplo, `Mi Propuesta Piloto`) y una **Nota** opcional, y pulsa **`💾 Guardar escenario`**.

3. **Recuperar, actualizar o eliminar un escenario guardado:**
   - Dentro del mismo panel **`Mis escenarios`**, ubica tu escenario en la tabla y pulsa **`Cargar`** para restaurar todas sus entradas en pantalla, **`Duplicar`** para crear una copia, o **`Eliminar`** (con confirmación previa).

4. **Revisar la caja de 24 meses:**
   - Abre la pestaña **`3. Simulador de caja de 24 meses`**.
   - Revisa la tabla comparativa con la **Caja Inicial Mes 0 (`$35.000,00`)**, el **Mínimo de Cierres Mensuales (Meses 1–24)**, la **Caja Final Mes 24** y el estado de validez según las reglas del caso (piso de `$5.000` y continuidad de inversión en meses 13–24).
   - Edita la inversión por etapas o mes a mes, inspecciona la tabla detallada de 24 meses, descarga el CSV o consulta el **Guion de Pitch de 2 minutos** adaptado automáticamente al plan elegido.

---

## 4. Estructura del Proyecto y Pruebas Automatizadas

- `./shared/tuesteModel.js`: Módulo matemático y de validación compartido entre navegador y servidor.
- `./server/app.js` y `./server/db.js`: Servidor Express local y persistencia en `./data/tueste.sqlite`.
- `./src/`: Interfaz React + Vite dividida en Calculadora, Tablero de decisiones, Simulador de 24 meses y panel desplegable `Mis escenarios`.
- `./Tueste_Tablero.html` y `./Tueste_Nivel1_Sistema_Decisiones.xlsx`: Respaldos estáticos y modelo Excel original conservados intactos.

### Comandos de verificación:
- `npm run test:model`: Verifica los cálculos del módulo compartido y validaciones de entrada.
- `npm run test:backend`: Verifica endpoints REST, persistencia SQLite tras reinicio y protección de escenarios originales.
- `npm run test:e2e`: Compila y verifica de extremo a extremo en navegador headless.
