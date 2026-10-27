import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useFocusEffect } from '@react-navigation/native';
import { useCallback, useState } from 'react';
import {
  ActivityIndicator,
  Alert,
  FlatList,
  Image,
  Pressable,
  StyleSheet,
  Text,
  View,
} from 'react-native';
import { placeRepository } from '../storage/PlaceRepository';
import { Place, RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PlaceList'>;

export default function PlaceListScreen({ navigation }: Props) {
  const [places, setPlaces] = useState<Place[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const loadPlaces = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const savedPlaces = await placeRepository.getAll();
      savedPlaces.sort((first, second) => second.createdAt.localeCompare(first.createdAt));
      setPlaces(savedPlaces);
    } catch {
      setError('Não foi possível carregar os lugares salvos.');
    } finally {
      setLoading(false);
    }
  }, []);

  useFocusEffect(
    useCallback(() => {
      void loadPlaces();
    }, [loadPlaces]),
  );

  function confirmDelete(place: Place) {
    Alert.alert('Excluir lugar?', `“${place.title}” será removido do diário.`, [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Excluir',
        style: 'destructive',
        onPress: () => void deletePlace(place.id),
      },
    ]);
  }

  async function deletePlace(id: string) {
    try {
      await placeRepository.remove(id);
      await loadPlaces();
    } catch {
      setError('Não foi possível excluir este lugar. Tente novamente.');
    }
  }

  return (
    <View style={styles.screen}>
      <View style={styles.heading}>
        <View>
          <Text style={styles.eyebrow}>SEU DIÁRIO</Text>
          <Text style={styles.title}>Lugares guardados</Text>
        </View>
        <Text style={styles.count}>{places.length}</Text>
      </View>

      {!!error && <Text style={styles.errorText}>{error}</Text>}

      {loading ? (
        <View style={styles.centered}>
          <ActivityIndicator size="large" color="#286B50" />
          <Text style={styles.emptyText}>Carregando seus lugares...</Text>
        </View>
      ) : (
        <FlatList
          data={places}
          keyExtractor={(place) => place.id}
          contentContainerStyle={places.length === 0 ? styles.emptyList : styles.list}
          ListEmptyComponent={
            <View style={styles.emptyCard}>
              <Text style={styles.emptyIcon}>✦</Text>
              <Text style={styles.emptyTitle}>Seu diário começa aqui</Text>
              <Text style={styles.emptyText}>Salve uma lembrança com uma foto ou localização.</Text>
            </View>
          }
          renderItem={({ item }) => <PlaceCard place={item} onDelete={() => confirmDelete(item)} />}
        />
      )}

      <Pressable
        accessibilityRole="button"
        onPress={() => navigation.navigate('PlaceForm')}
        style={styles.addButton}
      >
        <Text style={styles.addButtonText}>+ Novo lugar</Text>
      </Pressable>
    </View>
  );
}

type CardProps = {
  place: Place;
  onDelete: () => void;
};

function PlaceCard({ place, onDelete }: CardProps) {
  const date = new Date(place.createdAt).toLocaleDateString('pt-BR');
  const hasCoordinates = place.latitude !== null && place.longitude !== null;

  return (
    <View style={styles.card}>
      {place.photoUri ? (
        <Image source={{ uri: place.photoUri }} style={styles.cardImage} />
      ) : (
        <View style={[styles.cardImage, styles.noPhoto]}>
          <Text style={styles.noPhotoMark}>⌖</Text>
          <Text style={styles.noPhotoText}>Lugar marcado</Text>
        </View>
      )}
      <View style={styles.cardBody}>
        <View style={styles.cardTitleRow}>
          <Text style={styles.cardTitle} numberOfLines={2}>{place.title}</Text>
          <Pressable onPress={onDelete} hitSlop={8}>
            <Text style={styles.deleteText}>Excluir</Text>
          </Pressable>
        </View>
        {!!place.note && <Text style={styles.note} numberOfLines={3}>{place.note}</Text>}
        <View style={styles.metaRow}>
          <Text style={styles.meta}>{date}</Text>
          {hasCoordinates && (
            <Text style={styles.meta}>
              {place.latitude!.toFixed(4)}, {place.longitude!.toFixed(4)}
            </Text>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: { backgroundColor: '#F4F3ED', flex: 1, paddingHorizontal: 18, paddingTop: 18 },
  heading: { alignItems: 'center', flexDirection: 'row', justifyContent: 'space-between', marginBottom: 15 },
  eyebrow: { color: '#286B50', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#193B2B', fontSize: 24, fontWeight: '800', marginTop: 5 },
  count: {
    alignItems: 'center',
    backgroundColor: '#E1EAE1',
    borderRadius: 18,
    color: '#286B50',
    fontSize: 14,
    fontWeight: '700',
    overflow: 'hidden',
    paddingHorizontal: 12,
    paddingVertical: 7,
  },
  list: { paddingBottom: 18 },
  emptyList: { flexGrow: 1, justifyContent: 'center' },
  centered: { alignItems: 'center', flex: 1, justifyContent: 'center' },
  emptyCard: { alignItems: 'center', padding: 26 },
  emptyIcon: { color: '#79A386', fontSize: 36, marginBottom: 10 },
  emptyTitle: { color: '#193B2B', fontSize: 18, fontWeight: '700' },
  emptyText: { color: '#718076', fontSize: 14, lineHeight: 21, marginTop: 7, textAlign: 'center' },
  errorText: { color: '#A13D35', fontSize: 13, marginBottom: 10 },
  card: { backgroundColor: '#FFFFFF', borderRadius: 15, marginBottom: 13, overflow: 'hidden' },
  cardImage: { backgroundColor: '#DDE5DB', height: 180, width: '100%' },
  noPhoto: { alignItems: 'center', justifyContent: 'center' },
  noPhotoMark: { color: '#52735B', fontSize: 36 },
  noPhotoText: { color: '#52735B', fontSize: 13, fontWeight: '600', marginTop: 3 },
  cardBody: { padding: 14 },
  cardTitleRow: { alignItems: 'flex-start', flexDirection: 'row', gap: 10, justifyContent: 'space-between' },
  cardTitle: { color: '#193B2B', flex: 1, fontSize: 17, fontWeight: '700' },
  deleteText: { color: '#A13D35', fontSize: 12, fontWeight: '700', paddingVertical: 3 },
  note: { color: '#59675E', fontSize: 14, lineHeight: 20, marginTop: 7 },
  metaRow: { flexDirection: 'row', flexWrap: 'wrap', gap: 12, marginTop: 11 },
  meta: { color: '#78857B', fontSize: 12 },
  addButton: {
    alignItems: 'center',
    backgroundColor: '#286B50',
    borderRadius: 13,
    marginBottom: 14,
    minHeight: 49,
    justifyContent: 'center',
  },
  addButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
});
