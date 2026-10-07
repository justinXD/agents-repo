import { tool, McpClient, McpTransport } from "@strands-agents/sdk";
import { z } from "zod";

const calculadora = tool({
  name: "calculadora",
  description: "Evalúa una expresión matemática simple, ej: '23 * 4 + 1'",
  inputSchema: z.object({
    expresion: z.string(),
  }),
  callback: async ({ expresion }) => {
    try {
      if (!/^[\d\s+\-*/().]+$/.test(expresion)) {
        return `Error: la expresión contiene caracteres no permitidos.`;
      }
      const resultado = Function(`"use strict"; return (${expresion})`)();
      if (typeof resultado !== "number" || isNaN(resultado) || !isFinite(resultado)) {
        return `Error: la expresión no es válida, posible valor nulo o infinito.`;
      }
      return `El resultado es ${resultado}`;
    } catch (e) {
      return `Error al evaluar la expresión: ${e instanceof Error ? e.message : String(e)}`;
    }
  },
});

const sumar = tool({
  name: "Sumar_tool",
  description: "Suma n cantidad de números, ej: '1, 2, 3'",
  inputSchema: z.object({
    numeros: z.array(z.number()),
  }),
  callback: async ({ numeros }) => {
    try {
      if (!Array.isArray(numeros) || numeros.length === 0) {
        return "Error: no se proporcionaron números para sumar o la lista está vacía.";
      }
      if (!numeros.every(num => typeof num === "number" && !isNaN(num))) {
        return "Error: todos los elementos deben ser números válidos.";
      }
      const resultado = numeros.reduce((acc, curr) => acc + curr, 0);
      return `El resultado de la suma es ${resultado}`;
    } catch (error) {
      return `Error al sumar los números: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

const restar = tool({
  name: "restar_tool",
  description: "Resta n cantidad de números, ej: '10 - 2 - 3'",
  inputSchema: z.object({
    numeros: z.array(z.number()),
  }),
  callback: async ({ numeros }) => {
    try {
      if (!Array.isArray(numeros) || numeros.length === 0) {
        return "Error: no se proporcionaron números para restar o la lista está vacía.";
      }
      if (!numeros.every(num => typeof num === "number" && !isNaN(num))) {
        return "Error: todos los elementos deben ser números válidos.";
      }
      let acumulador: number = numeros[0] - numeros[1];
      for(let i = 2; i < numeros.length; i++) {
        acumulador -= numeros[i]
      }
      return `El resultado de la resta es ${acumulador}`;
    } catch (error) {
      return `Error al restar los números: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

const multiplicar = tool({
  name: "multiplicar_tool",
  description: "Multiplica n cantidad de números, ej: '2 * 3 * 4'",
  inputSchema: z.object({
    numeros: z.array(z.number()),
  }),
  callback: async ({ numeros }) => {
    try {
      if (!Array.isArray(numeros) || numeros.length === 0) {
        return "Error: no se proporcionaron números para multiplicar o la lista está vacía.";
      }
      if (!numeros.every(num => typeof num === "number" && !isNaN(num))) {
        return "Error: todos los elementos deben ser números válidos.";
      }
      // const resultado = numeros.reduce((acc, curr) => acc * curr, 1);
      let resultado: number = numeros[0] * numeros[1];
      for(let i = 2; i < numeros.length; i++) {
        resultado *= numeros[i]
      }
      return `El resultado de la multiplicación es ${resultado}`;
    } catch (error) {
      return `Error al multiplicar los números: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

const dividir = tool({
  name: "dividir_tool",
  description: "Divide n cantidad de números, ej: '20 / 2 / 2'",
  inputSchema: z.object({
    numeros: z.array(z.number()),
  }),
  callback: async ({ numeros }) => {
    try {
      if (!Array.isArray(numeros) || numeros.length === 0) {
        return "Error: no se proporcionaron números para dividir o la lista está vacía.";
      }
      if (!numeros.every(num => typeof num === "number" && !isNaN(num))) {
        return "Error: todos los elementos deben ser números válidos.";
      }
      let resultado: number = numeros[0] / numeros[1];
      for(let i = 2; i < numeros.length; i++) {
        if (numeros[i] === 0) {
          return "Error: división por cero no permitida.";
        }
        resultado /= numeros[i]
      }
      return `El resultado de la división es ${resultado}`;
    } catch (error) {
      return `Error al dividir los números: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

const CurrencyConverter = tool({
  name: "currency_converter",
  description: "Convierte una cantidad entre MXN y USD (tasa simulada: 1 USD = 18 MXN). Recibe amount, fromCurrency y toCurrency (usa 'MXN' o 'USD').",
  inputSchema: z.object({
    amount: z.number(),
    fromCurrency: z.enum(["MXN", "USD"]),
    toCurrency: z.enum(["MXN", "USD"]),
  }),
  callback: async ({ amount, fromCurrency, toCurrency }) => {
    try {
      if (fromCurrency === toCurrency) {
      return `${amount} ${fromCurrency} equivalen a ${amount} ${toCurrency}`;
    }
    if (amount < 0) {
      return "Error: el monto debe ser un número positivo.";
    }
    // Tasas relativas a MXN (moneda base)
    const tasasEnMxn: Record<string, number> = { MXN: 1, USD: 18 };
    const amountEnMxn = amount * tasasEnMxn[fromCurrency];
    const resultado = amountEnMxn / tasasEnMxn[toCurrency];
    return `${amount} ${fromCurrency} equivalen a ${resultado.toFixed(2)} ${toCurrency}`;
    } catch (error) {
      return `Error al convertir la moneda: ${error instanceof Error ? error.message : String(error)}`;
    }
  },
});

const createMcpClient = (makeTransport: () => McpTransport): McpClient => {
    return new McpClient({ transport: makeTransport() });
}

const conTimeout = async <T>(p: Promise<T>, ms: number): Promise<T> => {
  let timer: ReturnType<typeof setTimeout> | undefined;
  const timeout = new Promise<never>((_, reject) => {
    timer = setTimeout(() => reject(new Error("timeout")), ms);
  });
  try {
    return await Promise.race([p, timeout]);
  } finally {
    clearTimeout(timer); // el timer no deja el proceso colgado
  }
};

const disconnectAll = async (clients: McpClient[], ms = 5000) => {
  const results = await Promise.allSettled(clients.map((c) => conTimeout(c.disconnect(), ms)));
  results.forEach((r, i) => {
    if (r.status === "rejected") console.warn(`MCP client #${i} no cerró bien:`, r.reason);
  });
}

export { calculadora, sumar, restar, multiplicar, dividir, CurrencyConverter, createMcpClient, disconnectAll };