import { Car } from '../entity/Car';

export interface CarRepository {
  findById(id: string): Promise<Car | null>;
  save(car: Car): Promise<void>;
}
