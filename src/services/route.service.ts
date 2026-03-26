import Route from "@/models/Route";
import type { CreateRouteInput, UpdateRouteInput } from "@/validators/route.validator";

class RouteService {
  private static instance: RouteService;

  private constructor() {}

  static getInstance(): RouteService {
    if (!RouteService.instance) {
      RouteService.instance = new RouteService();
    }
    return RouteService.instance;
  }

  async getAllRoutes(activeOnly = true) {

    const query = activeOnly ? { status: "active" } : {};
    return Route.find(query).sort({ from: 1, to: 1 }).lean();
  }

  async getRouteById(id: string) {

    return Route.findById(id).lean();
  }

  async getRouteBySlug(slug: string) {

    return Route.findOne({ slug }).lean();
  }

  async createRoute(input: CreateRouteInput) {


    const slug = `${input.from}_to_${input.to}`
      .toLowerCase()
      .replace(/\s+/g, "_")
      .replace(/[^a-z0-9_]/g, "");

    const existing = await Route.findOne({ slug });
    if (existing) throw new Error("Route already exists");

    return Route.create({ ...input, slug });
  }

  async updateRoute(id: string, updates: UpdateRouteInput) {

    const route = await Route.findByIdAndUpdate(id, updates, { new: true, runValidators: true });
    if (!route) throw new Error("Route not found");
    return route;
  }

  async deleteRoute(id: string) {

    const route = await Route.findByIdAndUpdate(id, { status: "inactive" }, { new: true });
    if (!route) throw new Error("Route not found");
    return route;
  }
}

export const routeService = RouteService.getInstance();
