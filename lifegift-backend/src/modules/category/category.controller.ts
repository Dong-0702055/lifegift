import { Request, Response } from 'express';
import { CategoryService } from './category.service';

export class CategoryController {
  public static async getCategories(req: Request, res: Response) {
    try {
      const data = await CategoryService.getActiveCategories();
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  public static async getCategory(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await CategoryService.getById(id);
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(404).json({ message: error.message });
    }
  }

  public static async createCategory(req: Request, res: Response) {
    try {
      const data = await CategoryService.create(req.body);
      return res.status(201).json(data);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  public static async updateCategory(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      const data = await CategoryService.update(id, req.body);
      return res.status(200).json(data);
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }

  public static async deactivateCategory(req: Request, res: Response) {
    try {
      const id = Number(req.params.id);
      await CategoryService.deactivate(id);
      return res.status(204).send();
    } catch (error: any) {
      return res.status(400).json({ message: error.message });
    }
  }
}