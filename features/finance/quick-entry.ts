import { isDebtAccountType } from "@/domain/finance/accounts";
import type { Account, AccountType, CurrencyCode, LocalDate, Money, Transaction } from "@/domain/finance/types";
import type { TransactionInput } from "@/domain/finance/validation";
import { shiftDate } from "@/lib/dates";
import { currencyDigits } from "@/lib/format";

/**
 * Quick entry: turns a sentence like "almuerzo 25 mil con la nu" into a transaction draft.
 * It never saves anything: the person confirms the draft, and validateTransaction still applies.
 */

export interface QuickEntryContext {
  /** Open accounts the entry can use. */
  accounts: Account[];
  /** Past transactions, used to guess the usual account when the text does not name one. */
  transactions: Transaction[];
  currency: CurrencyCode;
  today: LocalDate;
}

export interface QuickEntryDraft {
  input: TransactionInput;
  /** Accounts chosen by LIFEOS because the text did not mention them. */
  guessed: { source: boolean; destination: boolean };
}

const AMOUNT_SUFFIXES: Record<string, number> = {
  k: 1_000,
  mil: 1_000,
  luca: 1_000,
  lucas: 1_000,
  m: 1_000_000,
  millon: 1_000_000,
  millones: 1_000_000,
  palo: 1_000_000,
  palos: 1_000_000,
};
const DATE_WORDS: Record<string, number> = { hoy: 0, ayer: -1, antier: -2, anteayer: -2 };

const INCOME_CATEGORIES: Record<string, string | undefined> = {
  salario: "Salario",
  sueldo: "Salario",
  nomina: "Salario",
  quincena: "Salario",
  prima: "Prima",
  cesantias: "Cesantías",
  venta: "Ventas",
  vendi: "Ventas",
  honorarios: "Honorarios",
  ingreso: undefined,
  recibi: undefined,
  pagaron: undefined,
};
const PAYMENT_WORDS = new Set(["pago", "pague", "pagar", "abono", "abone", "abonar"]);
const SAVING_WORDS = new Set(["ahorro", "ahorre", "ahorrar"]);

const EXPENSE_CATEGORIES: Record<string, string> = Object.fromEntries(
  Object.entries({
    Comida: "almuerzo desayuno cena comida restaurante domicilio domicilios rappi cafe tinto onces empanada hamburguesa pizza helado",
    Mercado: "mercado supermercado exito d1 ara carulla olimpica jumbo tienda fruver",
    Transporte: "taxi uber didi indriver bus buseta transmilenio sitp metro gasolina tanqueo parqueadero peaje pasaje",
    Hogar: "arriendo administracion aseo",
    Servicios: "luz agua gas internet celular plan netflix spotify disney recarga servicios",
    Salud: "drogueria farmacia medico cita medicamento medicamentos gimnasio gym eps",
    Ropa: "ropa zapatos camisa pantalon tenis chaqueta vestido",
    Educación: "curso libro libros universidad platzi udemy matricula colegio",
    Entretenimiento: "cine concierto fiesta juego videojuego bar cerveza cervezas salida paseo",
    Intereses: "intereses",
    "Cuota de manejo": "manejo",
  }).flatMap(([category, words]) => words.split(" ").map((word) => [word, category])),
);

/** Words that name an account type. They pick an account only if a single one has that type. */
const TYPE_WORDS: Record<string, AccountType> = {
  efectivo: "cash",
  billetera: "cash",
  debito: "debit",
  ahorro: "savings",
  ahorros: "savings",
  tarjeta: "credit",
  credito: "credit",
  tc: "credit",
  prestamo: "loan",
};
/** Words in account names that say nothing about which account it is ("Cuenta débito"). */
const GENERIC_NAME_WORDS = new Set(["cuenta", "tarjeta", "de", "del", "la", "el", "mi", ...Object.keys(TYPE_WORDS)]);
/** Connecting words trimmed from the start and end of the description. */
const FILLER_WORDS = new Set(["con", "la", "el", "los", "las", "de", "del", "desde", "a", "al", "en", "por", "para", "y", "mi", "mis", "un", "una", "pesos", "$", "tarjeta", "cuenta"]);

export function parseQuickEntry(text: string, context: QuickEntryContext): QuickEntryDraft {
  const words = text.trim().split(/\s+/).filter(Boolean).map(trimPunctuation);
  const keys = words.map(normalize);
  const used = keys.map(() => false);
  const has = (vocabulary: Set<string> | Record<string, unknown>) =>
    keys.some((key) => (vocabulary instanceof Set ? vocabulary.has(key) : key in vocabulary));

  const amount = findAmount(keys, used, context.currency);
  const date = findDate(keys, used, context.today);
  const mentioned = findAccounts(keys, used, context.accounts);

  const moneyAccounts = context.accounts.filter((account) => !isDebtAccountType(account.type));
  const mentionedMoney = mentioned.filter((account) => !isDebtAccountType(account.type));
  const mentionedDebt = mentioned.find((account) => isDebtAccountType(account.type));
  const mentionedSavings = mentioned.find((account) => account.type === "savings");
  const usual = (candidates: Account[], pick: (t: Transaction) => string | undefined, when: (t: Transaction) => boolean) =>
    usualAccount(context.transactions, candidates, pick, when);

  let input: Omit<TransactionInput, "amount" | "date" | "description">;
  if (has(INCOME_CATEGORIES)) {
    input = {
      kind: "income",
      toAccountId:
        mentionedMoney[0]?.id ?? usual(moneyAccounts, (t) => t.toAccountId, (t) => t.kind === "income"),
      category: keys.map((key) => INCOME_CATEGORIES[key]).find(Boolean),
    };
  } else if (mentionedDebt && has(PAYMENT_WORDS)) {
    input = {
      kind: "transfer",
      toAccountId: mentionedDebt.id,
      fromAccountId:
        mentionedMoney[0]?.id ??
        usual(moneyAccounts, (t) => t.fromAccountId, (t) => t.kind === "transfer" && isDebtId(t.toAccountId, context.accounts)),
      category: "Pago de deuda",
    };
  } else if (mentionedSavings && has(SAVING_WORDS)) {
    const sources = moneyAccounts.filter((account) => account.id !== mentionedSavings.id);
    input = {
      kind: "transfer",
      toAccountId: mentionedSavings.id,
      fromAccountId:
        mentionedMoney.find((account) => account.id !== mentionedSavings.id)?.id ??
        usual(sources, (t) => t.fromAccountId, (t) => t.kind === "transfer" && t.toAccountId === mentionedSavings.id),
      category: "Ahorro",
    };
  } else {
    input = {
      kind: "expense",
      fromAccountId: mentioned[0]?.id ?? usual(context.accounts, (t) => t.fromAccountId, (t) => t.kind === "expense"),
      category: keys.map((key) => EXPENSE_CATEGORIES[key]).find(Boolean),
    };
  }

  const mentionedIds = new Set(mentioned.map((account) => account.id));
  return {
    input: { ...input, amount, date, description: describe(words, used) },
    guessed: {
      source: input.fromAccountId !== undefined && !mentionedIds.has(input.fromAccountId),
      destination: input.toAccountId !== undefined && !mentionedIds.has(input.toAccountId),
    },
  };
}

/** "Almuerzo," → "Almuerzo"; keeps a leading "$" so "$25.000" is still read as money. */
function trimPunctuation(word: string): string {
  return word.replace(/^[^\p{L}\p{N}$]+|[^\p{L}\p{N}]+$/gu, "");
}

/** Lowercase without accents, so "Débito" and "debito" match. */
function normalize(text: string): string {
  return text.toLocaleLowerCase("es").normalize("NFD").replace(/\p{Diacritic}/gu, "");
}

/**
 * Reads the amount: "25000", "25.000", "$25.000", "25 mil", "25k", "1,5 millones", "30 lucas", "2 palos".
 * With several numbers ("2 empanadas 5 mil"), the one written as money wins; otherwise the largest.
 * An unreadable amount becomes NaN, which validateTransaction rejects.
 */
function findAmount(keys: string[], used: boolean[], currency: CurrencyCode): Money {
  const candidates: { indexes: number[]; value: number; looksLikeMoney: boolean }[] = [];

  keys.forEach((key, index) => {
    const match = /^(\$?)(\d[\d.,]*?)(k|mil|lucas?|m|millon|millones|palos?)?$/.exec(key);
    const value = match ? parseNumber(match[2]) : null;
    if (!match || value === null) {
      return;
    }
    const next = keys[index + 1];
    // A separate word after the number: "25 mil". A lone "m" is too ambiguous to count.
    const nextIsSuffix = !match[3] && next !== undefined && next !== "m" && next in AMOUNT_SUFFIXES;
    const multiplier = AMOUNT_SUFFIXES[match[3] ?? (nextIsSuffix ? next : "")] ?? 1;
    candidates.push({
      indexes: nextIsSuffix ? [index, index + 1] : [index],
      value: value * multiplier,
      looksLikeMoney: match[1] === "$" || multiplier > 1,
    });
  });

  const [best] = candidates.sort(
    (a, b) => Number(b.looksLikeMoney) - Number(a.looksLikeMoney) || b.value - a.value,
  );
  if (!best) {
    return Number.NaN;
  }
  best.indexes.forEach((index) => (used[index] = true));
  return Math.round(best.value * 10 ** currencyDigits(currency));
}

/** "1.200.000" and "1,200" use thousands separators; "1,5" and "2.5" use a decimal point. */
function parseNumber(text: string): number | null {
  if (/^\d{1,3}([.,]\d{3})+$/.test(text)) {
    return Number(text.replace(/[.,]/g, ""));
  }
  if (/^\d+([.,]\d+)?$/.test(text)) {
    return Number(text.replace(",", "."));
  }
  return null;
}

function findDate(keys: string[], used: boolean[], today: LocalDate): LocalDate {
  const index = keys.findIndex((key) => key in DATE_WORDS);
  if (index === -1) {
    return today;
  }
  used[index] = true;
  return shiftDate(today, DATE_WORDS[keys[index]]);
}

function findAccounts(keys: string[], used: boolean[], accounts: Account[]): Account[] {
  const found: Account[] = [];
  const add = (account: Account, index: number) => {
    used[index] = true;
    if (!found.includes(account)) {
      found.push(account);
    }
  };

  // First, words from the account's own name: "nu" → "Tarjeta Nu".
  keys.forEach((key, index) => {
    const matches = accounts.filter((account) => nameKeywords(account).includes(key));
    if (!used[index] && matches.length === 1) {
      add(matches[0], index);
    }
  });
  // Then type words: "efectivo" → the only cash account. With two cards, "tarjeta" chooses none.
  keys.forEach((key, index) => {
    const ofType = accounts.filter((account) => account.type === TYPE_WORDS[key]);
    if (!used[index] && ofType.length === 1) {
      add(ofType[0], index);
    }
  });
  return found;
}

function nameKeywords(account: Account): string[] {
  return normalize(account.name)
    .split(/\s+/)
    .map(trimPunctuation)
    .filter((word) => word && !GENERIC_NAME_WORDS.has(word));
}

/**
 * The account to suggest when the text names none, in order of preference:
 * the one used most in similar transactions, the one used most in any transaction,
 * or the only candidate. Otherwise none: the person chooses.
 */
function usualAccount(
  transactions: Transaction[],
  candidates: Account[],
  pick: (transaction: Transaction) => string | undefined,
  similar: (transaction: Transaction) => boolean,
): string | undefined {
  const candidateIds = new Set(candidates.map((account) => account.id));
  const mostUsed = (accountsOf: (transaction: Transaction) => (string | undefined)[]) => {
    const counts = new Map<string, number>();
    for (const transaction of transactions.filter((t) => !t.deletedAt)) {
      for (const id of accountsOf(transaction)) {
        if (id && candidateIds.has(id)) {
          counts.set(id, (counts.get(id) ?? 0) + 1);
        }
      }
    }
    return [...counts].sort((a, b) => b[1] - a[1])[0]?.[0];
  };

  return (
    mostUsed((t) => (similar(t) ? [pick(t)] : [])) ??
    mostUsed((t) => [t.fromAccountId, t.toAccountId]) ??
    (candidates.length === 1 ? candidates[0].id : undefined)
  );
}

function isDebtId(accountId: string | undefined, accounts: Account[]): boolean {
  const account = accounts.find((candidate) => candidate.id === accountId);
  return account !== undefined && isDebtAccountType(account.type);
}

/** What is left after removing the amount, date and accounts, e.g. "Almuerzo". */
function describe(words: string[], used: boolean[]): string | undefined {
  const rest = words.filter((_, index) => !used[index]);
  while (rest.length > 0 && FILLER_WORDS.has(normalize(rest[0]))) {
    rest.shift();
  }
  while (rest.length > 0 && FILLER_WORDS.has(normalize(rest[rest.length - 1]))) {
    rest.pop();
  }
  const text = rest.join(" ");
  return text ? text.charAt(0).toLocaleUpperCase("es") + text.slice(1) : undefined;
}
