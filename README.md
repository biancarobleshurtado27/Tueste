# Caso A - Tueste: Sistema de Decisiones (React + Vite, Express y SQLite + Respaldo HTML y Excel)

## Estructura del Proyecto

1. **[`shared/tuesteModel.js`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/shared/tuesteModel.js)**: **Módulo Matemático y de Validación Compartido** entre el frontend React y el backend Express. Contiene todas las fórmulas sin redondeos intermedios (economía unitaria, interpolación de Meta Ads, curva de contribución acumulada Mes 0 a Mes 12, LTV, Payback y Simulador de Caja de 24 Meses con seguimiento de cohortes por edad 1 a 24).
2. **[`server/app.js`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/server/app.js) y [`server/db.js`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/server/db.js)**: **Backend Node.js + Express con SQLite Local** (`node:sqlite` con consultas parametrizadas `?`). Recalcula siempre en el servidor usando `shared/tuesteModel.js` y almacena escenarios propios en **`data/tueste.sqlite`**.
3. **[`src/`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/src/App.jsx)**: **Frontend React + Vite** organizado en tres secciones (**1. Calculadora**, **2. Tablero de decisiones**, **3. Simulador de caja de 24 meses**) más el panel de persistencia SQLite (**Guardar, Cargar, Duplicar, Actualizar y Eliminar con confirmación**, con soporte de cálculo local si el backend no está disponible).
4. **[`Tueste_Tablero.html`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/Tueste_Tablero.html)**: **Respaldo HTML estático autocontenido** conservado intacto.
5. **[`Tueste_Nivel1_Sistema_Decisiones.xlsx`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/Tueste_Nivel1_Sistema_Decisiones.xlsx)**: **Nivel 1 — Sistema en Excel `.xlsx`** con las 6 pestañas originales.

---

## Cómo Iniciar el Backend y el Frontend (Uso Local)

1. **Instalar dependencias (primera vez):**
   ```powershell
   npm install
   ```
2. **Iniciar el Backend (Node.js + Express + SQLite en `http://127.0.0.1:3001`):**
   ```powershell
   npm run server
   ```
   - La base de datos SQLite local se crea y guarda automáticamente en:
     `c:\Users\NVGWf\OneDrive\Documents\Programacion\BackEnd\semana3\10-30\Tueste\data\tueste.sqlite`
3. **Iniciar el Frontend (React + Vite en `http://127.0.0.1:5173`):**
   En otra terminal:
   ```powershell
   npm run dev
   ```
   Abre `http://127.0.0.1:5173` en el navegador.

---

## Scripts de Verificación Automatizada

- `npm run test:model` (`node shared/verifySharedModel.js`): Verifica los resultados exactos del módulo compartido (Escenario actual, Meta `$4.000`, Agencia, Simulador 24M Base `$8.000`, `$4.000` sin cambios, `$4.000` con Pack y Agencia) y las validaciones de rango.
- `npm run test:backend` (`node server/verifyBackend.js`): Verifica los endpoints REST, consultas parametrizadas SQLite, rechazo `400` de entradas inválidas, guardado de planes inviables que rompen el piso de `$5.000`, protección `403` de referencias originales y persistencia tras reinicio del servidor.
