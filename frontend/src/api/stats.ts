import type { GardenStats } from "../types";
import api from "./client";

export const getStats = () => api.get<GardenStats>("/stats").then((r) => r.data);
