import { Router } from 'express';
import { InventoryController } from './inventory.controller';
import { InventoryTransactionController } from './inventory-transaction.controller';
import { validateDto, validateParamsDto } from '../../common/middlewares/validation.middleware';
import { authenticateJwt, requireAuth, authorizeRoles } from '../../common/middlewares/auth.middleware';
import { InventoryRequestDto, InventoryIdParamDto, WarehouseIdParamDto, ProductIdParamDto } from './inventory.dto';
import { InventoryTransactionRequestDto, TransactionIdParamDto } from './inventory-transaction.dto';

const router = Router();

router.use(authenticateJwt);
router.use(requireAuth);
router.use(authorizeRoles('ADMIN'));

// ==========================================
// 1. INVENTORY ROUTES
// ==========================================
router.get('/', InventoryController.getAll);
router.get('/:id', validateParamsDto(InventoryIdParamDto), InventoryController.getById);
router.get('/warehouse/:warehouseId', validateParamsDto(WarehouseIdParamDto), InventoryController.getByWarehouse);
router.get('/product/:productId', validateParamsDto(ProductIdParamDto), InventoryController.getByProduct);
router.post('/', validateDto(InventoryRequestDto), InventoryController.create);
router.put('/:id', validateParamsDto(InventoryIdParamDto), validateDto(InventoryRequestDto), InventoryController.update);
router.delete('/:id', validateParamsDto(InventoryIdParamDto), InventoryController.delete);

// ==========================================
// 2. INVENTORY TRANSACTIONS ROUTES
// ==========================================
router.get('/transactions/all', InventoryTransactionController.getAll);
router.get('/transactions/:id', validateParamsDto(TransactionIdParamDto), InventoryTransactionController.getById);
router.get('/transactions/inventory/:inventoryId', InventoryTransactionController.getByInventory);
router.post('/transactions', validateDto(InventoryTransactionRequestDto), InventoryTransactionController.create);
router.put('/transactions/:id', validateParamsDto(TransactionIdParamDto), validateDto(InventoryTransactionRequestDto), InventoryTransactionController.update);
router.delete('/transactions/:id', validateParamsDto(TransactionIdParamDto), InventoryTransactionController.delete);

export default router;