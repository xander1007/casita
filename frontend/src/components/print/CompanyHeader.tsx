interface CompanyInfo {
  ruc: string | null;
  legal_name: string;
  address: string | null;
  phones: string[] | null;
  emails: string[] | null;
  slogan: string | null;
}

const FALLBACK_COMPANY: CompanyInfo = {
  ruc: "20404135377",
  legal_name: "LA CASITA DE LA COMPUTADORA S.R.LTDA.",
  address: "JR. LIBERTAD NRO. 502 - SAN MARTIN MOYOBAMBA MOYOBAMBA",
  phones: ["(42)562001", "564344", "942488514", "942930282", "942930283"],
  emails: ["meche.ruiz@casita.com.pe", "maribel.robles@casita.com.pe"],
  slogan: "SOMOS SOLUCIÓN COMPRE GARANTÍA, COMPRE EN LA REGIÓN",
};

/**
 * Full A4 header block: company identity on the left, RUC + document type/number
 * boxed on the right — mirrors the SUNAT "representación impresa" layout used by
 * Sendaefact for facturas, boletas, notas de crédito and guías de remisión.
 */
export function CompanyHeaderA4({
  company,
  documentTitle,
  documentNumber,
}: {
  company: CompanyInfo | null;
  documentTitle: string;
  documentNumber: string;
}) {
  const c = company ?? FALLBACK_COMPANY;

  return (
    <div className="flex items-start justify-between gap-4 border-b-2 border-slate-800 pb-3">
      <div>
        <p className="text-base font-bold uppercase">{c.legal_name}</p>
        {c.address && <p className="text-xs">{c.address}</p>}
        {c.phones && c.phones.length > 0 && <p className="text-xs">TELEF: {c.phones.join(" / ")}</p>}
        {c.emails && c.emails.length > 0 && <p className="text-xs">EMAIL: {c.emails.join(", ")}</p>}
        {c.slogan && <p className="text-xs italic">"{c.slogan}"</p>}
      </div>
      <div className="w-64 shrink-0 rounded-md border border-slate-800 px-3 py-2 text-center">
        <p className="text-xs font-semibold">RUC: {c.ruc ?? "-"}</p>
        <p className="mt-1 text-sm font-bold uppercase">{documentTitle}</p>
        <p className="text-sm font-bold">{documentNumber}</p>
      </div>
    </div>
  );
}

/**
 * Compact centered header for the 80mm thermal ticket format.
 */
export function CompanyHeaderTicket({ company }: { company: CompanyInfo | null }) {
  const c = company ?? FALLBACK_COMPANY;

  return (
    <div className="text-center">
      <p className="font-semibold uppercase">{c.legal_name}</p>
      {c.address && <p>{c.address}</p>}
      {c.phones && c.phones.length > 0 && <p>Tel: {c.phones.join(" / ")}</p>}
      {c.ruc && <p>RUC: {c.ruc}</p>}
    </div>
  );
}

export const LEGAL_NOTICE = "NO SE ACEPTAN CAMBIOS NI DEVOLUCIONES";
