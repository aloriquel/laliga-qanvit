export const SPAIN_CA = [
  { id: "andalucia",          name: "Andalucía" },
  { id: "aragon",             name: "Aragón" },
  { id: "asturias",           name: "Principado de Asturias" },
  { id: "baleares",           name: "Illes Balears" },
  { id: "canarias",           name: "Canarias" },
  { id: "cantabria",          name: "Cantabria" },
  { id: "castilla_leon",      name: "Castilla y León" },
  { id: "castilla_la_mancha", name: "Castilla-La Mancha" },
  { id: "cataluna",           name: "Cataluña" },
  { id: "valenciana",         name: "Comunitat Valenciana" },
  { id: "extremadura",        name: "Extremadura" },
  { id: "galicia",            name: "Galicia" },
  { id: "madrid",             name: "Comunidad de Madrid" },
  { id: "murcia",             name: "Región de Murcia" },
  { id: "navarra",            name: "Comunidad Foral de Navarra" },
  { id: "pais_vasco",         name: "País Vasco / Euskadi" },
  { id: "rioja",              name: "La Rioja" },
  { id: "ceuta",              name: "Ceuta" },
  { id: "melilla",            name: "Melilla" },
] as const;

export const SPAIN_PROVINCES = {
  andalucia:          ["Almería", "Cádiz", "Córdoba", "Granada", "Huelva", "Jaén", "Málaga", "Sevilla"],
  aragon:             ["Huesca", "Teruel", "Zaragoza"],
  asturias:           ["Asturias"],
  baleares:           ["Illes Balears"],
  canarias:           ["Las Palmas", "Santa Cruz de Tenerife"],
  cantabria:          ["Cantabria"],
  castilla_leon:      ["Ávila", "Burgos", "León", "Palencia", "Salamanca", "Segovia", "Soria", "Valladolid", "Zamora"],
  castilla_la_mancha: ["Albacete", "Ciudad Real", "Cuenca", "Guadalajara", "Toledo"],
  cataluna:           ["Barcelona", "Girona", "Lleida", "Tarragona"],
  valenciana:         ["Alicante", "Castellón", "Valencia"],
  extremadura:        ["Badajoz", "Cáceres"],
  galicia:            ["A Coruña", "Lugo", "Ourense", "Pontevedra"],
  madrid:             ["Madrid"],
  murcia:             ["Murcia"],
  navarra:            ["Navarra"],
  pais_vasco:         ["Álava", "Bizkaia", "Gipuzkoa"],
  rioja:              ["La Rioja"],
  ceuta:              ["Ceuta"],
  melilla:            ["Melilla"],
} as const;

export type CaId = typeof SPAIN_CA[number]["id"];
export type Province = string;

/** Slug-to-name map for future V1.5 regional ranking URLs (/liga/madrid). */
export const CA_SLUGS: Record<CaId, string> = {
  andalucia:          "andalucia",
  aragon:             "aragon",
  asturias:           "asturias",
  baleares:           "baleares",
  canarias:           "canarias",
  cantabria:          "cantabria",
  castilla_leon:      "castilla-leon",
  castilla_la_mancha: "castilla-la-mancha",
  cataluna:           "cataluna",
  valenciana:         "valenciana",
  extremadura:        "extremadura",
  galicia:            "galicia",
  madrid:             "madrid",
  murcia:             "murcia",
  navarra:            "navarra",
  pais_vasco:         "pais-vasco",
  rioja:              "la-rioja",
  ceuta:              "ceuta",
  melilla:            "melilla",
};

export function getCaById(id: CaId) {
  return SPAIN_CA.find((ca) => ca.id === id) ?? null;
}

export function getProvincesByCa(id: CaId): readonly string[] {
  return SPAIN_PROVINCES[id] ?? [];
}

export function isValidProvinceForCa(province: string, caId: CaId): boolean {
  const provinces = SPAIN_PROVINCES[caId] as readonly string[];
  return provinces.includes(province);
}

/** Returns the CaId that owns the given province, or null if not found. */
export function getCaByProvince(province: string): CaId | null {
  for (const ca of SPAIN_CA) {
    const list = SPAIN_PROVINCES[ca.id] as readonly string[];
    if (list.includes(province)) return ca.id;
  }
  return null;
}

/** All valid CA ids as a Set, useful for server-side validation. */
export const CA_ID_SET = new Set<string>(SPAIN_CA.map((ca) => ca.id));

/** All valid province names as a Set, useful for server-side validation. */
export const PROVINCE_SET = new Set<string>(
  Object.values(SPAIN_PROVINCES).flat()
);
