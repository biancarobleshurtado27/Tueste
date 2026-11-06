# Tueste · Parte 2: requisitos y solución propuesta

Estado: etapa 1, análisis y diseño. Propuesta pendiente de implementar y probar.
Fuente: Caso A - Tueste (Parte 2), 7 páginas; datos de adquisición de Parte 1.

## Objetivo y alcance
Rediseñar «Regala una bolsa» para adquirir clientes por referidos con recompensas de hasta $25 por nuevo cliente. Añadir al proyecto existente un módulo móvil de referidos. Conservar calculadora, tablero y simulador de Parte 1. No construir pagos reales, campañas automáticas ni un comercio completo.

## Diagnóstico numérico
Por cada 1.000 primeras compras:
- Correo recibido -> abierto: 350/1.000 = 35%; pérdida 65% (650 personas).
- Correo abierto -> página: 120/350 = 34,29%; pérdida 65,71% (230 personas).
- Página -> personas que invitan: 100/120 = 83,33%; pérdida 16,67%.
- 100 personas envían 300 invitaciones: 3 invitaciones por persona. Es un cambio de unidad, no una conversión de 300%.
- Invitaciones -> aperturas de tienda: 150/300 = 50%.
- Aperturas -> compras: 60/150 = 40%; pérdida 60%.
- Invitaciones -> compras: 60/300 = 20%.
- Resultado: 60 compradores referidos por 1.000 compradores iniciales = 6 por cada 100.
- Aviso: 70% de quienes invitaron desconoce su saldo según encuesta. No conocemos su tamaño ni podemos convertirlo en una etapa de compra o sumar esas personas al abandono.
Mayor pérdida proporcional medible: abierto -> página, 65,71%. Mayor pérdida absoluta: recepción -> apertura, 650. No confundir ambos criterios.

## Regla de dinero
CAC Meta hoy = ($4.000 + $1.000 agencia)/100 = $50.
Tope de recompensas por cliente referido = $50/2 = $25.
Piloto $8+$8 = $16 por referido si ambas recompensas se pagan; cumple el tope pero tiene problemas de experiencia. No decir que falla por exceder el presupuesto.
No confundir costo de recompensa con CAC total: operación, desarrollo u otros costos no están cuantificados.

## Propuesta sencilla de recompensas (supuesto de diseño)
- Amigo nuevo que compra: muestra de 100 g incluida en su pedido; costo $1,60.
- Quien invita: crédito de $5 cuando el amigo completa una compra elegible; costo nominal $5.
- Al tercer amigo que compra: una bolsa de 340 g adicional en el próximo pedido de quien invita; costo $5,44; una vez por ciclo de 3 compradores distintos.
- Si un amigo inicia una suscripción pagada: una muestra de 100 g adicional para quien invita en su próximo pedido; costo $1,60, una vez por ese amigo. Se entrega dentro de un pedido; no genera envío aparte.
- No sumar dos recompensas base por el mismo comprador. Regalos y crédito pendientes se muestran hasta su canje. Contar compradores nuevos únicos, no clics ni invitaciones.
- Cada ciclo de 3 compradores se reinicia después de entregar su premio. En el prototipo mostrar 0/3, 1/3, 2/3 y premio obtenido.
Costo base: $6,60 por referido. Incluyendo bonus de suscripción y asignando todo el premio de tercer amigo al referido que lo dispara: $1,60+$5+$5,44+$1,60 = $13,64, menor a $25. Con prorrateo del premio entre 3: máximo promedio $10,0133 por cliente. Mostrar costo conservador de todas las recompensas aunque el crédito todavía no se canjee.
Costos originales: descuento cuesta su valor nominal; muestra 100 g $1,60; bolsa 340 g $5,44. Un mes gratis no cuesta solo café: se dejan de cobrar $30,60 y se pagan $16,58 de café, envío y caja. No se ofrece en esta propuesta.

## Momento y recorrido
Invitar después de recibir y probar el café. Propuesta: día 5 desde compra, condicionada a entrega confirmada y confirmación del cliente de que lo probó; el día 5 es supuesto, no dato del caso. Sin automatizar envíos reales en el prototipo.
Recorrido: cliente satisfecho -> enlace personal y mensaje -> WhatsApp -> amigo abre oferta con regalo aplicado -> compra simulada -> aviso y recompensa -> progreso -> amigo recibe y prueba -> nueva invitación.
Café 340 g: 22 tazas. No incentivar consumo artificial ni más café acumulado. La muestra permite probar sin obligar a otra suscripción.

## Requerimientos funcionales
| ID | Requisito | Criterio de aceptación |
|---|---|---|
| RF-01 | Entrada después de probar | Simular entrega y confirmación de prueba antes de mostrar invitación |
| RF-02 | Enlace personal | Abrir WhatsApp con mensaje y URL; alternativa para copiar enlace; envío final lo hace el usuario |
| RF-03 | Página del amigo | Identificar quién invita y muestra de regalo aplicada, sin escribir código |
| RF-04 | Pedido sencillo | Elegir pedido normal o suscripción y completar compra claramente simulada |
| RF-05 | Recompensas de ambos lados | Desglosar regalo del amigo, crédito y premios del invitador |
| RF-06 | Progreso por niveles | Contar 3 compradores distintos; solo acreditar cada pedido una vez |
| RF-07 | Aviso | Mostrar notificación simulada al completar compra y saldo actualizado |
| RF-08 | Ciclo | Amigo comprador puede recorrer la invitación después de simular entrega y prueba |
| RF-09 | Panel Diego | Embudo histórico y escenario simulado separados; tasas con denominadores visibles |
| RF-10 | Control de costos | Cada combinación <=$25; desglosar costos nominales y regalos sin envío extra |
| RF-11 | Persistencia y reinicio | Recarga conserva demo; reiniciar requiere confirmación y no borra Parte 1 |

## Requisitos de experiencia y entrega
- 82% de visitas desde celular: diseño móvil, sin desplazamiento lateral de toda la página.
- Reutilizar identidad Origen y balance con títulos breves, botones claros y buen contraste.
- Nombres, pedidos, conversiones proyectadas y notificaciones de demostración llevan «simulado».
- Revisar ambas perspectivas con: ¿es para mí?, ¿hace lo que quiero?, ¿me importa ahora?, ¿sé cómo lograrlo?
- Mantener el recorrido corto y pedir datos mínimos. No solicitar datos de tarjeta reales.
- Prototipo completo, ficha de growth de una página en Google Docs o Sheets y demo de 3 minutos. Este .md complementa la ficha; no la reemplaza.

## Meta y experimento propuestos
Meta de diseño, no resultado observado: subir de 6 a 10 compradores referidos por cada 100 compradores iniciales.
Escenario ilustrativo por 1.000: 450 abren invitación, 200 entran, 160 invitan, 480 invitaciones, 240 aperturas del amigo, 100 compras. Tasas respectivas: 45%; 44,44%; 80%; 3 invitaciones/persona; 50%; 41,67%.
Métrica semanal: nuevos compradores referidos únicos por 100 compradores iniciales elegibles, con ventana de atribución de 30 días propuesta. Separar cohortes aún inmaduras; no mezclar tasas de una semana con resultados de otra.
A/B: asignar compradores iniciales aleatoriamente 50/50 a piloto y rediseño. Comparar cohortes con la misma ventana. Hipótesis: momento posterior a prueba, enlace y regalo aplicado elevan de 6 a 10 los referidos por 100. Sin tamaño de muestra ni significancia inventados.
Contramétricas: costo conservador de recompensas <=$25 por referido; contribución del primer pedido después de recompensa del amigo no negativa; devoluciones y cancelaciones no empeoran respecto al control (medir, sin inventar base). Evitar duplicados y autorreferidos en demo.
Si falla: identificar paso que no mejora, entrevistar usuarios, ajustar mensaje/momento y repetir antes de escalar.

## Plan y matriz de canales de 90 días (propuesta)
Ejes propuestos: control del canal (propio/externo) y modo de crecimiento (pagado/relacional). No se presenta como matriz oficial del curso.
| | Propio | Externo |
|---|---|---|
| Pagado | Beneficios financiados del programa, dentro del tope | Meta: mantener $4.000 como base de prueba; no escalar por anticipado |
| Relacional | Página de referidos, experiencia postentrega, saldo y avisos | Recomendación por WhatsApp y fotos espontáneas, con consentimiento |
Días 1–30: construir y validar recorrido; instrumentar y lanzar piloto. Días 31–60: observar cohortes y corregir fricción/costos. Días 61–90: ampliar solo si mejora la métrica y respeta contramétricas. No prometer viralidad: el ciclo permite repetición, pero 0,10 referido por comprador no es crecimiento autosostenido.

## Etapas de implementación
1. Documentación y requisitos (este documento).
2. Vista del invitador y enlace personal funcional.
3. Vista del amigo y compra simulada.
4. Recompensas, notificación y progreso sin duplicados.
5. Panel Diego, experimento, ficha y demo.
Después de cada etapa: prueba pertinente, commit y push a main. No modificar cambios ajenos pendientes.

## Registro honesto de IA
- Se analizó inicialmente Agendo porque se adjuntó ese PDF por error; se sustituyó el análisis por el de Tueste al recibir el archivo correcto. Fue una confusión de documento, no un error matemático ni una falla del programa.
- Riesgos a vigilar: mezclar invitadores con invitaciones, tratar objetivos como datos observados y atribuir un envío gratis a una recompensa que requiere envío independiente.

## Pendientes
Confirmar recompensas y objetivo con el usuario. Verificar formato de matriz usado en clase si se exige uno específico. Probar con otra persona desde celular antes de entregar. La ficha Google y la implementación no están hechas en esta etapa.

## Implementación funcional · 6 de noviembre de 2026
Se completó en los mismos archivos del proyecto: App.jsx, styles.css y modelo compartido. No se movieron archivos. Referidos es un prototipo local: no procesa pagos, no envía mensajes y no usa SQLite para compartir identidades entre equipos.
Funciones: confirmar entrega/prueba; preparar WhatsApp, copiar enlace y registrar envío simulado; página del amigo con regalo; compra normal o suscripción simulada; comprador nuevo por correo ficticio; notificación; saldo; ciclos de tres; bonus suscripción; canje en siguiente pedido simulado; nuevo comprador continúa el ciclo; panel con histórico, actividad simulada, objetivo y experimento; reinicio solo de referidos.
La invitación desconocida o de cliente sin prueba confirmada no permite comprar. Se distingue preparar un mensaje de haberlo enviado. La prueba de identidad por correo es limitada a una demo, no protección antifraude real. Los enlaces son locales y los datos se comparten solo entre pestañas del mismo navegador/origen.
Pruebas realizadas: compilación; regresión Parte 1; reglas de seis compras y dos ciclos; máximo $13,64; duplicados y autorreferidos; canje. Navegador aislado con viewport móvil 390x844: tres compras, una suscripción, bolsa y muestra de premio, persistencia después de recarga, rechazo de correo repetido, canje a saldo cero y panel con tres compradores. Sin errores JavaScript en ese recorrido. Primer intento del test falló por texto esperado incompleto; se comprobó el texto real y se repitió el recorrido exitosamente.

## Cuatro preguntas del cliente
| Perspectiva | ¿Es para mí? | ¿Hace lo que quiero? | ¿Me importa ahora? | ¿Sé cómo lograrlo? |
|---|---|---|---|---|
| Quien invita | Cliente que ya recibió y probó Tueste | Comparte un regalo y ve sus recompensas | Regala una primera prueba después de disfrutarlo | Confirmar prueba, compartir, consultar progreso |
| Amigo | Invitación con nombre del cliente | Muestra ya aplicada al pedido | Beneficio en la primera compra | Elegir pedido y confirmar compra simulada |
| Recompensa | Cuenta del invitador | Crédito y regalos desglosados | Notificación al comprar el amigo | Consultar saldo y simular canje |

## Pendientes reales de entrega
Revisión por otra persona desde celular. Pulido visual posterior. Ficha de growth de una página en Google Docs o Sheets (este documento todavía no la sustituye). El prototipo es local y simulado; no prometer un sistema de referidos productivo o enlaces públicos. Si se exige una matriz con ejes del curso, confirmar esos ejes antes de entregar.

## Dirección visual combinada · noviembre 2026
Referencias aportadas: Cherrybeam Coffee (verde mineral, papel, cobre y detalles orbitales), observatorio Three Body (composición editorial, líneas finas y metadatos) y Fernwork (Inter, contraste entre pesos 200 y 600, espacio y jerarquía). Se adaptan a Tueste: no se importan marcas, métricas ficticias, escenarios alienígenas ni una simulación de gravedad.
Tipografía: Inter 200/300/400/500/600 desde Google Fonts, con alternativa sans-serif si falla internet. Contenido y lógica de Tueste conservados. No se agrega Tailwind CDN ni Three.js a la aplicación React porque no aportan al recorrido del caso. Los adornos son SVG locales y no bloquean los controles. Movimiento mínimo con respeto a reducción de movimiento. La invitación, compra, recompensas y panel siguen siendo las funciones centrales.

## Animaciones
Entradas escalonadas, aparición al desplazarse, flotación y órbita SVG, respuesta leve al puntero, transiciones de botones y avisos. Incluye Pausar movimiento y respeta prefers-reduced-motion. Sin loader ni esperas obligatorias. Verificado en navegador móvil: animación activa, pausa, preferencia reducida, compra y crédito, sin errores JS ni desbordamiento global.

## Portada e inicio de sesión de demostración
Entrada pública con explicación de la empresa, seis productores y orígenes, producto y programa de referidos. Botones llevan a acceso de ejemplo como cliente o Diego. No es autenticación real: no hay contraseñas ni permisos restringidos. Sesión en sessionStorage, salida al inicio y recarga comprobadas. Los enlaces del amigo mantienen acceso directo a su invitación. Probado en navegador: portada, ambos perfiles, recarga, salida y móvil sin desbordamiento ni errores JS. Alcance adicional solicitado por el usuario; pendiente confirmar si requiere cuentas reales.
