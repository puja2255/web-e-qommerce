import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { buildMonthlyFinancialReport } from "./financial-report";
import { serializeCsv } from "./utils";

describe("buildMonthlyFinancialReport", () => {
  it("menghitung pendapatan, biaya, dan laba bersih per bulan", () => {
    const report = buildMonthlyFinancialReport([
      {
        id: "1",
        orderNumber: "GS-00001",
        customerName: "A",
        customerPhone: "0812",
        customerAddress: "Jalan A",
        mapsLink: "",
        notes: "",
        status: "COMPLETED",
        paymentStatus: "VERIFIED",
        paymentMethodId: "bank",
        totalAmount: 100000,
        shippingFee: 15000,
        adminNote: "",
        items: [{ productId: "p1", productName: "Produk A", unitPrice: 100000, quantity: 1, subtotal: 100000, image: "" }],
        createdAt: "2026-01-15T10:00:00.000Z",
      },
      {
        id: "2",
        orderNumber: "GS-00002",
        customerName: "B",
        customerPhone: "0813",
        customerAddress: "Jalan B",
        mapsLink: "",
        notes: "",
        status: "COMPLETED",
        paymentStatus: "VERIFIED",
        paymentMethodId: "bank",
        totalAmount: 200000,
        shippingFee: 20000,
        adminNote: "",
        items: [{ productId: "p2", productName: "Produk B", unitPrice: 200000, quantity: 1, subtotal: 200000, image: "" }],
        createdAt: "2026-02-10T11:00:00.000Z",
      },
      {
        id: "3",
        orderNumber: "GS-00003",
        customerName: "C",
        customerPhone: "0814",
        customerAddress: "Jalan C",
        mapsLink: "",
        notes: "",
        status: "CANCELLED",
        paymentStatus: "REFUNDED",
        paymentMethodId: "bank",
        totalAmount: 50000,
        shippingFee: 0,
        adminNote: "",
        items: [{ productId: "p3", productName: "Produk C", unitPrice: 50000, quantity: 1, subtotal: 50000, image: "" }],
        createdAt: "2026-02-15T12:00:00.000Z",
      },
    ]);

    assert.equal(report[0].month, "2026-01");
    assert.equal(report[0].revenue, 100000);
    assert.equal(report[0].shippingFee, 15000);
    assert.equal(report[0].labaBersih, 85000);
    assert.equal(report[1].month, "2026-02");
    assert.equal(report[1].revenue, 200000);
    assert.equal(report[1].shippingFee, 20000);
    assert.equal(report[1].labaBersih, 180000);
  });

  it("membuat CSV yang sesuai format Excel Indonesia", () => {
    const csv = serializeCsv([
      ["Periode", "Pendapatan", "Laba Bersih"],
      ["Juli 2026", "3740000", "3240000"],
    ]);

    assert.equal(csv, 'Periode;Pendapatan;Laba Bersih\r\nJuli 2026;3740000;3240000');
  });
});
