import { Request, Response } from 'express';
import { ProductService } from './product.service';

export class ProductController {
  public static async getProducts(req: Request, res: Response) {
    try {
      const data = await ProductService.getActiveProducts();
      return res.status(200).json({ success: true, message: 'Lấy danh sách sản phẩm thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getProduct(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await ProductService.getById(id);
      return res.status(200).json({ success: true, message: 'Lấy thông tin sản phẩm thành công', data });
    } catch (error: any) {
      return res.status(404).json({ success: false, message: error.message, data: null });
    }
  }

  public static async createProduct(req: Request, res: Response) {
    try {
      const data = await ProductService.create(req.body);
      return res.status(201).json({ success: true, message: 'Tạo sản phẩm thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async updateProduct(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await ProductService.update(id, req.body);
      return res.status(200).json({ success: true, message: 'Cập nhật sản phẩm thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async deactivateProduct(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await ProductService.deactivate(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async activateProduct(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await ProductService.activate(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
  public static async getProductsByCategory(req: Request, res: Response) {
    try {
      const categoryId = Number(req.params.categoryId);
      const data = await ProductService.getByCategoryId(categoryId);
      return res.status(200).json({ success: true, message: 'Lấy sản phẩm theo danh mục thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }

  public static async getProductsByBrand(req: Request, res: Response) {
    try {
      const brandId = Number(req.params.brandId);
      const data = await ProductService.getByBrandId(brandId);
      return res.status(200).json({ success: true, message: 'Lấy sản phẩm theo thương hiệu thành công', data });
    } catch (error: any) {
      return res.status(400).json({ success: false, message: error.message, data: null });
    }
  }
}