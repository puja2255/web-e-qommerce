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
  printedAt: string;
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

export async function downloadExcelHtmlReport(options: ExcelExportOptions) {
  const headerColumns = options.columns
    .map(
      (column) =>
        `<th${column.width ? ` style="width:${column.width}"` : ""} class="${alignClass(column.align ?? "center")}">${escapeHtml(column.label)}</th>`,
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
        margin-bottom: 24px;
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
      .print-date {
        text-align: center;
        font-size: 9.5pt;
        margin-top: 6px;
      }
      .header-gap {
        height: 10px;
      }
      table {
        width: 100%;
        border-collapse: collapse;
        margin: 0 auto;
      }
      th, td {
        border: 1px solid #111;
        padding: 6px 8px;
        vertical-align: top;
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
        <div class="print-date">Tanggal cetak: ${escapeHtml(options.printedAt)}</div>
      </div>
      <div class="header-gap"></div>
      <table>
        <thead><tr>${headerColumns}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
    </div>
  </body>
</html>`;

  downloadTextFile(options.fileName, `\uFEFF${html}`, "application/vnd.ms-excel;charset=utf-8");
}
