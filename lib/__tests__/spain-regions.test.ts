import { describe, it, expect } from "vitest";
import {
  SPAIN_CA,
  SPAIN_PROVINCES,
  getCaById,
  getProvincesByCa,
  isValidProvinceForCa,
  getCaByProvince,
  CA_ID_SET,
  PROVINCE_SET,
} from "../spain-regions";

describe("SPAIN_CA dataset", () => {
  it("has 19 autonomous communities (17 CCAA + Ceuta + Melilla)", () => {
    expect(SPAIN_CA.length).toBe(19);
  });

  it("all CA ids are unique", () => {
    const ids = SPAIN_CA.map((ca) => ca.id);
    expect(new Set(ids).size).toBe(ids.length);
  });

  it("SPAIN_PROVINCES has an entry for every CA id", () => {
    for (const ca of SPAIN_CA) {
      expect(SPAIN_PROVINCES[ca.id]).toBeDefined();
    }
  });
});

describe("getCaById", () => {
  it("returns the CA for a valid id", () => {
    const ca = getCaById("madrid");
    expect(ca?.name).toBe("Comunidad de Madrid");
  });

  it("returns null for an unknown id", () => {
    // @ts-expect-error intentional invalid input
    expect(getCaById("atlantida")).toBeNull();
  });
});

describe("getProvincesByCa", () => {
  it("returns provinces for andalucia (8)", () => {
    const p = getProvincesByCa("andalucia");
    expect(p.length).toBe(8);
    expect(p).toContain("Sevilla");
  });

  it("returns a single province for madrid", () => {
    expect(getProvincesByCa("madrid")).toEqual(["Madrid"]);
  });

  it("returns a single province for asturias", () => {
    expect(getProvincesByCa("asturias")).toEqual(["Asturias"]);
  });

  it("returns a single province for cantabria", () => {
    expect(getProvincesByCa("cantabria")).toEqual(["Cantabria"]);
  });

  it("castilla_leon has 9 provinces", () => {
    expect(getProvincesByCa("castilla_leon").length).toBe(9);
  });
});

describe("isValidProvinceForCa", () => {
  it("returns true for a valid pairing", () => {
    expect(isValidProvinceForCa("Barcelona", "cataluna")).toBe(true);
  });

  it("returns false for an invalid cross-CA pairing", () => {
    expect(isValidProvinceForCa("Barcelona", "madrid")).toBe(false);
  });

  it("returns false for a completely unknown province", () => {
    expect(isValidProvinceForCa("Atlantis", "andalucia")).toBe(false);
  });

  it("Madrid province is valid for madrid CA", () => {
    expect(isValidProvinceForCa("Madrid", "madrid")).toBe(true);
  });

  it("Álava is valid for pais_vasco", () => {
    expect(isValidProvinceForCa("Álava", "pais_vasco")).toBe(true);
  });
});

describe("getCaByProvince", () => {
  it("finds the CA for a given province", () => {
    expect(getCaByProvince("Sevilla")).toBe("andalucia");
  });

  it("finds pais_vasco for Gipuzkoa", () => {
    expect(getCaByProvince("Gipuzkoa")).toBe("pais_vasco");
  });

  it("returns null for unknown province", () => {
    expect(getCaByProvince("Gotham")).toBeNull();
  });
});

describe("CA_ID_SET and PROVINCE_SET", () => {
  it("CA_ID_SET contains all 19 CA ids", () => {
    expect(CA_ID_SET.size).toBe(19);
    expect(CA_ID_SET.has("madrid")).toBe(true);
    expect(CA_ID_SET.has("atlantida")).toBe(false);
  });

  it("PROVINCE_SET contains all 52 provinces", () => {
    // 50 standard + Ceuta + Melilla = 52
    expect(PROVINCE_SET.size).toBe(52);
    expect(PROVINCE_SET.has("Barcelona")).toBe(true);
    expect(PROVINCE_SET.has("Atlantis")).toBe(false);
  });
});

describe("RegionSelector logic (pure functions)", () => {
  // The component auto-selects when a CA has only one province
  it("single-province CAs: madrid has exactly 1 province", () => {
    expect(getProvincesByCa("madrid").length).toBe(1);
  });

  it("single-province CAs: asturias, cantabria, baleares, murcia, navarra, rioja, ceuta, melilla", () => {
    const singleProvinceCAs = SPAIN_CA.filter(
      (ca) => getProvincesByCa(ca.id).length === 1
    ).map((ca) => ca.id);
    expect(singleProvinceCAs).toContain("madrid");
    expect(singleProvinceCAs).toContain("asturias");
    expect(singleProvinceCAs).toContain("cantabria");
    expect(singleProvinceCAs).toContain("ceuta");
    expect(singleProvinceCAs).toContain("melilla");
  });

  it("changing CA to one with single province should auto-select", () => {
    // Simulates the RegionSelector logic
    function simulateCaChange(newCaId: typeof SPAIN_CA[number]["id"], currentProvince: string | null) {
      const newProvinces = getProvincesByCa(newCaId);
      if (newProvinces.length === 1) return { ca: newCaId, province: newProvinces[0] };
      if (currentProvince && !newProvinces.includes(currentProvince)) return { ca: newCaId, province: null };
      return { ca: newCaId, province: currentProvince };
    }

    expect(simulateCaChange("madrid", "Barcelona")).toEqual({ ca: "madrid", province: "Madrid" });
    expect(simulateCaChange("andalucia", "Barcelona")).toEqual({ ca: "andalucia", province: null });
    expect(simulateCaChange("cataluna", "Barcelona")).toEqual({ ca: "cataluna", province: "Barcelona" });
  });
});
