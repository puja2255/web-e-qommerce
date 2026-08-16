import { downloadTextFile } from "@/lib/utils";

type Align = "left" | "center" | "right";

export interface ExcelTableColumn {
  label: string;
  align?: Align;
  width?: string;
}

export interface ExcelExportOptions {
  fileName: string;
  title: string;
  subtitle?: string;
  companyName: string;
  companyAddress: string;
  columns: ExcelTableColumn[];
  rows: string[][];
  notes?: string[];
  signatureLeft?: string;
  signatureRight?: string;
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
  const noteRows = options.notes?.length
    ? `<div class="notes">${options.notes.map((note) => `<div>${escapeHtml(note)}</div>`).join("")}</div>`
    : "";
  const signatureLeft = options.signatureLeft ? escapeHtml(options.signatureLeft) : "";
  const signatureRight = options.signatureRight ? escapeHtml(options.signatureRight) : "";

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
        margin-bottom: 14px;
      }
      .header img {
        width: 64px;
        height: 64px;
        object-fit: contain;
        display: block;
        margin: 0 auto 8px;
      }
      .company-name {
        font-size: 17pt;
        font-weight: 700;
        letter-spacing: 0.4px;
      }
      .company-address {
        font-size: 10pt;
        margin-top: 2px;
      }
      .title {
        font-size: 14pt;
        font-weight: 700;
        margin: 10px 0 6px;
        text-align: center;
      }
      .subtitle {
        font-size: 10pt;
        text-align: center;
        margin-bottom: 14px;
      }
      .meta {
        text-align: center;
        margin-bottom: 12px;
        line-height: 1.5;
      }
      .notes {
        margin: 8px 0 12px;
        text-align: center;
        font-size: 9.5pt;
        line-height: 1.45;
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
      </div>
      <div class="title">${escapeHtml(options.title)}</div>
      ${options.subtitle ? `<div class="subtitle">${escapeHtml(options.subtitle)}</div>` : ""}
      ${noteRows}
      <table>
        <thead><tr>${headerColumns}</tr></thead>
        <tbody>${bodyRows}</tbody>
      </table>
      ${(signatureLeft || signatureRight) ? `
        <table class="signatures">
          <tr>
            <td>
              <div>${signatureLeft}</div>
              <div class="sign-line"></div>
              <div>(....................................)</div>
            </td>
            <td>
              <div>${signatureRight}</div>
              <div class="sign-line"></div>
              <div>(....................................)</div>
            </td>
          </tr>
        </table>
      ` : ""}
    </div>
  </body>
</html>`;

  downloadTextFile(options.fileName, `\uFEFF${html}`, "application/vnd.ms-excel;charset=utf-8");
}
