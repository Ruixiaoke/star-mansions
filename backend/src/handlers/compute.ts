/** /api/compute 的处理逻辑（与 Express / Vercel 框架无关）。 */
import type { ComputeResponse } from "../types/contract";
import type { HandlerResult } from "./result";
import { parseBirthInput } from "../lib/validate";
import { computeBenmingXiu } from "../lib/xiu";
import { DISCLAIMER } from "../lib/disclaimer";

export function handleCompute(rawBody: unknown): HandlerResult<ComputeResponse> {
  const parsed = parseBirthInput(rawBody);
  if (!parsed.ok) return { status: 400, body: parsed.error };

  const input = parsed.value;
  try {
    const c = computeBenmingXiu(input);
    return {
      status: 200,
      body: {
        input,
        solarDate: c.solarDate,
        lunarDate: c.lunarDate,
        benming: c.benming,
        timeZhi: c.timeZhi,
        disclaimer: DISCLAIMER,
      },
    };
  } catch (e) {
    return { status: 400, body: { error: "COMPUTE_FAILED", message: (e as Error).message } };
  }
}
