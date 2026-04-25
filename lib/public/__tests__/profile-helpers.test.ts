import { describe, it, expect } from "vitest";
import { selectHighlights, getTopDimensions } from "../profile-utils";
import type { Dimension } from "../profile-utils";

function dim(key: Dimension["key"], score: number, strengths: string[]): Dimension {
  return { key, score, strengths };
}

describe("selectHighlights", () => {
  it("picks 3 highlights from top-scoring dimensions", () => {
    const dims: Dimension[] = [
      dim("problem", 90, ["Problema cuantificado con datos económicos reales", "Urgencia regulatoria validada"]),
      dim("market", 80, ["TAM calculado con metodología bottom-up sólida"]),
      dim("solution", 70, ["IP propietaria en procesamiento de señal industrial"]),
      dim("team", 40, ["Equipo con experiencia operativa"]),
      dim("traction", 30, ["Primeros pilotos cerrados con clientes"]),
      dim("business_model", 60, ["Modelo SaaS recurrente validado"]),
      dim("gtm", 55, ["Canal directo con ciclo de venta corto"]),
    ];
    const result = selectHighlights(dims);
    expect(result.length).toBe(3);
    // First highlight should come from problem (score 90)
    expect(result[0]).toContain("Problema");
  });

  it("returns only available highlights when fewer than 3 exist", () => {
    const dims: Dimension[] = [
      dim("problem", 85, ["Única fortaleza disponible en toda la evaluación"]),
      dim("market", 70, []),
      dim("solution", 60, []),
      dim("team", 50, []),
      dim("traction", 40, []),
      dim("business_model", 35, []),
      dim("gtm", 30, []),
    ];
    const result = selectHighlights(dims);
    expect(result.length).toBe(1);
    expect(result[0]).toBe("Única fortaleza disponible en toda la evaluación");
  });

  it("deduplicates semantically similar highlights (15+ char overlap)", () => {
    const dims: Dimension[] = [
      dim("problem", 90, ["Equipo con experiencia en el sector industrial"]),
      dim("market", 85, ["Equipo con experiencia en el sector industrial y robótica avanzada"]),
      dim("solution", 80, ["IP propietaria única en el mercado europeo"]),
      dim("team", 75, ["Tecnología diferencial validada con clientes reales"]),
      dim("traction", 60, []),
      dim("business_model", 55, []),
      dim("gtm", 50, []),
    ];
    const result = selectHighlights(dims);
    // Second "Equipo con experiencia en el sector industrial" is a superset of the first — should be deduped
    const normalized = result.map((s) => s.toLowerCase());
    for (let i = 0; i < normalized.length; i++) {
      for (let j = i + 1; j < normalized.length; j++) {
        let found = false;
        for (let k = 0; k <= normalized[i].length - 15; k++) {
          if (normalized[j].includes(normalized[i].slice(k, k + 15))) { found = true; break; }
        }
        expect(found).toBe(false);
      }
    }
    expect(result.length).toBeLessThanOrEqual(3);
  });

  it("truncates strings longer than the cap at word boundary", () => {
    // 240 chars: por encima del cap actual (200) y suficientemente largo
    // para garantizar truncado independientemente del cap exacto.
    const longStr =
      "Lorem ipsum dolor sit amet consectetur adipiscing elit sed do eiusmod tempor incididunt ut labore et dolore magna aliqua ut enim ad minim veniam quis nostrud exercitation ullamco laboris nisi ut aliquip ex ea commodo consequat duis";
    const dims: Dimension[] = [
      dim("problem", 90, [longStr]),
      dim("market", 80, []),
      dim("solution", 70, []),
      dim("team", 60, []),
      dim("traction", 50, []),
      dim("business_model", 40, []),
      dim("gtm", 30, []),
    ];
    const result = selectHighlights(dims);
    expect(result.length).toBe(1);
    // Cap actual es 200; el resultado debe quedar por debajo y respetar boundary.
    expect(result[0].length).toBeLessThanOrEqual(200);
    expect(result[0].length).toBeLessThan(longStr.length);
    const r = result[0];
    const nextChar = longStr[r.length];
    expect(nextChar === " " || nextChar === undefined || longStr === r).toBe(true);
  });
});

describe("getTopDimensions", () => {
  it("returns top 3 by score descending", () => {
    const dims: Dimension[] = [
      dim("problem", 90, []),
      dim("market", 45, []),
      dim("solution", 78, []),
      dim("team", 85, []),
      dim("traction", 30, []),
      dim("business_model", 60, []),
      dim("gtm", 55, []),
    ];
    const top = getTopDimensions(dims, 3);
    expect(top.length).toBe(3);
    expect(top[0].key).toBe("problem");
    expect(top[1].key).toBe("team");
    expect(top[2].key).toBe("solution");
    // Scores should be in descending order
    for (let i = 0; i < top.length - 1; i++) {
      expect(top[i].score).toBeGreaterThanOrEqual(top[i + 1].score);
    }
  });

  it("returns all dimensions when n exceeds array length", () => {
    const dims: Dimension[] = [
      dim("problem", 90, []),
      dim("market", 45, []),
    ];
    const top = getTopDimensions(dims, 5);
    expect(top.length).toBe(2);
  });

  it("does not mutate the original array", () => {
    const dims: Dimension[] = [
      dim("problem", 90, []),
      dim("market", 45, []),
      dim("solution", 78, []),
    ];
    const originalOrder = dims.map((d) => d.key);
    getTopDimensions(dims, 3);
    expect(dims.map((d) => d.key)).toEqual(originalOrder);
  });
});
