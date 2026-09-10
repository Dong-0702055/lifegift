import { PrismaClient } from '@prisma/client';
import { ResolvedEntities, ChatResponsePayload } from '../../chat.dto';

const prisma = new PrismaClient();

export class ProductHandler {
  public static async handle(
    intent: string,
    entities: ResolvedEntities
  ): Promise<ChatResponsePayload> {
    switch (intent) {
      case 'kiem_tra_ton_kho':
        return this.checkStock(entities);
      case 'tim_kiem_san_pham':
      case 'chi_tiet_san_pham':
        return this.getProductDetails(entities);
      case 'tim_san_pham_theo_gia':
      case 'goi_y_san_pham':
        return this.searchByPriceOrSuggest(entities);
      case 'hoi_gia':
        return this.getProductPrice(entities);
      case 'hoi_nguon_goc':
        return this.getProductOrigin(entities);
      case 'hoi_thuong_hieu':
        return this.getProductBrand(entities);
      case 'hoi_don_vi':
      case 'hoi_khoi_luong':
        return this.getProductSpec(entities);
      case 'so_sanh_san_pham':
        return this.compareProducts(entities);
      default:
        return { replyMessage: 'Dạ shop chưa tìm thấy thông tin sản phẩm bạn yêu cầu.' };
    }
  }

  private static async checkStock(entities: ResolvedEntities): Promise<ChatResponsePayload> {
    // 1. Kiểm tra theo productId cụ thể
    if (entities.productId) {
      const product = await prisma.products.findUnique({
        where: { id: BigInt(entities.productId) },
        include: { inventories: true },
      });

      if (product) {
        const stock = product.inventories?.reduce((sum, i) => sum + i.quantity, 0) || 0;
        return {
          replyMessage: stock > 0
            ? `Sản phẩm ${product.name} hiện còn ${stock} đơn vị trong kho ạ.`
            : `Rất tiếc, sản phẩm ${product.name} hiện tại đang hết hàng.`,
          data: [product],
        };
      }
    }

    // 2. Tìm theo categoryId hoặc brandId nếu productId null
    if (entities.categoryId || entities.brandId) {
      const products = await prisma.products.findMany({
        where: {
          ...(entities.categoryId && { category_id: BigInt(entities.categoryId) }),
          ...(entities.brandId && { brand_id: BigInt(entities.brandId) }),
        },
        include: { inventories: true },
        take: 5,
      });

      if (products.length > 0) {
        return {
          replyMessage: 'Các sản phẩm phù hợp hiện có sẵn trong kho:',
          data: products,
        };
      }
    }

    return { replyMessage: 'Bạn muốn kiểm tra tồn kho của sản phẩm nào ạ?' };
  }

 private static async searchByPriceOrSuggest(entities: ResolvedEntities): Promise<ChatResponsePayload> {
  let priceQuery: any = {};

  if ((entities.minPrice !== undefined && entities.minPrice !== null) || 
      (entities.maxPrice !== undefined && entities.maxPrice !== null)) {
    priceQuery = {
      ...(entities.minPrice !== null && entities.minPrice !== undefined && { gte: entities.minPrice }),
      ...(entities.maxPrice !== null && entities.maxPrice !== undefined && { lte: entities.maxPrice }),
    };
  } else if (entities.extractedPrice) {
    priceQuery = {
      gte: entities.extractedPrice * 0.8,
      lte: entities.extractedPrice * 1.2,
    };
  }

  // Lọc sản phẩm theo danh mục, thương hiệu hoặc khoảng giá
  let products = await prisma.products.findMany({
    where: {
      ...(Object.keys(priceQuery).length > 0 && { price: priceQuery }),
      ...(entities.categoryId && { category_id: BigInt(entities.categoryId) }),
      ...(entities.brandId && { brand_id: BigInt(entities.brandId) }),
    },
    include: { inventories: true },
    take: 5,
  });

  // Fallback: Nếu không tìm thấy sản phẩm theo danh mục cụ thể, lấy danh sách sản phẩm nổi bật
  if (products.length === 0 && !Object.keys(priceQuery).length) {
    products = await prisma.products.findMany({
      include: { inventories: true },
      take: 5,
    });
  }

  const hasPriceFilter = Object.keys(priceQuery).length > 0;

  return {
    replyMessage: products.length > 0
      ? (hasPriceFilter 
          ? 'Shop gợi ý các sản phẩm phù hợp với khoảng giá của bạn:' 
          : 'Shop gợi ý các sản phẩm phù hợp cho nhu cầu của bạn ạ:')
      : 'Rất tiếc, hiện tại không tìm thấy sản phẩm phù hợp.',
    data: products,
  };
}

  private static async getProductPrice(entities: ResolvedEntities): Promise<ChatResponsePayload> {
    if (entities.productId) {
      const product = await prisma.products.findUnique({ 
        where: { id: BigInt(entities.productId) } 
      });

      if (product) {
        const formattedPrice = Number(product.price).toLocaleString('vi-VN');
        return {
          replyMessage: `Giá của ${product.name} hiện tại là ${formattedPrice}đ ạ.`,
          data: [product],
        };
      }
    }

    if (entities.categoryId || entities.brandId) {
      const products = await prisma.products.findMany({
        where: {
          ...(entities.categoryId && { category_id: BigInt(entities.categoryId) }),
          ...(entities.brandId && { brand_id: BigInt(entities.brandId) }),
        },
        take: 5,
      });

      if (products.length > 0) {
        return {
          replyMessage: 'Bảng giá các sản phẩm bạn quan tâm:',
          data: products,
        };
      }
    }

    return { replyMessage: 'Bạn muốn tham khảo giá của sản phẩm nào ạ?' };
  }

  private static async getProductOrigin(entities: ResolvedEntities): Promise<ChatResponsePayload> {
    if (entities.productId) {
      const product = await prisma.products.findUnique({
        where: { id: BigInt(entities.productId) },
      });

      if (product) {
        return {
          replyMessage: product.origin
            ? `Sản phẩm ${product.name} có xuất xứ từ ${product.origin}.`
            : `Sản phẩm ${product.name} được thu hoạch và chế biến tại các vùng đặc sản Việt Nam.`,
          data: [product],
        };
      }
    }

    return {
      replyMessage: 'Tất cả nông sản tại LifeGift đều có nguồn gốc rõ ràng từ Đắk Lắk, Tây Bắc, Lâm Đồng...',
    };
  }

  private static async getProductBrand(entities: ResolvedEntities): Promise<ChatResponsePayload> {
  // 1. Trường hợp người dùng hỏi thương hiệu của 1 sản phẩm cụ thể
  if (entities.productId) {
    const product = await prisma.products.findUnique({
      where: { id: BigInt(entities.productId) },
      include: { brands: true },
    });

    if (product) {
      return {
        replyMessage: `Sản phẩm ${product.name} thuộc thương hiệu ${product.brands?.name || 'LifeGift Select'}.`,
        data: [product],
      };
    }
  }

  // 2. Trường hợp người dùng tìm danh sách sản phẩm theo Thương hiệu (brandId)
  if (entities.brandId) {
    const products = await prisma.products.findMany({
      where: { brand_id: BigInt(entities.brandId) },
      include: { brands: true },
      take: 5,
    });

    if (products.length > 0) {
      const brandName = products[0].brands?.name || 'yêu cầu';
      return {
        replyMessage: `Các sản phẩm thuộc thương hiệu ${brandName}:`,
        data: products,
      };
    }
  }

  return {
    replyMessage: 'Sản phẩm này thuộc các thương hiệu nông sản chính hãng hợp tác cùng LifeGift ạ.',
  };
}

  private static async getProductSpec(entities: ResolvedEntities): Promise<ChatResponsePayload> {
    if (entities.productId) {
      const product = await prisma.products.findUnique({
        where: { id: BigInt(entities.productId) },
      });

      if (product) {
        return {
          replyMessage: `Quy cách đóng gói của ${product.name}: ${product.unit || 'Theo hộp/túi chuẩn'}.`,
          data: [product],
        };
      }
    }

    return {
      replyMessage: 'Bạn muốn xem quy cách đóng gói/khối lượng của sản phẩm nào ạ?',
    };
  }

  private static async getProductDetails(entities: ResolvedEntities): Promise<ChatResponsePayload> {
  // 1. Nếu có productId cụ thể
  if (entities.productId) {
    const product = await prisma.products.findUnique({
      where: { id: BigInt(entities.productId) },
    });

    if (product) {
      return {
        replyMessage: `Thông tin chi tiết ${product.name}: ${product.description || 'Sản phẩm chất lượng cao.'}`,
        data: [product],
      };
    }
  }

  // 2. Nếu tìm theo Danh mục (categoryId) hoặc Thương hiệu (brandId)
  if (entities.categoryId || entities.brandId) {
    const products = await prisma.products.findMany({
      where: {
        ...(entities.categoryId && { category_id: BigInt(entities.categoryId) }),
        ...(entities.brandId && { brand_id: BigInt(entities.brandId) }),
      },
      take: 5,
    });

    if (products.length > 0) {
      return {
        replyMessage: 'Dưới đây là danh sách sản phẩm thuộc nhóm bạn yêu cầu:',
        data: products,
      };
    }
  }

  // 3. FALLBACK: Nếu không có entity nào khớp (như câu "tôi muốn bỏng ngô")
  // Lấy các sản phẩm nổi bật (is_featured: true) để làm gợi ý
  const featuredProducts = await prisma.products.findMany({
    where: { is_featured: true },
    take: 5,
  });

  return {
    replyMessage: 'Rất tiếc, shop chưa có sản phẩm bạn tìm kiếm. Bạn có thể tham khảo một số sản phẩm nổi bật bên dưới nhé:',
    data: featuredProducts,
  };
}

  private static async compareProducts(entities: ResolvedEntities): Promise<ChatResponsePayload> {
    const products = await prisma.products.findMany({ take: 2 });
    return {
      replyMessage: 'Mỗi dòng sản phẩm đều có hương vị đặc trưng riêng. Bạn tham khảo thông tin sản phẩm bên dưới nhé:',
      data: products,
    };
  }
}