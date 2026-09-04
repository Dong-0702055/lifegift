import prisma from '../../config/database';
import { BrandDto, BrandResponse, BrandStatus } from './brand.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class BrandService {
  private static mapToResponse(brand: any): BrandResponse {
    return {
      id: brand.id.toString(),
      name: brand.name,
      slug: brand.slug,
      description: brand.description,
      logoUrl: brand.logo_url,
      status: brand.status,
      createdAt: brand.created_at,
      updatedAt: brand.updated_at,
    };
  }

  // 1. Lấy danh sách Brand ACTIVE
  public static async getActiveBrands(): Promise<BrandResponse[]> {
    const brands = await prisma.brands.findMany({
      where: { status: BrandStatus.ACTIVE },
      orderBy: { name: 'asc' },
    });
    return brands.map((b) => this.mapToResponse(b));
  }

  // 2. Lấy chi tiết Brand theo ID
  public static async getById(id: number): Promise<BrandResponse> {
    const brand = await prisma.brands.findUnique({
      where: { id },
    });
    if (!brand) {
      throw new Error('Không tìm thấy thương hiệu');
    }
    return this.mapToResponse(brand);
  }

  // 3. Tạo mới Brand
  public static async create(data: BrandDto): Promise<BrandResponse> {
    const trimmedName = data.name.trim();
    const trimmedSlug = data.slug.trim();

    const existingName = await prisma.brands.findFirst({
      where: { name: { equals: trimmedName } },
    });
    if (existingName) throw new Error('Tên thương hiệu đã tồn tại');

    const existingSlug = await prisma.brands.findFirst({
      where: { slug: { equals: trimmedSlug } },
    });
    if (existingSlug) throw new Error('Slug thương hiệu đã tồn tại');

    const now = getVietNamDateTime();
    const created = await prisma.brands.create({
      data: {
        name: trimmedName,
        slug: trimmedSlug,
        description: data.description || null,
        logo_url: data.logoUrl || null,
        status: data.status || BrandStatus.ACTIVE,
        created_at: now,
        updated_at: now,
      },
    });

    return this.mapToResponse(created);
  }

  // 4. Cập nhật Brand
  public static async update(id: number, data: BrandDto): Promise<BrandResponse> {
    const brand = await prisma.brands.findUnique({ where: { id } });
    if (!brand) throw new Error('Không tìm thấy thương hiệu');

    const trimmedName = data.name.trim();
    const trimmedSlug = data.slug.trim();

    if (brand.name.toLowerCase() !== trimmedName.toLowerCase()) {
      const existingName = await prisma.brands.findFirst({
        where: { name: { equals: trimmedName } },
      });
      if (existingName) throw new Error('Tên thương hiệu đã tồn tại');
    }

    if (brand.slug.toLowerCase() !== trimmedSlug.toLowerCase()) {
      const existingSlug = await prisma.brands.findFirst({
        where: { slug: { equals: trimmedSlug } },
      });
      if (existingSlug) throw new Error('Slug thương hiệu đã tồn tại');
    }

    const updated = await prisma.brands.update({
      where: { id },
      data: {
        name: trimmedName,
        slug: trimmedSlug,
        description: data.description !== undefined ? data.description : brand.description,
        logo_url: data.logoUrl !== undefined ? data.logoUrl : brand.logo_url,
        status: data.status || brand.status,
        updated_at: getVietNamDateTime(),
      },
    });

    return this.mapToResponse(updated);
  }

  // 5. Vô hiệu hóa Brand (Soft Delete - INACTIVE)
  public static async deactivate(id: number): Promise<void> {
    const brand = await prisma.brands.findUnique({ where: { id } });
    if (!brand) throw new Error('Không tìm thấy thương hiệu');

    await prisma.brands.update({
      where: { id },
      data: {
        status: BrandStatus.INACTIVE,
        updated_at: getVietNamDateTime(),
      },
    });
  }

  // 6. Kích hoạt lại Brand
  public static async activate(id: number): Promise<void> {
    const brand = await prisma.brands.findUnique({ where: { id } });
    if (!brand) throw new Error('Không tìm thấy thương hiệu');

    await prisma.brands.update({
      where: { id },
      data: {
        status: BrandStatus.ACTIVE,
        updated_at: getVietNamDateTime(),
      },
    });
  }
}