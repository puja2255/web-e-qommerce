import { PrismaClient, PaymentType, Role } from "@prisma/client";
import { seedState } from "../lib/mock-data";

const prisma = new PrismaClient();

async function main() {
  const admin = await prisma.user.upsert({
    where: { email: "admin@goldenstore.id" },
    update: {
      name: "Admin Golden Store",
      passwordHash: "golden-demo-hash",
      role: Role.ADMIN,
    },
    create: {
      name: "Admin Golden Store",
      email: "admin@goldenstore.id",
      passwordHash: "golden-demo-hash",
      role: Role.ADMIN,
    },
  });

  for (const category of seedState.categories) {
    await prisma.category.upsert({
      where: { slug: category.slug },
      update: {
        name: category.name,
        description: category.description,
        isActive: category.isActive,
      },
      create: {
        name: category.name,
        slug: category.slug,
        description: category.description,
        isActive: category.isActive,
      },
    });
  }

  for (const method of seedState.paymentMethods) {
    const existing = await prisma.paymentMethod.findFirst({
      where: { label: method.label },
    });

    if (existing) {
      await prisma.paymentMethod.update({
        where: { id: existing.id },
        data: {
          type: method.type as PaymentType,
          details: method.details,
          accountName: method.accountName,
          accountNumber: method.accountNumber,
          isActive: method.isActive,
        },
      });
      continue;
    }

    await prisma.paymentMethod.create({
      data: {
        type: method.type as PaymentType,
        label: method.label,
        details: method.details,
        accountName: method.accountName,
        accountNumber: method.accountNumber,
        isActive: method.isActive,
      },
    });
  }

  const paymentMethods = await prisma.paymentMethod.findMany();

  for (const product of seedState.products) {
    const category = await prisma.category.findUnique({
      where: { slug: seedState.categories.find((item) => item.id === product.categoryId)?.slug ?? "" },
    });

    if (!category) {
      continue;
    }

    await prisma.product.upsert({
      where: { slug: product.slug },
      update: {
        name: product.name,
        description: product.description,
        categoryId: category.id,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock,
        sku: product.sku,
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        tags: product.tags,
        rating: product.rating,
        reviewsCount: product.reviewsCount,
        images: {
          deleteMany: {},
          create: product.images.map((url, index) => ({
            url,
            alt: product.name,
            sortOrder: index,
          })),
        },
      },
      create: {
        name: product.name,
        slug: product.slug,
        description: product.description,
        categoryId: category.id,
        price: product.price,
        compareAtPrice: product.compareAtPrice,
        stock: product.stock,
        sku: product.sku,
        isFeatured: product.isFeatured,
        isActive: product.isActive,
        tags: product.tags,
        rating: product.rating,
        reviewsCount: product.reviewsCount,
        images: {
          create: product.images.map((url, index) => ({
            url,
            alt: product.name,
            sortOrder: index,
          })),
        },
      },
    });
  }

  const createdProducts = await prisma.product.findMany({
    include: {
      images: {
        orderBy: { sortOrder: "asc" },
      },
    },
  });

  const productBySeedId = new Map(
    seedState.products.map((product) => [
      product.id,
      createdProducts.find((item) => item.slug === product.slug),
    ]),
  );

  for (const order of seedState.orders) {
    const paymentMethod = paymentMethods.find((method) => method.id === order.paymentMethodId);
    if (!paymentMethod) {
      continue;
    }

    const existing = await prisma.order.findUnique({
      where: { orderNumber: order.orderNumber },
    });

    const itemRows = order.items
      .map((item) => {
        const product = productBySeedId.get(item.productId);
        if (!product) {
          return null;
        }

        return {
          productId: product.id,
          productName: item.productName,
          unitPrice: item.unitPrice,
          quantity: item.quantity,
          subtotal: item.subtotal,
          imageUrl: item.image,
        };
      })
      .filter(Boolean) as Array<{
      productId: string;
      productName: string;
      unitPrice: number;
      quantity: number;
      subtotal: number;
      imageUrl: string;
    }>;

    const payload = {
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      mapsLink: order.mapsLink,
      notes: order.notes,
      status: order.status,
      paymentStatus: order.paymentStatus,
      paymentMethodId: paymentMethod.id,
      paymentProofUrl: order.paymentProofUrl || null,
      totalAmount: order.totalAmount,
      shippingFee: order.shippingFee,
      adminNote: order.adminNote || null,
      items: {
        deleteMany: {},
        create: itemRows,
      },
    };

    if (existing) {
      await prisma.order.update({
        where: { id: existing.id },
        data: payload,
      });
      continue;
    }

    await prisma.order.create({
      data: {
        orderNumber: order.orderNumber,
        ...payload,
      },
    });
  }

  console.log(`Seed selesai. Admin: ${admin.email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
