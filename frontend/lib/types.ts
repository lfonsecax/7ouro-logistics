export type TruckStatus = "active" | "inactive" | "in_maintenance";
export type EmployeeType = "driver" | "helper";
export type SupplierType = "workshop" | "gas_station" | "other";
export type MaintenanceType = "preventive" | "corrective";

export interface Truck {
  id: number;
  plate: string;
  model: string;
  brand?: string;
  year?: number;
  capacity_kg?: number;
  odometer?: number;
  status: TruckStatus;
  notes?: string;
  created_at: string;
}

export interface Employee {
  id: number;
  name: string;
  type: EmployeeType;
  phone?: string;
  cnh?: string;
  cnh_expiry?: string;
  salary?: number;
  active: boolean;
  notes?: string;
  created_at: string;
}

export interface Client {
  id: number;
  name: string;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
}

export interface Supplier {
  id: number;
  name: string;
  type: SupplierType;
  address?: string;
  city?: string;
  phone?: string;
  email?: string;
  notes?: string;
  created_at: string;
}

export interface OtherExpense {
  id: number;
  description: string;
  amount: number;
  category: string;
}

export interface OtherExpenseCreate {
  description: string;
  amount: number;
  category: string;
}

export interface RouteStop {
  id: number;
  client_id?: number;
  client?: Client;
  stop_order: number;
  value: number;
  notes?: string;
}

export interface RouteHelper {
  id: number;
  employee_id: number;
  employee?: Employee;
}

export interface Route {
  id: number;
  date: string;
  truck_id: number;
  truck?: Truck;
  driver_id: number;
  driver?: Employee;
  total_km: number;
  total_revenue: number;
  notes?: string;
  helpers: RouteHelper[];
  stops: RouteStop[];
  other_expenses: OtherExpense[];
  created_at: string;
}

export interface FuelRecord {
  id: number;
  date: string;
  truck_id: number;
  truck?: Truck;
  supplier_id?: number;
  supplier?: Supplier;
  liters: number;
  price_per_liter?: number;
  total: number;
  odometer?: number;
  notes?: string;
  created_at: string;
}

export interface MaintenanceRecord {
  id: number;
  date: string;
  truck_id: number;
  truck?: Truck;
  supplier_id?: number;
  supplier?: Supplier;
  type: MaintenanceType;
  description: string;
  cost: number;
  odometer?: number;
  notes?: string;
  created_at: string;
}

export interface DashboardKPIs {
  period: { year: number; month: number };
  revenue: number;
  fuel_cost: number;
  fuel_liters: number;
  maintenance_cost: number;
  salary_cost: number;
  other_costs: number;
  total_cost: number;
  profit: number;
  total_km: number;
  avg_consumption_km_per_liter: number;
  cost_per_km: number;
  days_idle: number;
  days_worked: number;
  breakeven: number;
  total_days: number;
  revenue_per_km: number;
  revenue_by_truck: { truck_id: number; plate: string; model: string; revenue: number; km: number }[];
}

export interface EvolutionPoint {
  period: string;
  revenue: number;
  fuel_cost: number;
  maintenance_cost: number;
  total_km: number;
}
