import prisma from '../../config/database';
import {
  BlogCategoryDto,
  BlogCategoryResponse,
  BlogPostDto,
  BlogPostResponse,
  CategoryStatus,
  PostStatus,
} from './blog.dto';

export class BlogService {
  // Mapping cho Category Response
  private static mapCategoryToResponse(cat: any): BlogCategoryResponse {
    return {
      id: cat.id.toString(),
      name: cat.name,
      slug: cat.slug,
      description: cat.description,
      status: cat.status as CategoryStatus,
    };
  }

  // Mapping cho Post Response
  private static mapPostToResponse(post: any): BlogPostResponse {
    return {
      id: post.id.toString(),
      categoryId: post.category_id.toString(),
      categoryName: post.blog_categories?.name || null,
      authorId: post.author_id.toString(),
      authorName: post.users?.full_name || post.users?.name || null,
      title: post.title,
      slug: post.slug,
      thumbnail: post.thumbnail,
      summary: post.summary,
      content: post.content,
      status: post.status as PostStatus,
      publishedAt: post.published_at,
      createdAt: post.created_at,
      updatedAt: post.updated_at,
    };
  }

  // ================= DÀNH CHO CATEGORY =================
  public static async getActiveCategories(): Promise<BlogCategoryResponse[]> {
    const categories = await prisma.blog_categories.findMany({
      where: { status: CategoryStatus.ACTIVE },
      orderBy: { name: 'asc' },
    });
    return categories.map((c) => this.mapCategoryToResponse(c));
  }

  public static async createCategory(data: BlogCategoryDto): Promise<BlogCategoryResponse> {
    const slug = data.slug.trim();
    const existing = await prisma.blog_categories.findFirst({ where: { slug } });
    if (existing) throw new Error('Slug danh mục đã tồn tại');

    const created = await prisma.blog_categories.create({
      data: {
        name: data.name.trim(),
        slug,
        description: data.description || null,
        status: data.status || CategoryStatus.ACTIVE,
      },
    });

    return this.mapCategoryToResponse(created);
  }

  // ================= DÀNH CHO POST =================
  // 1. Lấy danh sách bài viết PUBLISHED (Public)
  public static async getPublishedPosts(): Promise<BlogPostResponse[]> {
    const posts = await prisma.blog_posts.findMany({
      where: { status: PostStatus.PUBLISHED },
      include: { blog_categories: true, users: true },
      orderBy: { published_at: 'desc' },
    });
    return posts.map((p) => this.mapPostToResponse(p));
  }

  // 2. Lấy chi tiết bài viết qua Slug (Public)
  public static async getPostBySlug(slug: string): Promise<BlogPostResponse> {
    const post = await prisma.blog_posts.findFirst({
      where: { slug, status: PostStatus.PUBLISHED },
      include: { blog_categories: true, users: true },
    });
    if (!post) throw new Error('Bài viết không tồn tại hoặc đã bị ẩn');
    return this.mapPostToResponse(post);
  }

  // 3. Lấy bài viết theo Danh mục (Public)
  public static async getPostsByCategory(categoryId: number | string): Promise<BlogPostResponse[]> {
    const posts = await prisma.blog_posts.findMany({
      where: {
        category_id: BigInt(categoryId),
        status: PostStatus.PUBLISHED,
      },
      include: { blog_categories: true, users: true },
      orderBy: { published_at: 'desc' },
    });
    return posts.map((p) => this.mapPostToResponse(p));
  }

  // 4. Tạo bài viết mới (Admin / Author)
  public static async createPost(authorId: number | string, data: BlogPostDto): Promise<BlogPostResponse> {
    const slug = data.slug.trim();
    const existingSlug = await prisma.blog_posts.findFirst({ where: { slug } });
    if (existingSlug) throw new Error('Slug bài viết đã tồn tại');

    const categoryId = BigInt(data.categoryId);
    const category = await prisma.blog_categories.findUnique({ where: { id: categoryId } });
    if (!category) throw new Error('Không tìm thấy danh mục bài viết');

    const now = new Date();
    const status = data.status || PostStatus.DRAFT;
    const publishedAt = status === PostStatus.PUBLISHED ? now : null;

    const created = await prisma.blog_posts.create({
      data: {
        category_id: categoryId,
        author_id: BigInt(authorId),
        title: data.title.trim(),
        slug,
        thumbnail: data.thumbnail || null,
        summary: data.summary || null,
        content: data.content || null,
        status,
        published_at: publishedAt,
        created_at: now,
        updated_at: now,
      },
      include: { blog_categories: true, users: true },
    });

    return this.mapPostToResponse(created);
  }

  // 5. Cập nhật bài viết (Admin / Author)
  public static async updatePost(id: number | string, data: BlogPostDto): Promise<BlogPostResponse> {
    const post = await prisma.blog_posts.findUnique({ where: { id: BigInt(id) } });
    if (!post) throw new Error('Bài viết không tồn tại');

    const slug = data.slug.trim();
    if (post.slug.toLowerCase() !== slug.toLowerCase()) {
      const existingSlug = await prisma.blog_posts.findFirst({ where: { slug } });
      if (existingSlug) throw new Error('Slug bài viết đã tồn tại');
    }

    const categoryId = BigInt(data.categoryId);
    const category = await prisma.blog_categories.findUnique({ where: { id: categoryId } });
    if (!category) throw new Error('Không tìm thấy danh mục bài viết');

    const now = new Date();
    const newStatus = data.status || (post.status as PostStatus);

    let publishedAt = post.published_at;
    if (newStatus === PostStatus.PUBLISHED && !publishedAt) {
      publishedAt = now;
    }

    const updated = await prisma.blog_posts.update({
      where: { id: BigInt(id) },
      data: {
        category_id: categoryId,
        title: data.title.trim(),
        slug,
        thumbnail: data.thumbnail || null,
        summary: data.summary || null,
        content: data.content || null,
        status: newStatus,
        published_at: publishedAt,
        updated_at: now,
      },
      include: { blog_categories: true, users: true },
    });

    return this.mapPostToResponse(updated);
  }
}