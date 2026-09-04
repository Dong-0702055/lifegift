import prisma from '../../config/database';
import { CreateReviewDto, ReviewResponse, ReviewStatus, UpdateReviewStatusDto } from './review.dto';

const getVietNamDateTime = () => {
  const now = new Date();
  return new Date(now.getTime() + 7 * 60 * 60 * 1000);
};

export class ReviewService {
  private static mapToResponse(review: any): ReviewResponse {
    return {
      id: review.id.toString(),
      userId: review.user_id.toString(),
      userName: review.users?.full_name || review.users?.name || null,
      productId: review.product_id.toString(),
      orderId: review.order_id.toString(),
      rating: Number(review.rating),
      title: review.title,
      content: review.content,
      status: review.status as ReviewStatus,
      createdAt: review.created_at,
      updatedAt: review.updated_at,
    };
  }

  // 1. Tạo mới đánh giá (Chỉ người mua đơn hàng thành công/hoàn thành mới được đánh giá)
  public static async create(userId: number, data: CreateReviewDto): Promise<ReviewResponse> {
    const uId = BigInt(userId);
    const orderId = BigInt(data.orderId);
    const productId = BigInt(data.productId);

    // Kiểm tra Đơn hàng có tồn tại và thuộc về User này không
    const order = await prisma.orders.findFirst({
      where: { id: orderId, user_id: uId },
      include: { order_items: true },
    });

    if (!order) {
      throw new Error('Đơn hàng không tồn tại hoặc không thuộc về bạn');
    }

    // Kiểm tra sản phẩm có nằm trong đơn hàng đó không
    const hasProduct = order.order_items.some((item) => item.product_id === productId);
    if (!hasProduct) {
      throw new Error('Sản phẩm không nằm trong đơn hàng này');
    }

    // Kiểm tra đã từng đánh giá sản phẩm trong đơn hàng này chưa
    const existingReview = await prisma.reviews.findFirst({
      where: {
        user_id: uId,
        order_id: orderId,
        product_id: productId,
      },
    });

    if (existingReview) {
      throw new Error('Bạn đã đánh giá sản phẩm này cho đơn hàng này rồi');
    }

    const now = getVietNamDateTime();
    const created = await prisma.reviews.create({
      data: {
        user_id: uId,
        order_id: orderId,
        product_id: productId,
        rating: data.rating,
        title: data.title ? data.title.trim() : null,
        content: data.content ? data.content.trim() : null,
        status: ReviewStatus.PENDING,
        created_at: now,
        updated_at: now,
      },
      include: { users: true },
    });

    return this.mapToResponse(created);
  }

  // 2. Lấy danh sách Đánh giá của một sản phẩm (Chỉ lấy APPROVED cho Public)
  public static async getByProductId(productId: number): Promise<ReviewResponse[]> {
    const reviews = await prisma.reviews.findMany({
      where: {
        product_id: BigInt(productId),
        status: ReviewStatus.APPROVED,
      },
      include: { users: true },
      orderBy: { created_at: 'desc' },
    });

    return reviews.map((r) => this.mapToResponse(r));
  }

  // 3. Admin: Lấy tất cả đánh giá (Có thể lọc theo status)
  public static async getAllForAdmin(status?: ReviewStatus): Promise<ReviewResponse[]> {
    const whereCondition = status ? { status } : {};
    const reviews = await prisma.reviews.findMany({
      where: whereCondition,
      include: { users: true },
      orderBy: { created_at: 'desc' },
    });

    return reviews.map((r) => this.mapToResponse(r));
  }

  // 4. Admin: Duyệt/Duyệt duyệt/Ẩn đánh giá
  public static async updateStatus(id: number, data: UpdateReviewStatusDto): Promise<ReviewResponse> {
    const review = await prisma.reviews.findUnique({ where: { id: BigInt(id) } });
    if (!review) throw new Error('Không tìm thấy đánh giá');

    const updated = await prisma.reviews.update({
      where: { id: BigInt(id) },
      data: {
        status: data.status,
        updated_at: getVietNamDateTime(),
      },
      include: { users: true },
    });

    return this.mapToResponse(updated);
  }
}