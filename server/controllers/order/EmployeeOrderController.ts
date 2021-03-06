import OrderRepository from "../../repositories/OrderRepository";
import { Request, Response, NextFunction } from "express";
import UserOrderController from "./UserOrderController";
import { StateManager } from "./states/StateManager";

export default class EmployeeOrderController extends UserOrderController {
  public path = "";
  readonly routes = [];

  async confirmOrder(
    req: Request,
    res: Response,
    _: NextFunction
  ): Promise<any> {
    const { id } = req.params;
    const exist = await OrderRepository.findById(id);

    if (!exist) {
      return super.sendError(401, res, "order not found");
    }

    const stateManager = new StateManager(exist);
    stateManager.confirmOrder();
    return super.sendSuccess(200, res, null);
  }

  async shipOrder(req: Request, res: Response, _: NextFunction): Promise<any> {
    try {
      const { id } = req.params;
      const exist = await OrderRepository.findById(id);

      if (!exist) {
        return super.sendError(401, res, "order not found");
      }

      try {
        const stateManager = new StateManager(exist);
        stateManager.shipOrder();
        return super.sendSuccess(200, res, null);
      } catch (error) {
        console.log(error);
        return super.sendError(400, res, "Invalid operation");
      }
    } catch (error) {
      console.log(error);
      return super.sendError(500, res);
    }
  }

  async completeOrder(
    req: Request,
    res: Response,
    _: NextFunction
  ): Promise<any> {
    try {
      const { id } = req.params;
      const exist = await OrderRepository.findById(id);

      if (!exist) {
        return super.sendError(401, res, "order not found");
      }

      try {
        const stateManager = new StateManager(exist);
        stateManager.completeOrder();
        return super.sendSuccess(200, res, null);
      } catch (error) {
        console.log(error);
        return super.sendError(400, res, "Invalid operation");
      }
    } catch (error) {
      console.log(error);
      return super.sendError(500, res);
    }
  }

  async getAllOrder(
    _: Request,
    res: Response,
    __: NextFunction
  ): Promise<any> {
    const orders = await OrderRepository.find({}).populate({
      path: "cart",
      select: "products",
      populate: { path: "products.product" },
    }
    ).sort({ $natural: -1 }).limit(10);
    return super.sendSuccess(200, res, orders);
  }
}
