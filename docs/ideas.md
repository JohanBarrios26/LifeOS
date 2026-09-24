# Ideas diferenciadoras para LIFEOS

> Lluvia de ideas del 23 de septiembre de 2026, a partir de una revisión rápida de apps de finanzas, registro de vida, hábitos y parejas. Que no encontráramos algo **no garantiza que no exista**: antes de construir una idea, vale la pena investigarla más a fondo.

## Punto de partida

Como app **solo de finanzas**, LIFEOS no se diferencia: ese mercado está lleno (YNAB, Monarch, Copilot, Wallet, Monefy, Fintonic), e incluso las apps privadas que guardan los datos en el dispositivo ya existen (Actual Budget y otras).

Muchas ideas llamativas ya existen, pero **sueltas, cada una en su propia app**:

| Idea | ¿Ya existe? |
| --- | --- |
| Ver cuántas horas de trabajo cuesta una compra | Sí: TimeWasted, Wagely, BuyBye |
| La vida en semanas (una cuadrícula) | Sí: Life Weeks, loggd.life |
| Encontrar relaciones entre datos personales | Sí, pero solo salud y ánimo: Exist, Bearable |
| Recuerdos y fotos en pareja | Sí: Between, sin dinero ni metas |
| Simulador para salir de deudas | Sí, como calculadoras sueltas sin datos reales |
| Tablero con varias áreas de la vida | Poco: Xenith, o plantillas de Notion hechas a mano |

**La oportunidad de LIFEOS:** conectar las áreas de la vida con hechos reales, durante años, en español, con contexto colombiano y sin poner notas a la persona.

## Ideas

### 1. Registrar en 5 segundos, escribiendo como se habla

> *"almuerzo 25 mil con la nu"* → gasto, $25.000, Tarjeta Nu, categoría Comida.

La idea menos llamativa y la más importante: las apps de registro manual suelen morir porque registrar cansa. Sin poca fricción, las demás ideas no sirven.

- **Estado:** ✅ hecha (septiembre de 2026). Entiende montos colombianos ("25 mil", "25k", "1,5 millones", "30 lucas", "2 palos"), fechas ("ayer", "antier"), cuentas por nombre o tipo, categorías por palabras clave, ingresos, pagos de deuda y ahorro. Muestra lo que entendió antes de guardar.
- **Siguiente paso posible:** aprender de las correcciones de la persona (si siempre cambia "Transporte" por "Gasolina", sugerirlo).

### 2. "Fecha de libertad" de deudas, que se mueve con cada abono

> *"Si sigues así, terminas de pagar la Nu en marzo de 2027. Tu abono de ayer la adelantó 12 días."*

Proyección con los pagos reales de la persona, comparando las estrategias **bola de nieve** (primero la deuda más pequeña) y **avalancha** (primero la de mayor interés).

- **Estado:** pendiente.
- **Cuidado:** es una **proyección**, no un hecho. Debe mostrarse como estimado y nunca guardarse como dato.

### 3. Pensada para Colombia

- **Prima** de junio y diciembre, y **cesantías**: planear desde antes a qué se destinan.
- **4x1000 (GMF):** *"este año pagaste $87.000 en 4x1000"*, con las cuentas exentas marcadas.
- **Tasa de usura** mensual y cuota de manejo de las tarjetas.

- **Estado:** pendiente.

### 4. El costo de una compra en días de una meta

> *"Lo que gastaste en domicilios este mes retrasó tu meta de ahorro 9 días."*

A diferencia de las apps de "horas de trabajo", mide el impacto en **las metas propias** de la persona.

- **Estado:** pendiente. Requiere el módulo de objetivos.

### 5. Momentos que conectan dinero, personas y recuerdos

> *"En 2026 compartiste 23 salidas con tu esposa. Las experiencias fueron el 12 % de tus gastos y 8 de tus 10 momentos favoritos del año."*

Las apps de pareja no conocen el dinero, y las de finanzas no conocen los recuerdos. **Sin ponerle nota a la relación.**

- **Estado:** pendiente. Requiere el módulo de momentos (con `linkedExpenseIds`).

### 6. "Tu año en LIFEOS" (como el Spotify Wrapped de la vida)

Cada diciembre: cuánto bajó la deuda, horas de estudio, kilómetros caminados, momentos, el mes de más ahorro… con datos reales de todas las áreas. Privado; la persona decide qué compartir.

- **Estado:** pendiente.

### 7. Cápsula del tiempo con datos

> Hoy: *"Quiero salir de la deuda de Nu y estudiar inglés"*. En un año, LIFEOS lo muestra junto a los números reales: *"Deuda de Nu: $0. Inglés: 142 horas."*

- **Estado:** pendiente.

### 8. Pregúntale a tu vida, con pruebas

> *"¿Cuánto gasté en comida en los últimos tres meses?"* → la respuesta **y la lista de registros exactos** que la respaldan.

Toda respuesta muestra su evidencia, para poder confiar en ella. La IA solo trabaja con los datos autorizados por la persona.

- **Estado:** pendiente (Fase 7).

### 9. Relaciones entre áreas, con humildad

> *"Las semanas en que estudiaste más de 5 horas, gastaste 30 % menos en domicilios."*

Se presentan como **patrones observados, nunca como causas**.

- **Estado:** pendiente. Necesita meses de datos en varias áreas.

### 10. El anuario de la vida

Un PDF cada año con momentos, fotos, metas cumplidas y números, para imprimir y guardar en familia.

- **Estado:** pendiente. Puede reutilizar la exportación a PDF del reporte mensual.

## Prioridad sugerida

1. **Cero fricción** (idea 1): sin eso, nada más importa.
2. **Conectar las áreas** (ideas 4, 5, 6 y 9): lo que casi nadie hace.
3. **Contexto colombiano** (idea 3): ventaja frente a las apps globales.

Antes de todo: **usar LIFEOS varios meses con datos reales.** La idea que más marque la diferencia probablemente saldrá del uso diario.

## Fuentes consultadas

- [Best Life Dashboard Apps in 2026 — Xenith](https://xenith.life/articles/best-life-dashboard-apps)
- [9 Best Personal Analytics Apps for 2026](https://worklifebalance.app/best-personal-analytics-apps/)
- [Monarch vs Copilot vs YNAB (2026) — era.app](https://era.app/articles/era-vs-monarch-vs-copilot-vs-ynab/)
- [The Best Budget Apps for 2026 — NerdWallet](https://www.nerdwallet.com/finance/learn/best-budget-apps)
- [Las 7 mejores apps para controlar gastos en Colombia (2026) — Kuanto](https://kuanto.co/blog/apps-controlar-gastos-colombia/)
- [Mejor app de finanzas personales en Colombia (2026) — Gestiona Plus](https://gestionaplus.com.co/blog/mejor-app-de-finanzas-personales-colombia-2026)
- [TimeWasted — horas de trabajo por compra](https://timewasted.app/)
- [Life in Weeks](https://lifeweeks.app/) y [loggd.life](https://loggd.life/tools/life-in-weeks)
- [Best Couple Apps 2026 — Habi](https://habi.app/insights/best-couple-apps/)
- [Método bola de nieve — BBVA Colombia](https://www.bbva.com.co/personas/blog/educacion-financiera/tarjetas/metodo-bola-de-nieve.html)
- [Best Privacy-First Personal Finance Apps (2026) — Thrust](https://thrust.finance/learn/best-privacy-first-personal-finance-apps-2026/)
