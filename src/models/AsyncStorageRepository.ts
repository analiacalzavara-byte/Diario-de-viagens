import AsyncStorage from '@react-native-async-storage/async-storage';

export class AsyncStorageRepository<T extends { id: string }> {
  constructor(private readonly key: string) {}

  async getAll(): Promise<T[]> {
    const raw = await AsyncStorage.getItem(this.key);
    if (raw === null) return [];

    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) {
      throw new Error('Os dados salvos estão em um formato inválido.');
    }

    return parsed as T[];
  }

  async add(item: T): Promise<T> {
    const items = await this.getAll();
    await AsyncStorage.setItem(this.key, JSON.stringify([...items, item]));
    return item;
  }

  async remove(id: string): Promise<void> {
    const items = await this.getAll();
    const remainingItems = items.filter((item) => item.id !== id);
    await AsyncStorage.setItem(this.key, JSON.stringify(remainingItems));
  }
}
