export type Place = {
  id: string;
  title: string;
  note: string;
  photoUri: string | null;
  latitude: number | null;
  longitude: number | null;
  createdAt: string;
};

export type NewPlace = Omit<Place, 'id' | 'createdAt'>;

export type RootStackParamList = {
  PlaceForm: undefined;
  PlaceList: undefined;
};
