import prisma from '../../config/database';
import { CategoryDto, CategoryResponse, CategoryStatus } from './category.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class CategoryService {
  // Map Prisma Model sang Response DTO
  private static mapToResponse(category: any): CategoryResponse {
    return {
      id: category.id.toString(),
      parentId: category.parent_id ? category.parent_id.toString() : null,
      name: category.name,
      slug: category.slug,
      description: category.description,
      imageUrl: category.image_url,
      status: category.status,
      createdAt: category.created_at,
      updatedAt: category.updated_at,
    };
  }

  // 1. Lấy danh sách Category đang ACTIVE
  public static async getActiveCategories(): Promise<CategoryResponse[]> {
    const categories = await prisma.categories.findMany({
      where: { status: CategoryStatus.ACTIVE },
      orderBy: { name: 'asc' },
    });
    return categories.map((cat) => this.mapToResponse(cat));
  }

  // 2. Lấy chi tiết Category theo ID
  public static async getById(id: number): Promise<CategoryResponse> {
    const category = await prisma.categories.findUnique({
      where: { id },
    });
    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }
    return this.mapToResponse(category);
  }

  // 3. Tạo mới Category
  public static async create(data: CategoryDto): Promise<CategoryResponse> {
    const trimmedName = data.name.trim();
    const trimmedSlug = data.slug.trim();

    // Check trùng name (Ignore case)
    const existingName = await prisma.categories.findFirst({
      where: { name: { equals: trimmedName } },
    });
    if (existingName) {
      throw new Error('Danh mục đã tồn tại');
    }

    // Check trùng slug (Ignore case)
    const existingSlug = await prisma.categories.findFirst({
      where: { slug: { equals: trimmedSlug } },
    });
    if (existingSlug) {
      throw new Error('Slug đã tồn tại');
    }

    // Check parentId nếu có
    if (data.parentId) {
      const parent = await prisma.categories.findUnique({
        where: { id: Number(data.parentId) },
      });
      if (!parent) {
        throw new Error('Không tìm thấy danh mục cha');
      }
    }

    const now = getVietNamDateTime();
    const created = await prisma.categories.create({
      data: {
        name: trimmedName,
        slug: trimmedSlug,
        description: data.description || null,
        image_url: data.imageUrl || null,
        status: data.status || CategoryStatus.ACTIVE,
        parent_id: data.parentId ? BigInt(data.parentId) : null,
        created_at: now,
        updated_at: now,
      },
    });

    return this.mapToResponse(created);
  }

  // 4. Cập nhật Category
  public static async update(id: number, data: CategoryDto): Promise<CategoryResponse> {
    const category = await prisma.categories.findUnique({
      where: { id },
    });
    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }

    const trimmedName = data.name.trim();
    const trimmedSlug = data.slug.trim();

    // Check trùng name
    if (category.name.toLowerCase() !== trimmedName.toLowerCase()) {
      const existingName = await prisma.categories.findFirst({
        where: { name: { equals: trimmedName } },
      });
      if (existingName) throw new Error('Tên danh mục đã tồn tại');
    }

    // Check trùng slug
    if (category.slug.toLowerCase() !== trimmedSlug.toLowerCase()) {
      const existingSlug = await prisma.categories.findFirst({
        where: { slug: { equals: trimmedSlug } },
      });
      if (existingSlug) throw new Error('Slug đã tồn tại');
    }

    // Check parentId không thể là chính nó
    let parentIdValue: bigint | null = null;
    if (data.parentId) {
      if (Number(data.parentId) === id) {
        throw new Error('Danh mục không thể là cha của chính nó');
      }
      const parent = await prisma.categories.findUnique({
        where: { id: Number(data.parentId) },
      });
      if (!parent) {
        throw new Error('Không tìm thấy danh mục cha');
      }
      parentIdValue = BigInt(data.parentId);
    }

    const updated = await prisma.categories.update({
      where: { id },
      data: {
        name: trimmedName,
        slug: trimmedSlug,
        description: data.description !== undefined ? data.description : category.description,
        image_url: data.imageUrl !== undefined ? data.imageUrl : category.image_url,
        status: data.status || category.status,
        parent_id: parentIdValue,
        updated_at: getVietNamDateTime(),
      },
    });

    return this.mapToResponse(updated);
  }

  // 5. Deactivate Category
  public static async deactivate(id: number): Promise<void> {
    const category = await prisma.categories.findUnique({ where: { id } });
    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }
    await prisma.categories.update({
      where: { id },
      data: {
        status: CategoryStatus.INACTIVE,
        updated_at: getVietNamDateTime(),
      },
    });
  }

  // 6. Activate Category
  public static async activate(id: number): Promise<void> {
    const category = await prisma.categories.findUnique({ where: { id } });
    if (!category) {
      throw new Error('Không tìm thấy danh mục');
    }
    await prisma.categories.update({
      where: { id },
      data: {
        status: CategoryStatus.ACTIVE,
        updated_at: getVietNamDateTime(),
      },
    });
  }
}