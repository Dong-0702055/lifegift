import { PrismaClient } from '@prisma/client';
import { ResolvedEntities, ChatResponsePayload } from '../../chat.dto';

const prisma = new PrismaClient();

export class ProductHandler {
  private static toBigIntIds(
    primaryId: bigint | number | null | undefined,
    ids: Array<bigint | number> | undefined
  ): bigint[] {
    const values = [...(ids || []), ...(primaryId !== null && primaryId !== undefined ? [primaryId] : [])];
    return [...new Set(values.map((id) => BigInt(id)))];
  }

  private static getOriginKeywords(origin: string): string[] {
    const normalizedOrigin = origin.toLowerCase();
    if (normalizedOrigin === 'tây nguyên') {
      return ['tây nguyên', 'đắk lắk', 'buôn ma thuột', 'đắk nông', 'gia lai', 'kon tum', 'lâm đồng', 'đà lạt', 'cầu đất'];
    }
    if (normalizedOrigin === 'tây bắc') {
      return ['tây bắc', 'sơn la', 'điện biên', 'lai châu', 'lào cai', 'yên bái', 'hòa bình'];
    }
    return [origin];
  }

  private static buildProductWhere(entities: ResolvedEntities): Record<string, any> {
    const categoryIds = this.toBigIntIds(entities.categoryId, entities.categoryIds);
    const brandIds = this.toBigIntIds(entities.brandId, entities.brandIds);
    const where: Record<string, any> = {
      ...(categoryIds.length > 0 && { category_id: { in: categoryIds } }),
      ...(brandIds.length > 0 && { brand_id: { in: brandIds } }),
    };

    if (entities.origin) {
      where.OR = this.getOriginKeywords(entities.origin).map((keyword) => ({
        origin: { contains: keyword },
      }));
    }

    const priceQuery = {
      ...(entities.minPrice !== null && entities.minPrice !== undefined && { gte: entities.minPrice }),
      ...(entities.maxPrice !== null && entities.maxPrice !== undefined && { lte: entities.maxPrice }),
    };
    if (Object.keys(priceQuery).length > 0) {
      where.price = priceQuery;
    } else if (entities.extractedPrice) {
      where.price = {
        gte: entities.extractedPrice * 0.8,
        lte: entities.extractedPrice * 1.2,
      };
    }
    return where;
  }

  private static describeFilters(entities: ResolvedEntities): string {
    const categoryNames: Record<string, string> = {
      '4': 'cà phê',
      '5': 'trà',
      '6': 'hạt dinh dưỡng',
      '7': 'đặc sản Tây Bắc',
    };
    const categoryIds = this.toBigIntIds(entities.categoryId, entities.categoryIds);
    const categories = categoryIds.map((id) => categoryNames[id.toString()] || 'nhóm sản phẩm').filter(
      (name, index, values) => values.indexOf(name) === index
    );
    const conditions: string[] = [];
    if (categories.length > 0) conditions.push(categories.join(' và '));
    if (entities.origin) conditions.push(`có xuất xứ từ ${entities.origin}`);
    if (entities.minPrice !== null && entities.minPrice !== undefined) {
      conditions.push(`từ ${Number(entities.minPrice).toLocaleString('vi-VN')}đ trở lên`);
    }
    if (entities.maxPrice !== null && entities.maxPrice !== undefined) {
      conditions.push(`không quá ${Number(entities.maxPrice).toLocaleString('vi-VN')}đ`);
    }
    return conditions.join(', ');
  }

  /**
   * Helper Mapper: Chuyển đổi dữ liệu Prisma (snake_case) sang định dạng Chuẩn DTO (camelCase)
   * và trích xuất hình ảnh, tên danh mục, tên thương hiệu, cùng số lượng tồn kho.
   */
  private static formatProductResponse(product: any) {
    if (!product) return null;

    // Lấy danh sách URL hình ảnh từ bảng product_images
    const images = product.product_images
      ? product.product_images.map((img: any) => img.image_url)
      : [];

    // 1. Tính tổng số lượng tồn kho thực tế từ mảng inventories
    const totalStockQuantity = product.inventories
      ? product.inventories.reduce((sum: number, i: any) => sum + (i.quantity || 0), 0)
      : 0;

    // 2. Tính tổng số lượng khả dụng (có thể bán, chưa bị khóa/đặt cọc)
    const totalAvailableQuantity = product.inventories
      ? product.inventories.reduce(
          (sum: number, i: any) =>
            sum + (i.available_quantity ?? Math.max((i.quantity || 0) - (i.reserved_quantity || 0), 0)),
          0
        )
      : 0;

    return {
      id: Number(product.id),
      name: product.name,
      slug: product.slug,
      sku: product.sku,
      description: product.description,
      shortDescription: product.short_description,
      price: Number(product.price),
      salePrice: product.sale_price ? Number(product.sale_price) : null,
      
      // Bổ sung & thay thế các trường tồn kho
      totalStockQuantity,
      totalAvailableQuantity,

      unit: product.unit,
      origin: product.origin,
      isFeatured: product.is_featured,
      status: product.status,
      categoryId: product.category_id ? Number(product.category_id) : null,
      categoryName: product.categories?.name || null,
      brandId: product.brand_id ? Number(product.brand_id) : null,
      brandName: product.brands?.name || null,
      images: images,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };
  }

  // Khai báo include chuẩn cho tất cả các query Prisma (Đã có inventories: true)
  private static readonly defaultIncludes = {
    categories: true,
    brands: true,
    product_images: {
      orderBy: { sort_order: 'asc' as const },
    },
    inventories: true,
  };

  public static async handle(
    intent: string,
    entities: ResolvedEntities,
    viewedProductIds: number[] = []
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
      case 'xem_san_pham_khac':
        return this.getOtherFeaturedProducts(viewedProductIds);
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

  private static async getOtherFeaturedProducts(viewedProductIds: number[]): Promise<ChatResponsePayload> {
    const excludedIds = viewedProductIds
      .filter((id) => Number.isInteger(Number(id)) && Number(id) > 0)
      .map((id) => BigInt(id));
    const products = await prisma.products.findMany({
      where: {
        is_featured: true,
        ...(excludedIds.length > 0 && { id: { notIn: excludedIds } }),
      },
      include: this.defaultIncludes,
      take: 5,
    });

    return {
      replyMessage: products.length > 0
        ? 'Dưới đây là 5 sản phẩm nổi bật khác với những sản phẩm bạn đã xem trước đó ạ:'
        : 'Bạn đã xem hết các sản phẩm nổi bật hiện có. Bạn muốn shop tìm theo danh mục hoặc mức giá nào không ạ?',
      data: products.map((product) => this.formatProductResponse(product)),
    };
  }

  private static async checkStock(entities: ResolvedEntities): Promise<ChatResponsePayload> {
    if (entities.productId) {
      const product = await prisma.products.findUnique({
        where: { id: BigInt(entities.productId) },
        include: this.defaultIncludes,
      });

      if (product) {
        const stock = product.inventories?.reduce((sum, i) => sum + i.quantity, 0) || 0;
        return {
          replyMessage: stock > 0
            ? `Sản phẩm ${product.name} hiện còn ${stock} đơn vị trong kho ạ.`
            : `Rất tiếc, sản phẩm ${product.name} hiện tại đang hết hàng.`,
          data: [this.formatProductResponse(product)],
        };
      }
    }

    if (entities.categoryId || entities.categoryIds?.length || entities.brandId || entities.brandIds?.length || entities.origin) {
      const products = await prisma.products.findMany({
        where: this.buildProductWhere(entities),
        include: this.defaultIncludes,
        take: 5,
      });

      if (products.length > 0) {
        return {
          replyMessage: `Các sản phẩm ${this.describeFilters(entities)} hiện có sẵn trong kho:`,
          data: products.map((p) => this.formatProductResponse(p)),
        };
      }
    }

    return { replyMessage: 'Bạn muốn kiểm tra tồn kho của sản phẩm nào ạ?' };
  }

  private static async searchByPriceOrSuggest(entities: ResolvedEntities): Promise<ChatResponsePayload> {
    let products = await prisma.products.findMany({
      where: this.buildProductWhere(entities),
      include: this.defaultIncludes,
      take: 5,
    });

    if (products.length === 0 && !entities.origin && !entities.categoryId && !entities.categoryIds?.length && !entities.brandId && !entities.brandIds?.length) {
      products = await prisma.products.findMany({
        include: this.defaultIncludes,
        take: 5,
      });
    }

    const hasPriceFilter = Boolean(entities.minPrice || entities.maxPrice || entities.extractedPrice);
    const priceDescription = entities.minPrice !== null && entities.minPrice !== undefined
      && entities.maxPrice !== null && entities.maxPrice !== undefined
      ? 'trong khoảng giá bạn yêu cầu'
      : entities.minPrice !== null && entities.minPrice !== undefined
        ? `từ ${Number(entities.minPrice).toLocaleString('vi-VN')}đ trở lên`
        : entities.maxPrice !== null && entities.maxPrice !== undefined
          ? `không quá ${Number(entities.maxPrice).toLocaleString('vi-VN')}đ`
          : 'phù hợp với khoảng giá của bạn';

    return {
      replyMessage: products.length > 0
        ? (hasPriceFilter 
            ? `Shop gợi ý các sản phẩm ${this.describeFilters(entities) || priceDescription}:`
            : 'Shop gợi ý các sản phẩm nổi bật, bán chạy bên shop mời bạn xem và tham khảo ạ:')
        : 'Rất tiếc, hiện tại không tìm thấy sản phẩm phù hợp.',
      data: products.map((p) => this.formatProductResponse(p)),
    };
  }

  private static async getProductPrice(entities: ResolvedEntities): Promise<ChatResponsePayload> {
    if (entities.productId) {
      const product = await prisma.products.findUnique({ 
        where: { id: BigInt(entities.productId) },
        include: this.defaultIncludes,
      });

      if (product) {
        const formattedPrice = Number(product.price).toLocaleString('vi-VN');
        return {
          replyMessage: `Giá của ${product.name} hiện tại là ${formattedPrice}đ ạ.`,
          data: [this.formatProductResponse(product)],
        };
      }
    }

    if (entities.categoryId || entities.categoryIds?.length || entities.brandId || entities.brandIds?.length || entities.origin) {
      const products = await prisma.products.findMany({
        where: this.buildProductWhere(entities),
        include: this.defaultIncludes,
        take: 5,
      });

      if (products.length > 0) {
        return {
          replyMessage: `Bảng giá các sản phẩm ${this.describeFilters(entities)}:`,
          data: products.map((p) => this.formatProductResponse(p)),
        };
      }
    }

    return { replyMessage: 'Bạn muốn tham khảo giá của sản phẩm nào ạ?' };
  }

  private static async getProductOrigin(entities: ResolvedEntities): Promise<ChatResponsePayload> {
    if (entities.productId) {
      const product = await prisma.products.findUnique({
        where: { id: BigInt(entities.productId) },
        include: this.defaultIncludes,
      });

      if (product) {
        return {
          replyMessage: product.origin
            ? `Sản phẩm ${product.name} có xuất xứ từ ${product.origin}.`
            : `Sản phẩm ${product.name} được thu hoạch và chế biến tại các vùng đặc sản Việt Nam.`,
          data: [this.formatProductResponse(product)],
        };
      }
    }

    if (entities.origin || entities.categoryId || entities.categoryIds?.length || entities.brandId || entities.brandIds?.length) {
      const products = await prisma.products.findMany({
        where: this.buildProductWhere(entities),
        include: this.defaultIncludes,
        take: 5,
      });

      if (products.length > 0) {
        return {
          replyMessage: `Các sản phẩm ${this.describeFilters(entities)}:`,
          data: products.map((p) => this.formatProductResponse(p)),
        };
      }

      return {
        replyMessage: `Hiện chưa tìm thấy sản phẩm ${this.describeFilters(entities) || 'phù hợp với yêu cầu'}.`,
        data: [],
      };
    }

    return {
      replyMessage: 'Tất cả nông sản tại LifeGift đều có nguồn gốc rõ ràng từ Đắk Lắk, Tây Bắc, Lâm Đồng...',
    };
  }

  private static async getProductBrand(entities: ResolvedEntities): Promise<ChatResponsePayload> {
    if (entities.productId) {
      const product = await prisma.products.findUnique({
        where: { id: BigInt(entities.productId) },
        include: this.defaultIncludes,
      });

      if (product) {
        return {
          replyMessage: `Sản phẩm ${product.name} thuộc thương hiệu ${product.brands?.name || 'LifeGift Select'}.`,
          data: [this.formatProductResponse(product)],
        };
      }
    }

    if (entities.brandId) {
      const products = await prisma.products.findMany({
        where: { brand_id: BigInt(entities.brandId) },
        include: this.defaultIncludes,
        take: 5,
      });

      if (products.length > 0) {
        const brandName = products[0].brands?.name || 'yêu cầu';
        return {
          replyMessage: `Các sản phẩm thuộc thương hiệu ${brandName}:`,
          data: products.map((p) => this.formatProductResponse(p)),
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
        include: this.defaultIncludes,
      });

      if (product) {
        return {
          replyMessage: `Quy cách đóng gói của ${product.name}: ${product.unit || 'Theo hộp/túi chuẩn'}.`,
          data: [this.formatProductResponse(product)],
        };
      }
    }

    return {
      replyMessage: 'Bạn muốn xem quy cách đóng gói/khối lượng của sản phẩm nào ạ?',
    };
  }

  private static async getProductDetails(entities: ResolvedEntities): Promise<ChatResponsePayload> {
    if (entities.productId) {
      const product = await prisma.products.findUnique({
        where: { id: BigInt(entities.productId) },
        include: this.defaultIncludes,
      });

      if (product) {
        return {
          replyMessage: `Thông tin chi tiết ${product.name}: ${product.description || 'Sản phẩm chất lượng cao.'}`,
          data: [this.formatProductResponse(product)],
        };
      }
    }

    const categoryIds = this.toBigIntIds(entities.categoryId, entities.categoryIds);
    const brandIds = this.toBigIntIds(entities.brandId, entities.brandIds);

    if (categoryIds.length > 0 || brandIds.length > 0 || entities.origin) {
      const products = await prisma.products.findMany({
        where: this.buildProductWhere(entities),
        include: this.defaultIncludes,
        take: 5,
      });

      if (products.length > 0) {
        return {
          replyMessage: `Dưới đây là danh sách sản phẩm ${this.describeFilters(entities)}:`,
          data: products.map((p) => this.formatProductResponse(p)),
        };
      }
    }

    const featuredProducts = await prisma.products.findMany({
      where: { is_featured: true },
      include: this.defaultIncludes,
      take: 5,
    });

    return {
      replyMessage: entities.origin || entities.categoryId || entities.categoryIds?.length
        ? `Rất tiếc, hiện chưa tìm thấy sản phẩm ${this.describeFilters(entities) || 'phù hợp với yêu cầu'}.`
        : 'Rất tiếc, shop chưa có sản phẩm bạn tìm kiếm. Bạn có thể tham khảo một số sản phẩm nổi bật bên dưới nhé:',
      data: featuredProducts.map((p) => this.formatProductResponse(p)),
    };
  }

  private static async compareProducts(entities: ResolvedEntities): Promise<ChatResponsePayload> {
    const products = await prisma.products.findMany({
      include: this.defaultIncludes,
      take: 2,
    });
    return {
      replyMessage: 'Mỗi dòng sản phẩm đều có hương vị đặc trưng riêng. Bạn tham khảo thông tin sản phẩm bên dưới nhé:',
      data: products.map((p) => this.formatProductResponse(p)),
    };
  }
}