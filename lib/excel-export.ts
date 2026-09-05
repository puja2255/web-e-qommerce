import { downloadTextFile } from "@/lib/utils";

type Align = "left" | "center" | "right";

export interface ExcelTableColumn {
  label: string;
  align?: Align;
  width?: string;
}

export interface ExcelExportOptions {
  fileName: string;
  companyName: string;
  companyAddress: string;
  reportTitle?: string;
  reportPeriod?: string;
  printedAt: string;
  notes?: string[];
  columns: ExcelTableColumn[];
  rows: string[][];
}

const escapeHtml = (value: string) =>
  value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");

const alignClass = (align: Align = "left") => {
  if (align === "center") return "center";
  if (align === "right") return "right";
  return "left";
};

function normalizeColumnWidths(columns: ExcelTableColumn[]) {
  const parsed = columns.map((column) => {
    if (!column.width) {
      return { raw: column.width, percent: null };
    }

    const match = /^(\d+(?:\.\d+)?)(px|%)$/.exec(column.width.trim());
    if (!match) {
      return { raw: column.width, percent: null };
    }

    const value = Number(match[1]);
    if (Number.isNaN(value)) {
      return { raw: column.width, percent: null };
    }

    return { raw: column.width, percent: match[2] === "%" ? value : null, px: match[2] === "px" ? value : null };
  });

  const explicitPercentTotal = parsed.reduce((sum, item) => sum + (item.percent ?? 0), 0);
  const explicitPxTotal = parsed.reduce((sum, item) => sum + (item.px ?? 0), 0);
  const remainingForPx = Math.max(100 - explicitPercentTotal, 0);

  if (explicitPxTotal > 0) {
    return parsed.map((item) => {
      if (item.percent != null) return `${item.percent}%`;
      if (item.px != null) return `${(item.px / explicitPxTotal) * remainingForPx}%`;
      return null;
    });
  }

  return parsed.map((item) => (item.percent != null ? `${item.percent}%` : null));
}

export async function downloadExcelHtmlReport(options: ExcelExportOptions) {
  const normalizedWidths = normalizeColumnWidths(options.columns);
  const headerColumns = options.columns
    .map(
      (column) =>
        `<th class="${alignClass(column.align ?? "center")}">${escapeHtml(column.label)}</th>`,
    )
    .join("");
  const bodyRows = options.rows.length
    ? options.rows
        .map(
          (row) =>
            `<tr>${row
              .map((cell, index) => `<td class="${alignClass(options.columns[index]?.align ?? "left")}">${escapeHtml(cell ?? "")}</td>`)
              .join("")}</tr>`,
        )
        .join("")
    : `<tr><td colspan="${options.columns.length}" class="center">Tidak ada data.</td></tr>`;
  const html = `<!doctype html>
<html>
  <head>
    <meta charset="utf-8" />
    <style>
      @page { size: A4 landscape; margin: 12mm; }
      body {
        margin: 0;
        font-family: Arial, Helvetica, sans-serif;
        color: #111;
        font-size: 10.5pt;
      }
      .sheet {
        width: 100%;
        text-align: center;
      }
      .header {
        text-align: center;
        margin-bottom: 34px;
      }
      .company-name {
        font-size: 16pt;
        font-weight: 700;
        letter-spacing: 0.4px;
      }
      .company-address {
        font-size: 10pt;
        margin-top: 2px;
      }
      .report-title {
        font-size: 14pt;
        font-weight: 700;
        margin-top: 8px;
      }
      .report-period {
        font-size: 10pt;
        margin-top: 4px;
      }
      .print-date {
        text-align: center;
        font-size: 9.5pt;
        margin-top: 4px;
      }
      .report-notes {
        text-align: center;
        font-size: 9.5pt;
        line-height: 1.45;
        margin: 12px 0 8px;
      }
      .header-gap {
        height: 8px;
      }
      table {
        width: 100%;
        table-layout: fixed;
        border-collapse: collapse;
        margin: 18px auto 0;
      }
      colgroup col {
        width: auto;
      }
      th, td {
        border: 1px solid #111;
        padding: 5px 6px;
        vertical-align: top;
        white-space: normal;
        overflow-wrap: anywhere;
        word-break: break-word;
      }
      th {
        background: #efefef;
        text-align: center;
        font-weight: 700;
      }
      td.left { text-align: left; }
      td.center { text-align: center; }
      td.right { text-align: right; }
      .summary {
        margin-top: 12px;
      }
      .summary td {
        font-weight: 700;
      }
      .signatures {
        width: 100%;
        margin-top: 28px;
      }
      .signatures td {
        border: 0;
        width: 50%;
        text-align: center;
        padding-top: 20px;
      }
      .sign-line {
        height: 48px;
      }
    </style>
  </head>
  <body>
    <div class="sheet">
      <div class="header">
        <div class="company-name">${escapeHtml(options.companyName)}</div>
        <div class="company-address">${escapeHtml(options.companyAddress)}</div>
        ${options.reportTitle ? `<div class="report-title">${escapeHtml(options.reportTitle)}</div>` : ""}
        ${options.reportPeriod ? `<div class="report-period">${escapeHtml(options.reportPeriod)}</div>` : ""}
        <div class="print-date">Tanggal cetak: ${escapeHtml(options.printedAt)}</div>
      </div>
      ${options.notes?.length ? `<div class="report-notes">${options.notes.map((note) => escapeHtml(note)).join("<br />")}</div>` : ""}
      <div class="header-gap"></div>
      <table>
        <colgroup>
          ${normalizedWidths.map((width) => `<col${width ? ` style="width:${width}"` : ""}>`).join("")}
        </colgroup>
        <thead><tr>${headerColumns}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  </body>
</html>`;

  downloadTextFile(options.fileName, `\uFEFF${html}`, "application/vnd.ms-excel;charset=utf-8");
}
