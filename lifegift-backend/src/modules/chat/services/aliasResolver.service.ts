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
    const matchedCategoryIds: bigint[] = [];
    let matchedBrandId: bigint | null = null;
    const matchedBrandIds: bigint[] = [];

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
        const categoryId = item.category_id ?? item.categoryId ?? null;
        if (categoryId !== null && !matchedCategoryIds.some((id) => id === categoryId)) {
          matchedCategoryIds.push(categoryId);
        }
      }
    }
    matchedCategoryId = matchedCategoryIds[0] ?? null;

    // 4. Khớp Brand Alias
    const sortedBrands = brandAliases.sort((a: any, b: any) => b.alias.length - a.alias.length);
    for (const item of sortedBrands) {
      if (normalizedText.includes(item.alias.toLowerCase())) {
        const brandId = item.brand_id ?? item.brandId ?? null;
        if (brandId !== null && !matchedBrandIds.some((id) => id === brandId)) {
          matchedBrandIds.push(brandId);
        }
      }
    }
    matchedBrandId = matchedBrandIds[0] ?? null;

    // 5. Bóc tách địa điểm xuất xứ, ưu tiên vùng lớn trước địa danh cụ thể
    const originAliases = [
      'tây nguyên', 'đắk lắk', 'dak lak', 'buôn ma thuột', 'đà lạt', 'cầu đất', 'lâm đồng',
      'tây bắc', 'sơn la', 'hà giang', 'bình phước', 'điện biên', 'lai châu', 'lào cai',
      'yên bái', 'hòa bình', 'gia lai', 'kon tum', 'đắk nông', 'hà nội',
    ];
    const knownOrigin = originAliases
      .sort((a, b) => b.length - a.length)
      .find((alias) => normalizedText.includes(alias)) || null;
    const originPhraseMatch = normalizedText.match(
      /(?:xuất xứ|nguồn gốc|đến từ|sản xuất tại|trồng tại|thu hoạch tại)\s+([^,.!?]+)/i
    );
    const origin = knownOrigin || originPhraseMatch?.[1]?.trim() || null;

    // 6. Bóc tách giá và hướng lọc (trên, dưới hoặc một khoảng giá)
    const pricePattern = '(\\d+(?:[.,]\\d+)?)\\s*(k|nghìn|ngan|tr|triệu|đ|vnd)\\b';
    const parsePrice = (value: string, unit: string): number => {
      let num = parseFloat(value.replace(',', '.'));
      const normalizedUnit = unit.toLowerCase();
      if (['k', 'nghìn', 'ngan'].includes(normalizedUnit)) num *= 1000;
      if (['tr', 'triệu'].includes(normalizedUnit)) num *= 1000000;
      return num;
    };

    let extractedPrice: number | null = null;
    let minPrice: number | null = null;
    let maxPrice: number | null = null;

    const rangeMatch = normalizedText.match(
      new RegExp(`(?:từ\\s*)?${pricePattern}\\s*(?:đến|tới|-|–)\\s*${pricePattern}`, 'i')
    );
    if (rangeMatch) {
      minPrice = parsePrice(rangeMatch[1], rangeMatch[2]);
      maxPrice = parsePrice(rangeMatch[3], rangeMatch[4]);
    } else {
      const priceMatch = normalizedText.match(new RegExp(pricePattern, 'i'));
      if (priceMatch) {
        extractedPrice = parsePrice(priceMatch[1], priceMatch[2]);
        const hasLowerBound = /(?:trên|hơn|từ|>=|tối thiểu|ít nhất|thấp nhất)/i.test(normalizedText);
        const hasUpperBound = /(?:dưới|ít hơn|đến|<=|tối đa|cao nhất)/i.test(normalizedText);

        if (hasLowerBound && !hasUpperBound) minPrice = extractedPrice;
        if (hasUpperBound && !hasLowerBound) maxPrice = extractedPrice;
      }
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
      categoryIds: matchedCategoryIds,
      brandId: matchedBrandId,
      brandIds: matchedBrandIds,
      origin,
      minPrice,
      maxPrice,
      extractedPrice: extractedPrice,
      quantity: quantity,
    };
  }
}