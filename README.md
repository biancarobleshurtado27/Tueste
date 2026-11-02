# Caso A - Tueste: Sistema de Decisiones (Nivel 1 y Nivel 2)

## Archivos en el Repositorio

1. **[`Tueste_Tablero.html`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/Tueste_Tablero.html)**: **Nivel 2 — Tablero Interactivo de Decisiones** en un único archivo autocontenido (`HTML + CSS + JS` con `Chart.js` vía CDN). Se abre directamente con doble clic en cualquier navegador sin instalar dependencias ni servidor.
2. **[`Tueste_Nivel1_Sistema_Decisiones.xlsx`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/Tueste_Nivel1_Sistema_Decisiones.xlsx)**: **Nivel 1 — Sistema en Excel `.xlsx`** con las 6 pestañas del Nivel 1, fórmulas vinculadas sin cifras estáticas contradictorias, validación de rango `$0–$20.000` en inversiones de Meta, protección contra errores cuando la inversión es `$0`, controles de CAC marginal separados y gráfico de líneas nativo (`Mes 0` a `Mes 12`, excluyendo la fila de totales).
3. **[`Tueste_Nivel1_Sistema_Decisiones_v1_anterior.xlsx`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/Tueste_Nivel1_Sistema_Decisiones_v1_anterior.xlsx)**: Copia conservada de la primera versión para trazabilidad.
4. **Carpeta [`sheets/`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets)**: Las 6 pestañas sincronizadas en formato `.tsv` ([`01_Inicio.tsv`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets/01_Inicio.tsv) a [`06_Recomendacion.tsv`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets/06_Recomendacion.tsv)).

---

## Los 12 Controles Independientes en `Verificación` (Separados y Vinculados)

| # | Control Independiente | Valor de Referencia | Celda en `.xlsx` | Valor Calculado |
| :- | :--- | :--- | :--- | :--- |
| 1 | Contribución pedido suelto (2 bolsas, \$34) | `$15,89` | `Supuestos!B56` | **`$15,89`** |
| 2 | Contribución suscripción mensual (2 bolsas, \$30,60) | `$12,643` | `Supuestos!B60` | **`$12,643`** |
| 3 | Contribución 1er pedido suelto con 30% desc. BF | `$6,149` | `Supuestos!B65` | **`$6,149`** |
| 4 | Contribución Pack de 3 bolsas (\$48) | `$23,62` | `Supuestos!B68` | **`$23,62`** |
| 5 | CAC real actual (\$9.000 / 165) | `$54,5454545...` | `Calculadora!B18` | **`$54,5455`** |
| 6 | Suma de actividad del suscriptor (meses 1 a 12) | `7,528050139848837` | `Supuestos!C52` | **`7,528050139848837`** |
| 7 | LTV promedio actual a 12 meses (meses 1 a 12) | `$54,79607068771632` | `Calculadora!B22` | **`$54,79607068771632`** |
| 8 | Payback actual (meses discretos, Mes 0 = `-CAC`) | `Mes 12` | `Calculadora!B24` | **`12`** |
| 9 | CAC real a \$4.000 con agencia y Payback Cambio 1 Solo | `$50,00` y `Mes 11` | `Calculadora!D18` y `D24` | **`$50,00`** y **`11`** |
| 10 | CAC real propuesta agencia (\$17.000 / 235) | `$72,3404255...` | `Calculadora!C18` | **`$72,3404`** |
| 11 | CAC marginal del tramo histórico \$8.000 a \$12.000 | `$4.000 / 45` | `Supuestos!E35` | **`$88,8889`** |
| 12 | CAC incremental de \$8.000 a \$16.000 | `$8.000 / 70` | `Calculadora!C26` | **`$114,2857`** |
