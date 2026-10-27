import { AsyncStorageRepository } from '../models/AsyncStorageRepository';
import { NewPlace, Place } from '../types';

export class InvalidPlaceError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'InvalidPlaceError';
  }
}

class PlaceRepository extends AsyncStorageRepository<Place> {
  constructor() {
    super('@diario-de-lugares:places');
  }

  async create(data: NewPlace): Promise<Place> {
    const title = data.title.trim();
    if (!title) {
      throw new InvalidPlaceError('Informe um título para o lugar.');
    }

    const hasPhoto = data.photoUri !== null;
    const hasLocation = data.latitude !== null && data.longitude !== null;
    if (!hasPhoto && !hasLocation) {
      throw new InvalidPlaceError('Tire uma foto ou obtenha a localização antes de salvar.');
    }

    const place: Place = {
      ...data,
      title,
      id: `${Date.now()}-${Math.random().toString(36).slice(2, 8)}`,
      createdAt: new Date().toISOString(),
    };

    return this.add(place);
  }
}

export const placeRepository = new PlaceRepository();
