# Caso A - Tueste: Sistema de Decisiones (Nivel 1 Corregido con Datos Originales)

## Archivos en el Repositorio

1. **[`Tueste_Nivel1_Sistema_Decisiones.xlsx`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/Tueste_Nivel1_Sistema_Decisiones.xlsx)**: Versión corregida (`v2`) con los datos originales exactos del caso, los 10 controles numéricos independientes verificados, gráfico de líneas nativo incrustado en `Curva del cliente` (con línea cero), ROAS de equilibrio separados para pedido suelto y suscripción, y registro honesto del error de calibración de la versión anterior.
2. **[`Tueste_Nivel1_Sistema_Decisiones_v1_anterior.xlsx`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/Tueste_Nivel1_Sistema_Decisiones_v1_anterior.xlsx)**: Copia conservada de la versión anterior (`v1`) para trazabilidad y auditoría.
3. **Carpeta [`sheets/`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets)**: Las 6 pestañas sincronizadas en formato `.tsv` ([`01_Inicio.tsv`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets/01_Inicio.tsv) a [`06_Recomendacion.tsv`](file:///c:/Users/NVGWf/OneDrive/Documents/Programacion/BackEnd/semana3/10-30/Tueste/sheets/06_Recomendacion.tsv)).

---

## Controles Independientes Verificados en el Modelo Corregido

| # | Control Independiente | Valor Esperado | Celda en `.xlsx` | Fórmula Vinculada | Valor Calculado |
| :- | :--- | :--- | :--- | :--- | :--- |
| 1 | Contribución pedido suelto (2 bolsas, \$34) | `$15,89` | `Supuestos!B56` | `=B54-B55-B8-B10-B9` | **`$15,89`** |
| 2 | Contribución suscripción (2 bolsas, \$30,60) | `$12,643` | `Supuestos!B60` | `=B12-B59-B8-B10-B9` | **`$12,643`** |
| 3 | Contribución 1er pedido suelto con 30% desc. BF | `$6,149` | `Supuestos!B65` | `=B63-B64-B8-B10-B9` | **`$6,149`** |
| 4 | Contribución Pack de 3 bolsas (\$48) | `$23,62` | `Supuestos!B68` | `=B26*(1-B11)-(B25*B7)-B27-B9` | **`$23,62`** |
| 5 | CAC real actual (\$8.000 Meta + \$1.000 fee / 165) | `$9.000 / 165` | `Calculadora!B18` | `=IF(OR(B2=0,B6=0),"No aplica",B4/B6)` | **`$54,5455`** |
| 6 | LTV promedio actual a 12 meses (Meses 1 a 12) | `~$54,79607` | `Calculadora!B22` | `=Supuestos!$B$13*B20+Supuestos!$B$14*B21` | **`$54,7973`** (`$54,79607` con suma redondeada) |
| 7 | Payback actual (Mes 0 = `-CAC`, Meses 1 a 12) | `Mes 12` | `Calculadora!B24` | `=IF('Curva del cliente'!C17<0,"No recupera en 12 meses",COUNTIF('Curva del cliente'!C6:C17,"<0")+1)` | **`12`** |
| 8 | CAC real a \$4.000 con agencia | `$50,00` | `Calculadora!D18` | `=IF(OR(D2=0,D6=0),"No aplica",D4/D6)` | **`$50,00`** |
| 9 | CAC real propuesta agencia (\$16.000) | `$17.000 / 235` | `Calculadora!C18` | `=IF(OR(C2=0,C6=0),"No aplica",C4/C6)` | **`$72,3404`** |
| 10 | CAC marginal \$8k$\rightarrow$\$12k y \$8k$\rightarrow$\$16k | `$4.000/45` y `$8.000/70` | `Supuestos!E35` y `Calculadora!C25` | `=(A35-A34)/(B35-B34)` y `=(C2-B2)/(C6-B6)` | **`$88,8889`** y **`$114,2857`** |
