import { Agent, tool, StructuredOutputError } from "@strands-agents/sdk";
import { z } from "zod";

const gastoSchema = z.object({
  descripcion: z.string().describe("Qué fue el gasto"),
  montoOriginal: z.number(),
  monedaOriginal: z.string(),
  tazaUsada: z.number(),
  montoEnMxn: z.number().describe("Monto convertido a MXN"),
});

const resumenGastosSchema = z.object({
  gastos: z.array(gastoSchema),
  totalMxn: z.number().describe("Suma de todos los gastos convertidos a MXN"),
});

const sumar = tool({
  name: "Sumar_tool",
  description: "Suma n cantidad de números, ej: '1 + 2 + 3'",
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
})

const CurrencyConverter = tool({
  name: "currency_converter",
  description: "Convierte una cantidad entre MXN y USD (tasa simulada: 1 USD = 18 MXN). Recibe amount, fromCurrency y toCurrency (usa 'MXN' o 'USD').",
  inputSchema: z.object({
    amount: z.number(),
    fromCurrency: z.enum(["MXN", "USD"]),
    toCurrency: z.enum(["MXN", "USD"]),
  }),
  callback: ({ amount, fromCurrency, toCurrency }) => {
    try {
      if (fromCurrency === toCurrency) {
      return `${amount} ${fromCurrency} equivalen a ${amount} ${toCurrency}`;
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

const agent = new Agent({
  model: "us.anthropic.claude-haiku-4-5-20251001-v1:0",
  systemPrompt: "Eres un asistente de finanzas personales. Usa currency_converter para normalizar cada gasto a MXN y Sumar_tool para hacer sumas",
  tools: [CurrencyConverter, sumar],
  structuredOutputSchema: resumenGastosSchema,
});

const resultado = await agent.invoke("Gasté 500 MXN en comida, 30 USD en transporte y 15.50 USD en café");
const resumen = resultado.structuredOutput as z.infer<typeof resumenGastosSchema>;
resumen.gastos.forEach(g => console.log(`${g.descripcion}: ${g.montoOriginal} ${g.monedaOriginal} = ${g.montoEnMxn.toFixed(2)} MXN`));
console.log(`Total: ${resumen.totalMxn.toFixed(2)} MXN`);