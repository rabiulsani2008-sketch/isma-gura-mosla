import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/constants";
import { hashPassword } from "@/lib/password";

// POST /api/seed — idempotently seed the demo shop + demo data for ইসমা গুড়া মসলা প্রাইভেট লিমিটেড
export async function POST() {
  // Find or create the demo shop
  let shop = await db.shop.findFirst({
    where: { phone: "01700000000" },
  });

  if (!shop) {
    shop = await db.shop.create({
      data: {
        name: COMPANY_NAME,
        ownerName: "মোহাম্মদ ইসমা",
        phone: "01700000000",
        passwordHash: hashPassword("1234"),
        address: "মসলা বাজার, ঢাকা, বাংলাদেশ",
        logoUrl: "/logo.png",
        tagline: COMPANY_TAGLINE,
        currency: "৳",
        shopCode: "ISMA-DEMO01",
      },
    });

    // Categories
    const cats = await db.$transaction(
      ["মসলা", "গুঁড়া মসলা", "শুকনা মসলা", "অন্যান্য"].map((name) =>
        db.category.create({ data: { shopId: shop!.id, name } })
      )
    );
    const catMap: Record<string, string> = {};
    ["মসলা", "গুঁড়া মসলা", "শুকনা মসলা", "অন্যান্য"].forEach((n, i) => {
      catMap[n] = cats[i].id;
    });

    // Demo products (spices)
    const products = [
      { name: "জিরা", cat: "শুকনা মসলা", purchase: 500, selling: 600, stock: 20, min: 5, unit: "kg" },
      { name: "ধনিয়া", cat: "শুকনা মসলা", purchase: 300, selling: 380, stock: 15, min: 4, unit: "kg" },
      { name: "হলুদ গুঁড়া", cat: "গুঁড়া মসলা", purchase: 250, selling: 320, stock: 25, min: 6, unit: "kg" },
      { name: "মরিচ গুঁড়া", cat: "গুঁড়া মসলা", purchase: 280, selling: 360, stock: 3, min: 5, unit: "kg" },
      { name: "গরম মসলা", cat: "গুঁড়া মসলা", purchase: 600, selling: 750, stock: 12, min: 3, unit: "kg" },
      { name: "এলাচ", cat: "শুকনা মসলা", purchase: 1800, selling: 2100, stock: 8, min: 2, unit: "kg" },
      { name: "দারুচিনি", cat: "শুকনা মসলা", purchase: 400, selling: 520, stock: 10, min: 3, unit: "kg" },
      { name: "লবঙ্গ", cat: "শুকনা মসলা", purchase: 1200, selling: 1450, stock: 0, min: 2, unit: "kg" },
      { name: "রাঁধুনি গুঁড়া", cat: "গুঁড়া মসলা", purchase: 220, selling: 290, stock: 18, min: 4, unit: "kg" },
      { name: "পাঁচফোড়ন", cat: "গুঁড়া মসলা", purchase: 320, selling: 400, stock: 14, min: 3, unit: "kg" },
      { name: "শুকনা মরিচ", cat: "শুকনা মসলা", purchase: 260, selling: 340, stock: 22, min: 5, unit: "kg" },
      { name: "জায়ফল", cat: "শুকনা মসলা", purchase: 2000, selling: 2400, stock: 4, min: 1, unit: "kg" },
    ];

    for (const p of products) {
      await db.product.create({
        data: {
          shopId: shop.id,
          categoryId: catMap[p.cat],
          name: p.name,
          unit: p.unit,
          purchasePrice: p.purchase,
          sellingPrice: p.selling,
          stockQuantity: p.stock,
          minimumStock: p.min,
          description: `${p.name} - বিশুদ্ধ ও ভেজালমুক্ত`,
        },
      });
      // opening stock movement
      const prod = await db.product.findFirst({ where: { shopId: shop.id, name: p.name } });
      if (prod) {
        await db.stockMovement.create({
          data: {
            shopId: shop.id,
            productId: prod.id,
            type: "adjustment",
            quantity: p.stock,
            reference: "Opening stock",
          },
        });
      }
    }

    // Demo customers
    const custData = [
      { name: "রহিম মুদি ঘর", phone: "01711-111111", addr: "মিরপুর, ঢাকা", due: 0 },
      { name: "করিম স্টোর", phone: "01722-222222", addr: "গুলশান, ঢাকা", due: 1500 },
      { name: "সালমা বেগম", phone: "01733-333333", addr: "উত্তরা, ঢাকা", due: 0 },
      { name: "নাসির এন্টারপ্রাইজ", phone: "01744-444444", addr: "মোহাম্মদপুর, ঢাকা", due: 3200 },
    ];
    for (const c of custData) {
      await db.customer.create({
        data: { shopId: shop.id, name: c.name, phone: c.phone, address: c.addr, openingDue: c.due },
      });
    }

    // Demo suppliers
    const supData = [
      { name: "ঢাকা মসলা মহাজন", phone: "01811-555555", addr: "চকবাজার, ঢাকা", due: 0 },
      { name: "শ্যামলী ট্রেডার্স", phone: "01822-666666", addr: "শ্যামলী, ঢাকা", due: 5000 },
      { name: "খুলনা এগ্রো", phone: "01833-777777", addr: "খুলনা", due: 0 },
    ];
    for (const s of supData) {
      await db.supplier.create({
        data: { shopId: shop.id, name: s.name, phone: s.phone, address: s.addr, openingDue: s.due },
      });
    }

    // Demo transactions for today + past week (so dashboard/charts show data)
    const customers = await db.customer.findMany({ where: { shopId: shop.id } });
    const suppliers = await db.supplier.findMany({ where: { shopId: shop.id } });
    const allProducts = await db.product.findMany({ where: { shopId: shop.id } });
    const findP = (n: string) => allProducts.find((p) => p.name === n)!;

    const now = new Date();
    const dayMs = 24 * 60 * 60 * 1000;

    // Generate 7 days of sales
    for (let d = 6; d >= 0; d--) {
      const date = new Date(now.getTime() - d * dayMs);
      const salesCount = d === 0 ? 3 : Math.floor(Math.random() * 3) + 1;
      for (let s = 0; s < salesCount; s++) {
        const cust = customers[Math.floor(Math.random() * customers.length)];
        const p1 = findP(["জিরা", "হলুদ গুঁড়া", "মরিচ গুঁড়া", "গরম মসলা", "ধনিয়া"][Math.floor(Math.random()*5)]);
        const qty = Math.floor(Math.random() * 3) + 1;
        const unitPrice = p1.sellingPrice;
        const total = qty * unitPrice;
        const paid = Math.random() > 0.3 ? total : Math.round(total * 0.7);
        const due = total - paid;
        const inv = `INV-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,"0")}${String(date.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*9999)}`;
        const sale = await db.sale.create({
          data: {
            shopId: shop.id,
            customerId: cust.id,
            invoiceNumber: inv,
            subtotal: total,
            discount: 0,
            totalAmount: total,
            paidAmount: paid,
            dueAmount: due,
            paymentMethod: due > 0 ? "বাকিতে" : "নগদ",
            saleDate: date,
          },
        });
        await db.saleItem.create({
          data: {
            saleId: sale.id,
            productId: p1.id,
            quantity: qty,
            unitPrice,
            costPrice: p1.purchasePrice,
            total,
          },
        });
        await db.stockMovement.create({
          data: { shopId: shop.id, productId: p1.id, type: "sale", quantity: -qty, reference: inv },
        });
        await db.product.update({ where: { id: p1.id }, data: { stockQuantity: { decrement: qty } } });
        await db.transaction.create({
          data: {
            shopId: shop.id,
            type: "sale",
            saleId: sale.id,
            description: `বিক্রি - ${inv}`,
            amount: total,
            paymentMethod: due > 0 ? "বাকিতে" : "নগদ",
            createdAt: date,
          },
        });
      }

      // Purchases some days
      if (d % 2 === 0 && d > 0) {
        const sup = suppliers[Math.floor(Math.random() * suppliers.length)];
        const p1 = findP(["জিরা", "হলুদ গুঁড়া", "ধনিয়া"][Math.floor(Math.random()*3)]);
        const qty = Math.floor(Math.random() * 10) + 5;
        const unitPrice = p1.purchasePrice;
        const total = qty * unitPrice;
        const paid = Math.random() > 0.4 ? total : Math.round(total * 0.6);
        const due = total - paid;
        const inv = `PUR-${date.getFullYear()}${String(date.getMonth()+1).padStart(2,"0")}${String(date.getDate()).padStart(2,"0")}-${Math.floor(Math.random()*9999)}`;
        const purchase = await db.purchase.create({
          data: {
            shopId: shop.id,
            supplierId: sup.id,
            invoiceNumber: inv,
            totalAmount: total,
            paidAmount: paid,
            dueAmount: due,
            paymentMethod: due > 0 ? "বাকি" : "নগদ",
            purchaseDate: date,
          },
        });
        await db.purchaseItem.create({
          data: { purchaseId: purchase.id, productId: p1.id, quantity: qty, unitPrice, total },
        });
        await db.stockMovement.create({
          data: { shopId: shop.id, productId: p1.id, type: "purchase", quantity: qty, reference: inv },
        });
        await db.product.update({ where: { id: p1.id }, data: { stockQuantity: { increment: qty } } });
        await db.transaction.create({
          data: {
            shopId: shop.id,
            type: "purchase",
            purchaseId: purchase.id,
            description: `ক্রয় - ${inv}`,
            amount: total,
            paymentMethod: due > 0 ? "বাকি" : "নগদ",
            createdAt: date,
          },
        });
      }

      // Expenses
      if (d === 0 || d === 2) {
        const expCats = ["দোকান ভাড়া", "বিদ্যুৎ", "কর্মচারী", "পরিবহন"];
        const cat = expCats[Math.floor(Math.random() * expCats.length)];
        const amt = Math.floor(Math.random() * 800) + 200;
        const exp = await db.expense.create({
          data: { shopId: shop.id, category: cat, amount: amt, note: cat, expenseDate: date },
        });
        await db.transaction.create({
          data: {
            shopId: shop.id,
            type: "expense",
            expenseId: exp.id,
            description: `খরচ - ${cat}`,
            amount: amt,
            paymentMethod: "নগদ",
            createdAt: date,
          },
        });
      }
    }
  }

  return NextResponse.json({ ok: true, shopId: shop.id });
}
