"use client";

import { SPAIN_CA, SPAIN_PROVINCES, getProvincesByCa, type CaId } from "@/lib/spain-regions";

type RegionValue = {
  ca: CaId | null;
  province: string | null;
};

type Props = {
  value: RegionValue;
  onChange: (value: RegionValue) => void;
  required?: boolean;
  disabled?: boolean;
  showLabels?: boolean;
};

export default function RegionSelector({
  value,
  onChange,
  required = false,
  disabled = false,
  showLabels = true,
}: Props) {
  const provinces = value.ca ? getProvincesByCa(value.ca) : [];

  function handleCaChange(e: React.ChangeEvent<HTMLSelectElement>) {
    const ca = (e.target.value as CaId) || null;
    if (!ca) {
      onChange({ ca: null, province: null });
      return;
    }

    const newProvinces = SPAIN_PROVINCES[ca] as readonly string[];
    // Auto-select if only one province; reset if current province is invalid for new CA
    if (newProvinces.length === 1) {
      onChange({ ca, province: newProvinces[0] });
    } else if (value.province && !newProvinces.includes(value.province)) {
      onChange({ ca, province: null });
    } else {
      onChange({ ca, province: value.province });
    }
  }

  function handleProvinceChange(e: React.ChangeEvent<HTMLSelectElement>) {
    onChange({ ca: value.ca, province: e.target.value || null });
  }

  const selectBase =
    "w-full rounded-card border border-border-soft px-3 py-2.5 font-body text-sm text-brand-navy bg-white focus:outline-none focus:ring-2 focus:ring-brand-salmon disabled:opacity-50 disabled:cursor-not-allowed";

  return (
    <div className="flex flex-col gap-3">
      {/* CA dropdown */}
      <div className="flex flex-col gap-1">
        {showLabels && (
          <label className="font-body text-sm font-semibold text-brand-navy">
            Comunidad Autónoma{required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          value={value.ca ?? ""}
          onChange={handleCaChange}
          disabled={disabled}
          required={required}
          aria-label="Comunidad Autónoma"
          className={selectBase}
        >
          <option value="">Selecciona Comunidad Autónoma</option>
          {SPAIN_CA.map((ca) => (
            <option key={ca.id} value={ca.id}>
              {ca.name}
            </option>
          ))}
        </select>
      </div>

      {/* Province dropdown */}
      <div className="flex flex-col gap-1">
        {showLabels && (
          <label className="font-body text-sm font-semibold text-brand-navy">
            Provincia{required && <span className="text-red-500 ml-1">*</span>}
          </label>
        )}
        <select
          value={value.province ?? ""}
          onChange={handleProvinceChange}
          disabled={disabled || !value.ca}
          required={required && !!value.ca}
          aria-label="Provincia"
          className={selectBase}
        >
          <option value="">
            {value.ca ? "Selecciona provincia" : "Primero selecciona una CA"}
          </option>
          {provinces.map((p) => (
            <option key={p} value={p}>
              {p}
            </option>
          ))}
        </select>
      </div>
    </div>
  );
}
