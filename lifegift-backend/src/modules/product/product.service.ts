import prisma from '../../config/database';
import { ProductDto, ProductResponse, PricingType, StockStatus, ProductStatus } from './product.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class ProductService {
  private static mapToResponse(product: any): ProductResponse {
    const images = (product.product_images || []).map((img: any) => ({
      id: img.id.toString(),
      imageUrl: img.image_url,
      isPrimary: img.is_primary,
      sortOrder: img.sort_order,
    }));

    return {
      id: product.id.toString(),
      categoryId: product.category_id ? product.category_id.toString() : null,
      categoryName: product.categories?.name || null,
      brandId: product.brand_id ? product.brand_id.toString() : null,
      brandName: product.brands?.name || null,
      sku: product.sku,
      name: product.name,
      slug: product.slug,
      description: product.description,
      shortDescription: product.short_description,
      price: Number(product.price),
      salePrice: product.sale_price !== null ? Number(product.sale_price) : null,
      unit: product.unit,
      weight: product.weight !== null ? Number(product.weight) : null,
      origin: product.origin,
      pricingType: product.pricing_type,
      stockStatus: product.stock_status,
      status: product.status,
      isFeatured: product.is_featured,
      images,
      createdAt: product.created_at,
      updatedAt: product.updated_at,
    };
  }

  // 1. Lấy danh sách sản phẩm ACTIVE
  public static async getActiveProducts(): Promise<ProductResponse[]> {
    const products = await prisma.products.findMany({
      where: { status: ProductStatus.ACTIVE },
      include: {
        categories: true,
        brands: true,
        product_images: { orderBy: { sort_order: 'asc' } },
      },
      orderBy: { name: 'asc' },
    });
    return products.map((p) => this.mapToResponse(p));
  }

  // 2. Lấy chi tiết sản phẩm
  public static async getById(id: number): Promise<ProductResponse> {
    const product = await prisma.products.findUnique({
      where: { id },
      include: {
        categories: true,
        brands: true,
        product_images: { orderBy: { sort_order: 'asc' } },
      },
    });
    if (!product) throw new Error('Không tìm thấy sản phẩm');
    return this.mapToResponse(product);
  }

  // 3. Tạo mới sản phẩm
  public static async create(data: ProductDto): Promise<ProductResponse> {
    const sku = data.sku.trim();
    const slug = data.slug.trim();

    const existingSku = await prisma.products.findFirst({
      where: { sku: { equals: sku } },
    });
    if (existingSku) throw new Error('SKU đã tồn tại');

    const existingSlug = await prisma.products.findFirst({
      where: { slug: { equals: slug } },
    });
    if (existingSlug) throw new Error('Slug đã tồn tại');

    // Check Category
    const categoryId = BigInt(data.categoryId);
    const category = await prisma.categories.findUnique({ where: { id: categoryId } });
    if (!category) throw new Error('Không tìm thấy danh mục');

    // Check Brand
    let brandId: bigint | null = null;
    if (data.brandId) {
      brandId = BigInt(data.brandId);
      const brand = await prisma.brands.findUnique({ where: { id: brandId } });
      if (!brand) throw new Error('Không tìm thấy thương hiệu');
    }

    const now = getVietNamDateTime();

    const imageCreates = (data.imageUrls || [])
      .filter((url) => url && url.trim().length > 0)
      .map((url, index) => ({
        image_url: url.trim(),
        sort_order: index,
        is_primary: index === 0,
        created_at: now,
      }));

    const created = await prisma.products.create({
      data: {
        category_id: categoryId,
        brand_id: brandId,
        sku,
        name: data.name.trim(),
        slug,
        description: data.description || null,
        short_description: data.shortDescription || null,
        price: data.price,
        sale_price: data.salePrice || null,
        unit: data.unit ? data.unit.trim() : 'Sản phẩm',
        weight: data.weight || null,
        origin: data.origin || null,
        pricing_type: data.pricingType || PricingType.FIXED_PRICE,
        stock_status: data.stockStatus || StockStatus.IN_STOCK,
        status: data.status || ProductStatus.ACTIVE,
        is_featured: data.isFeatured ?? false,
        created_at: now,
        updated_at: now,
        product_images: {
          create: imageCreates,
        },
      },
      include: {
        categories: true,
        brands: true,
        product_images: { orderBy: { sort_order: 'asc' } },
      },
    });

    return this.mapToResponse(created);
  }

  // 4. Cập nhật sản phẩm
  public static async update(id: number, data: ProductDto): Promise<ProductResponse> {
    const product = await prisma.products.findUnique({ where: { id } });
    if (!product) throw new Error('Không tìm thấy sản phẩm');

    const sku = data.sku.trim();
    const slug = data.slug.trim();

    if (product.sku.toLowerCase() !== sku.toLowerCase()) {
      const existingSku = await prisma.products.findFirst({
        where: { sku: { equals: sku } },
      });
      if (existingSku) throw new Error('SKU đã tồn tại');
    }

    if (product.slug.toLowerCase() !== slug.toLowerCase()) {
      const existingSlug = await prisma.products.findFirst({
        where: { slug: { equals: slug } },
      });
      if (existingSlug) throw new Error('Slug đã tồn tại');
    }

    const categoryId = BigInt(data.categoryId);
    const category = await prisma.categories.findUnique({ where: { id: categoryId } });
    if (!category) throw new Error('Không tìm thấy danh mục');

    let brandId: bigint | null = null;
    if (data.brandId) {
      brandId = BigInt(data.brandId);
      const brand = await prisma.brands.findUnique({ where: { id: brandId } });
      if (!brand) throw new Error('Không tìm thấy thương hiệu');
    }

    const now = getVietNamDateTime();

    const imageCreates = (data.imageUrls || [])
      .filter((url) => url && url.trim().length > 0)
      .map((url, index) => ({
        image_url: url.trim(),
        sort_order: index,
        is_primary: index === 0,
        created_at: now,
      }));

    const updated = await prisma.$transaction(async (tx) => {
      await tx.product_images.deleteMany({
        where: { product_id: id },
      });

      return await tx.products.update({
        where: { id },
        data: {
          category_id: categoryId,
          brand_id: brandId,
          sku,
          name: data.name.trim(),
          slug,
          description: data.description || null,
          short_description: data.shortDescription || null,
          price: data.price,
          sale_price: data.salePrice !== undefined ? data.salePrice : null,
          unit: data.unit ? data.unit.trim() : 'Sản phẩm',
          weight: data.weight !== undefined ? data.weight : null,
          origin: data.origin || null,
          pricing_type: data.pricingType || product.pricing_type,
          stock_status: data.stockStatus || product.stock_status,
          status: data.status || product.status,
          is_featured: data.isFeatured !== undefined ? data.isFeatured : product.is_featured,
          updated_at: now,
          product_images: {
            create: imageCreates,
          },
        },
        include: {
          categories: true,
          brands: true,
          product_images: { orderBy: { sort_order: 'asc' } },
        },
      });
    });

    return this.mapToResponse(updated);
  }

  // 5. Vô hiệu hóa sản phẩm (INACTIVE)
  public static async deactivate(id: number): Promise<void> {
    const product = await prisma.products.findUnique({ where: { id } });
    if (!product) throw new Error('Không tìm thấy sản phẩm');

    await prisma.products.update({
      where: { id },
      data: {
        status: ProductStatus.INACTIVE,
        updated_at: getVietNamDateTime(),
      },
    });
  }

  // 6. Kích hoạt lại sản phẩm (ACTIVE)
  public static async activate(id: number): Promise<void> {
    const product = await prisma.products.findUnique({ where: { id } });
    if (!product) throw new Error('Không tìm thấy sản phẩm');

    await prisma.products.update({
      where: { id },
      data: {
        status: ProductStatus.ACTIVE,
        updated_at: getVietNamDateTime(),
      },
    });
  }
  // 7. Lấy danh sách sản phẩm theo Category (chỉ lấy ACTIVE)
  public static async getByCategoryId(categoryId: number): Promise<ProductResponse[]> {
    const products = await prisma.products.findMany({
      where: {
        category_id: BigInt(categoryId),
        status: ProductStatus.ACTIVE,
      },
      include: {
        categories: true,
        brands: true,
        product_images: { orderBy: { sort_order: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    });
    return products.map((p) => this.mapToResponse(p));
  }

  // 8. Lấy danh sách sản phẩm theo Brand (chỉ lấy ACTIVE)
  public static async getByBrandId(brandId: number): Promise<ProductResponse[]> {
    const products = await prisma.products.findMany({
      where: {
        brand_id: BigInt(brandId),
        status: ProductStatus.ACTIVE,
      },
      include: {
        categories: true,
        brands: true,
        product_images: { orderBy: { sort_order: 'asc' } },
      },
      orderBy: { created_at: 'desc' },
    });
    return products.map((p) => this.mapToResponse(p));
  }
}