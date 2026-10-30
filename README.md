# Caso A - Tueste: Sistema de Decisiones (Nivel 1 — Excel `.xlsx` y Google Sheets)

## Archivo Principal Entregado

- **[`Tueste_Nivel1_Sistema_Decisiones.xlsx`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/Tueste_Nivel1_Sistema_Decisiones.xlsx)**: Libro Excel OpenXML estándar (sin macros ni complementos externos) listo para subir y abrir directamente en **Google Sheets** (`Archivo > Importar > Subir`) o en Microsoft Excel.

## Las 6 Pestañas Incluidas en el `.xlsx` (y en [`sheets/`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets))

1. **`Inicio`** ([`sheets/01_Inicio.tsv`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets/01_Inicio.tsv)): Resumen ejecutivo de la decisión e indicadores principales vinculados por fórmula a `Calculadora`.
2. **`Supuestos`** ([`sheets/02_Supuestos.tsv`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets/02_Supuestos.tsv)):
   - **Entradas editables (color azul claro `#CFE2F3`):** Precios, costos unitarios, comisión de pasarela, mezcla de clientes, fee de agencia, presupuestos de Meta Ads, tabla histórica de Meta Ads (`(0,0)`, `$4.000`, `$8.000`, `$16.000`) y curva mensual de actividad/retención (`Mes 0` a `Mes 12`).
   - **Resultados unitarios derivados (color amarillo claro `#FFF2CC`):** Fórmulas vinculadas (`B46:B64`) para contribución en `$` y `%`, ROAS de equilibrio y LTV por tipo de cliente.
3. **`Calculadora`** ([`sheets/03_Calculadora.tsv`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets/03_Calculadora.tsv)): Comparación lado a lado con fórmulas dinámicas:
   - **Columna B:** Escenario Actual (`$8.000` Meta Ads).
   - **Columna C:** Propuesta Agencia (`$16.000` Meta Ads + `30%` descuento Black Friday solo en el 1er pedido suelto).
   - **Columna D:** Propuesta Propia — Cambio 1 por separado (Reducir Meta Ads a `$4.000`).
   - **Columna E:** Propuesta Propia Combinada — Cambio 1 + Cambio 2 (`$4.000` Meta Ads + Pack de 3 bolsas a `$48` con supuesto explícito de adopción en `Supuestos!B23`).
4. **`Curva del cliente`** ([`sheets/04_Curva_del_cliente.tsv`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets/04_Curva_del_cliente.tsv)): Desembolso inicial `-CAC real` en el momento 0 (`Fila 5`), contribución esperada mensual y acumulado neto desde `Mes 0` (`Fila 6`) hasta `Mes 12` (`Fila 18`), más la columna de `Línea Cero ($0)`.
5. **`Verificación`** ([`sheets/05_Verificacion.tsv`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets/05_Verificacion.tsv)): Controles numéricos verificados con fórmulas, desglose manual paso a paso, evaluación separada de sensibilidad del Pack de `$48` y registro real de limitaciones/errores evitados.
6. **`Recomendación`** ([`sheets/06_Recomendacion.tsv`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets/06_Recomendacion.tsv)): Memorando ejecutivo de 1 página para Diego con los dos cambios propuestos y sus efectos numéricos vinculados.

## Controles Numéricos Verificados

| Control de Referencia | Valor Objetivo | Celda en el `.xlsx` | Fórmula Exacta | Resultado Verificado |
| :--- | :--- | :--- | :--- | :--- |
| Contribución pedido suelto | `$15,89` | `Supuestos!B48` | `=B46-B47-B6-B7-B8` | **`$15,89`** |
| Contribución suscripción mensual | `$12,643` | `Supuestos!B53` | `=B51-B52-B12-B13-B14` | **`$12,643`** |
| CAC real actual | `$9.000 / 165` | `Calculadora!B16` | `=IF(OR(B2=0,B7=0),"No aplica",B4/B7)` | **`$54,5455`** |
| LTV promedio actual a 12 meses | `~$54,7961` | `Calculadora!B20` | `=Supuestos!$B$16*B18+Supuestos!$B$15*B19` | **`$54,7961`** |
| Payback actual (meses discretos) | `Mes 12` | `Calculadora!B22` | `=IF('Curva del cliente'!C18<0,"No recupera en 12 meses",COUNTIF('Curva del cliente'!C6:C18,"<0"))` | **`12`** |
