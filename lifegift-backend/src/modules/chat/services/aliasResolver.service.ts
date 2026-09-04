import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AliasResolverService {
  /**
   * Tìm product_id, category_id, brand_id từ câu văn bản của khách hàng
   */
  static async resolveEntities(text: string) {
    const normalizedText = text.toLowerCase().trim();

    // 1. Quét lấy danh sách Alias từ DB (truy vấn linh hoạt cả camelCase và snake_case)
    const prismaAny = prisma as any;
    const [productAliases, categoryAliases, brandAliases] = await Promise.all([
      prismaAny.product_aliases?.findMany() || prismaAny.productAliases?.findMany() || [],
      prismaAny.category_aliases?.findMany() || prismaAny.categoryAliases?.findMany() || [],
      prismaAny.brand_aliases?.findMany() || prismaAny.brandAliases?.findMany() || [],
    ]);

    let matchedProductId: bigint | null = null;
    let matchedCategoryId: bigint | null = null;
    let matchedBrandId: bigint | null = null;

    // 2. Khớp Product Alias (Ưu tiên alias dài nhất)
    const sortedProducts = productAliases.sort((a: any, b: any) => b.alias.length - a.alias.length);
    for (const item of sortedProducts) {
      if (normalizedText.includes(item.alias.toLowerCase())) {
        matchedProductId = item.product_id ?? item.productId ?? null;
        break;
      }
    }

    // 3. Khớp Category Alias
    const sortedCategories = categoryAliases.sort((a: any, b: any) => b.alias.length - a.alias.length);
    for (const item of sortedCategories) {
      if (normalizedText.includes(item.alias.toLowerCase())) {
        matchedCategoryId = item.category_id ?? item.categoryId ?? null;
        break;
      }
    }

    // 4. Khớp Brand Alias
    const sortedBrands = brandAliases.sort((a: any, b: any) => b.alias.length - a.alias.length);
    for (const item of sortedBrands) {
      if (normalizedText.includes(item.alias.toLowerCase())) {
        matchedBrandId = item.brand_id ?? item.brandId ?? null;
        break;
      }
    }

    // 5. Bóc tách giá tiền (300k, 300 nghìn, 300000)
    const priceMatch = normalizedText.match(/(\d+)\s*(k|nghìn|ngan|tr|triệu|đ|vnd)?/i);
    let extractedPrice: number | null = null;
    if (priceMatch) {
      let num = parseInt(priceMatch[1], 10);
      const unit = priceMatch[2]?.toLowerCase();
      if (unit === 'k' || unit === 'nghìn' || unit === 'ngan') num *= 1000;
      if (unit === 'tr' || unit === 'triệu') num *= 1000000;
      extractedPrice = num;
    }

    return {
      productId: matchedProductId,
      categoryId: matchedCategoryId,
      brandId: matchedBrandId,
      extractedPrice: extractedPrice,
    };
  }
}