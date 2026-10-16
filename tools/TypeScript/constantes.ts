const MODEL: string = "us.anthropic.claude-haiku-4-5-20251001-v1:0";
const PROMPT_COSTO_MILLON_LLAMADAS_LAMBDA: string = "¿Si hago 1 millon de llamadas a Lambda, cuál sería el costo estimado de todas esas llamadas en pesos mexicanos?";
const PROMPT_COSTO_ARQUITECTURA: string = "API de pedidos: 2 millones de peticiones al mes en API Gateway, 3 millones de invocaciones Lambda, 5 millones de lecturas DynamoDB y 50 GB en S3. ¿Cuánto cuesta al mes en MXN?"

export { MODEL, PROMPT_COSTO_MILLON_LLAMADAS_LAMBDA, PROMPT_COSTO_ARQUITECTURA };