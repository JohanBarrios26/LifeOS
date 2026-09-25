/**
 * Step-by-step checks for people testing LIFEOS. They build on each other: done in order,
 * starting from an empty LIFEOS, the expected numbers match exactly.
 */

export interface Scenario {
  id: string;
  title: string;
  steps: string[];
  expected: string;
}

export interface ScenarioGroup {
  title: string;
  scenarios: Scenario[];
}

export const SCENARIO_GROUPS: ScenarioGroup[] = [
  {
    title: "Primeros pasos",
    scenarios: [
      {
        id: "welcome",
        title: "Bienvenida",
        steps: ["Abre LIFEOS en Inicio.", "Escribe cómo quieres que te llamen y toca “Continuar”."],
        expected: "Te saluda con tu nombre: “Hola, … 👋”.",
      },
      {
        id: "debit-account",
        title: "Crear una cuenta",
        steps: ["Tipo: Débito. Nombre: “Mi débito”.", "¿Cuánto dinero tiene hoy?: 1.000.000.", "Toca “Guardar cuenta”."],
        expected: "Disponible: $ 1.000.000.",
      },
      {
        id: "credit-card",
        title: "Crear una tarjeta de crédito",
        steps: [
          "Toca “+ Cuenta”.",
          "Tipo: Tarjeta de crédito. Nombre: “Mi tarjeta”.",
          "¿Cuánto debes hoy?: 500.000. Guarda.",
        ],
        expected: "Deuda total: $ 500.000. El disponible sigue en $ 1.000.000.",
      },
    ],
  },
  {
    title: "Registro rápido",
    scenarios: [
      {
        id: "quick-expense",
        title: "Un gasto con la tarjeta",
        steps: ["En la caja de arriba escribe: almuerzo 25 mil con la tarjeta", "Toca “Listo”, revisa lo que entendió y toca “Guardar”."],
        expected:
          "Entendió: Gasto, $ 25.000, sale de Mi tarjeta, categoría Comida. Deuda total: $ 525.000. El disponible no cambia (la compra fue con tarjeta).",
      },
      {
        id: "quick-income",
        title: "Un ingreso",
        steps: ["Escribe: salario 2 millones", "Toca “Listo” y “Guardar”."],
        expected: "Entendió un Ingreso de $ 2.000.000. Disponible: $ 3.000.000.",
      },
      {
        id: "quick-payment",
        title: "Un pago a la tarjeta",
        steps: ["Escribe: pago tarjeta 200 mil", "Toca “Listo” y “Guardar”."],
        expected: "Entendió un Pago de deuda de Mi débito a Mi tarjeta. Disponible: $ 2.800.000. Deuda total: $ 325.000.",
      },
      {
        id: "quick-missing",
        title: "Algo que no entiende",
        steps: ["Escribe solo: taxi", "Toca “Listo”."],
        expected: "Te dice que falta el monto y ofrece “Completar”, que abre el formulario con lo que sí entendió.",
      },
    ],
  },
  {
    title: "Corregir errores",
    scenarios: [
      {
        id: "edit",
        title: "Editar un movimiento",
        steps: ["En “Movimientos recientes” toca “Almuerzo”.", "Cambia el monto a 30.000 y toca “Guardar cambios”."],
        expected: "Deuda total: $ 330.000.",
      },
      {
        id: "delete-undo",
        title: "Eliminar y deshacer",
        steps: ["Abre “Almuerzo” otra vez y toca “Eliminar movimiento”.", "Revisa la deuda y luego toca “Deshacer” en el aviso de arriba."],
        expected: "Al eliminar, la deuda baja a $ 300.000. Al deshacer, vuelve a $ 330.000.",
      },
    ],
  },
  {
    title: "Reportes y copias",
    scenarios: [
      {
        id: "report",
        title: "Reporte del mes",
        steps: ["Ve a “Reporte” en el menú de arriba."],
        expected:
          "Ingresos $ 2.000.000, Gastos $ 30.000, Pagos a deudas $ 200.000. El pago de la tarjeta no cuenta como gasto (la compra ya se contó).",
      },
      {
        id: "downloads",
        title: "Descargar Excel y PDF",
        steps: ["En el reporte toca “Excel” y luego “PDF”.", "Abre los dos archivos."],
        expected: "Los números de los archivos coinciden con los de la pantalla.",
      },
      {
        id: "backup",
        title: "Copia de seguridad",
        steps: [
          "En Inicio, al final, toca “Descargar copia”.",
          "Opcional: en otro navegador abre LIFEOS y usa “Importar copia” con ese archivo.",
        ],
        expected: "Se descarga un archivo. Al importarlo en otro navegador aparecen tus cuentas, movimientos y tu nombre.",
      },
    ],
  },
  {
    title: "En tu celular",
    scenarios: [
      {
        id: "install",
        title: "Instalarla como app",
        steps: [
          "Android: en Inicio toca “Instalar LIFEOS” (o en Chrome: menú ⋮ → “Instalar app”). No uses el botón de descarga ⬇.",
          "iPhone (Safari): botón compartir → “Agregar a inicio”.",
          "Ábrela desde el ícono.",
        ],
        expected: "Aparece el ícono de LIFEOS y se abre sin la barra del navegador.",
      },
      {
        id: "real-use",
        title: "Usarla de verdad",
        steps: ["Registra tus gastos reales durante unos días."],
        expected: "Anota aquí lo que te confunda, te falte o te guste.",
      },
    ],
  },
];

export const ALL_SCENARIOS: Scenario[] = SCENARIO_GROUPS.flatMap((group) => group.scenarios);

export const OPEN_QUESTIONS = [
  { id: "confusing", label: "¿Qué fue lo más confuso?" },
  { id: "missing", label: "¿Qué le falta para que la uses todos los días?" },
  { id: "other", label: "¿Algo más que quieras contarle al creador?" },
];
