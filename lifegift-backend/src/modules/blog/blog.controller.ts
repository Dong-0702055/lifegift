import { Request, Response } from 'express';
import { BlogService } from './blog.service';

export class BlogController {
  // Public: Lấy danh mục bài viết ACTIVE
  public static async getCategories(req: Request, res: Response) {
    try {
      const data = await BlogService.getActiveCategories();
      return res.status(200).json({ success: true, message: 'Lấy danh mục thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // Admin: Tạo danh mục mới
  public static async createCategory(req: Request, res: Response) {
    try {
      const data = await BlogService.createCategory(req.body);
      return res.status(201).json({ success: true, message: 'Tạo danh mục thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // Public: Lấy tất cả bài viết PUBLISHED
  public static async getPosts(req: Request, res: Response) {
    try {
      const data = await BlogService.getPublishedPosts();
      return res.status(200).json({ success: true, message: 'Lấy danh sách bài viết thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // Public: Xem chi tiết bài viết theo Slug
  public static async getPostBySlug(req: Request, res: Response) {
    try {
      const slug = req.params.slug as string;
      const data = await BlogService.getPostBySlug(slug);
      return res.status(200).json({ success: true, message: 'Lấy bài viết thành công', data });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message, data: null });
    }
  }

  // Public: Lấy bài viết theo Category
  public static async getPostsByCategory(req: Request, res: Response) {
    try {
      const categoryId = Number(req.params.categoryId);
      const data = await BlogService.getPostsByCategory(categoryId);
      return res.status(200).json({ success: true, message: 'Lấy bài viết theo danh mục thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // Admin: Tạo bài viết mới
  public static async createPost(req: Request, res: Response) {
    try {
      const authorId = (req as any).user.id;
      const data = await BlogService.createPost(authorId, req.body);
      return res.status(201).json({ success: true, message: 'Tạo bài viết thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  // Admin: Cập nhật bài viết
  public static async updatePost(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await BlogService.updatePost(id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật bài viết thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}