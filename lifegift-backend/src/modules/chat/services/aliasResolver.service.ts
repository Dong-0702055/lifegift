import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export class AliasResolverService {
  /**
   * Tìm product_id, category_id, brand_id, quantity, price từ câu văn bản của khách hàng
   */
  static async resolveEntities(text: string) {
    const normalizedText = text.toLowerCase().trim();

    // 1. Quét lấy danh sách Alias từ DB
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

    // 5. Bóc tách Giá tiền (Ưu tiên số có đơn vị tiền tệ rõ ràng: k, nghìn, tr, đ, vnd)
    let extractedPrice: number | null = null;
    const priceWithUnitRegex = /(\d+(?:\.\d+)?)\s*(k|nghìn|ngan|tr|triệu|đ|vnd)\b/i;
    const priceMatch = normalizedText.match(priceWithUnitRegex);

    if (priceMatch) {
      let num = parseFloat(priceMatch[1]);
      const unit = priceMatch[2].toLowerCase();
      if (['k', 'nghìn', 'ngan'].includes(unit)) num *= 1000;
      if (['tr', 'triệu'].includes(unit)) num *= 1000000;
      extractedPrice = num;
    }

    // 6. Bóc tách Số lượng (Quantity)
    let quantity: number | null = null;

    // Xóa các thông số trọng lượng/dung tích (vd: 500g, 1kg, 250ml) để tránh nhầm số trọng lượng thành số lượng
    const textWithoutWeight = normalizedText.replace(/\d+\s*(g|kg|ml|l)\b/gi, '');

    // Ưu tiên 1: Bắt số đứng trước các từ chỉ quy cách/đơn vị đóng gói (vd: "2 gói", "2000 hộp", "3 cái")
    const unitQtyRegex = /(\d+)\s*(?:cái|chiếc|gói|hộp|chai|lon|bao|kg|g|túi|ly|cốc)\b/i;
    const unitMatch = textWithoutWeight.match(unitQtyRegex);

    if (unitMatch && unitMatch[1]) {
      quantity = parseInt(unitMatch[1], 10);
    } else {
      // Ưu tiên 2: Bắt số đứng sau các cụm từ yêu cầu/hành động (vd: "cho tôi 2000", "lấy 2", "thêm 5")
      const actionQtyRegex = /(?:cho|lấy|thêm|muốn|có|khoảng|sl|số lượng|mua|đặt|bán)\s+(?:tôi|em|mình)?\s*(\d+)\b/i;
      const actionMatch = textWithoutWeight.match(actionQtyRegex);
      if (actionMatch && actionMatch[1]) {
        quantity = parseInt(actionMatch[1], 10);
      }
    }

    // Kiểm tra số hợp lệ (từ 1 đến 10,000) và không bị nhầm trùng với giá tiền bóc tách được
    if (quantity !== null && (quantity <= 0 || quantity > 10000 || quantity === extractedPrice)) {
      quantity = null;
    }

    return {
      productId: matchedProductId,
      categoryId: matchedCategoryId,
      brandId: matchedBrandId,
      extractedPrice: extractedPrice,
      quantity: quantity,
    };
  }
}