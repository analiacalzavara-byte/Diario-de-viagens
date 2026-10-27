import { NativeStackScreenProps } from '@react-navigation/native-stack';
import { useIsFocused } from '@react-navigation/native';
import { CameraView, useCameraPermissions } from 'expo-camera';
import { useEffect, useRef, useState } from 'react';
import {
  ActivityIndicator,
  Image,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useCurrentLocation } from '../hooks/useCurrentLocation';
import { placeRepository } from '../storage/PlaceRepository';
import { RootStackParamList } from '../types';

type Props = NativeStackScreenProps<RootStackParamList, 'PlaceForm'>;

export default function PlaceFormScreen({ navigation }: Props) {
  const [title, setTitle] = useState('');
  const [note, setNote] = useState('');
  const [photoUri, setPhotoUri] = useState<string | null>(null);
  const [cameraPermission, requestCameraPermission] = useCameraPermissions();
  const [cameraOpen, setCameraOpen] = useState(false);
  const [cameraReady, setCameraReady] = useState(false);
  const [takingPhoto, setTakingPhoto] = useState(false);
  const [saving, setSaving] = useState(false);
  const [cameraMessage, setCameraMessage] = useState<string | null>(null);
  const [saveMessage, setSaveMessage] = useState<string | null>(null);
  const cameraRef = useRef<CameraView | null>(null);
  const captureLock = useRef(false);
  const isFocused = useIsFocused();
  const location = useCurrentLocation();

  useEffect(() => {
    if (!isFocused) setCameraReady(false);
  }, [isFocused]);

  async function openCamera() {
    setCameraMessage(null);

    if (cameraPermission === null) {
      setCameraMessage('Aguarde enquanto verificamos a permissão da câmera.');
      return;
    }

    if (cameraPermission.granted) {
      setCameraReady(false);
      setCameraOpen(true);
      return;
    }

    if (!cameraPermission.canAskAgain) {
      setCameraMessage('A permissão foi bloqueada. Habilite a câmera nas configurações do aparelho.');
      return;
    }

    try {
      const result = await requestCameraPermission();
      if (result.granted) {
        setCameraReady(false);
        setCameraOpen(true);
      } else {
        setCameraMessage(result.canAskAgain
          ? 'Sem a permissão, não conseguimos abrir a câmera.'
          : 'A permissão foi bloqueada. Habilite a câmera nas configurações do aparelho.');
      }
    } catch {
      setCameraMessage('Não foi possível pedir a permissão da câmera.');
    }
  }

  async function takePhoto() {
    if (!cameraReady || !cameraRef.current || captureLock.current) return;

    captureLock.current = true;
    setTakingPhoto(true);
    setCameraMessage(null);
    try {
      const photo = await cameraRef.current.takePictureAsync();
      setPhotoUri(photo.uri);
      setCameraOpen(false);
      setCameraReady(false);
    } catch {
      setCameraMessage('Não foi possível tirar a foto. Tente novamente.');
    } finally {
      captureLock.current = false;
      setTakingPhoto(false);
    }
  }

  async function savePlace() {
    setSaving(true);
    setSaveMessage(null);
    try {
      await placeRepository.create({
        title,
        note,
        photoUri,
        latitude: location.coordinates?.latitude ?? null,
        longitude: location.coordinates?.longitude ?? null,
      });

      setTitle('');
      setNote('');
      setPhotoUri(null);
      location.clearLocation();
      setCameraOpen(false);
      navigation.navigate('PlaceList');
    } catch (cause) {
      setSaveMessage(cause instanceof Error
        ? cause.message
        : 'Não foi possível salvar o registro. Tente novamente.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.content}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.eyebrow}>DIÁRIO DE LUGARES</Text>
      <Text style={styles.title}>Guarde uma lembrança</Text>
      <Text style={styles.subtitle}>Registre um lugar com uma foto, a localização ou os dois.</Text>

      <Text style={styles.label}>Título do lugar</Text>
      <TextInput
        value={title}
        onChangeText={setTitle}
        placeholder="Ex.: Praça da Liberdade"
        placeholderTextColor="#89968F"
        style={styles.input}
        maxLength={80}
        returnKeyType="next"
      />

      <Text style={styles.label}>Comentário</Text>
      <TextInput
        value={note}
        onChangeText={setNote}
        placeholder="O que você quer lembrar deste lugar?"
        placeholderTextColor="#89968F"
        style={[styles.input, styles.noteInput]}
        multiline
        textAlignVertical="top"
        maxLength={500}
      />

      <View style={styles.sectionHeading}>
        <Text style={styles.sectionTitle}>Foto</Text>
        <Text style={styles.optional}>opcional</Text>
      </View>

      {cameraOpen && isFocused ? (
        <View style={styles.cameraCard}>
          <CameraView
            ref={cameraRef}
            facing="back"
            style={styles.cameraPreview}
            onCameraReady={() => setCameraReady(true)}
            onMountError={({ message }) => setCameraMessage(`A câmera não abriu: ${message}`)}
          />
          {!cameraReady && (
            <View style={styles.cameraLoading}>
              <ActivityIndicator color="#FFFFFF" />
              <Text style={styles.cameraLoadingText}>Iniciando câmera...</Text>
            </View>
          )}
          <View style={styles.cameraActions}>
            <Pressable
              style={[styles.secondaryButton, styles.cameraAction]}
              onPress={() => {
                setCameraOpen(false);
                setCameraReady(false);
              }}
            >
              <Text style={styles.secondaryButtonText}>Cancelar</Text>
            </Pressable>
            <Pressable
              disabled={!cameraReady || takingPhoto}
              onPress={() => void takePhoto()}
              style={[styles.primaryButton, styles.cameraAction, (!cameraReady || takingPhoto) && styles.disabledButton]}
            >
              <Text style={styles.primaryButtonText}>{takingPhoto ? 'Tirando...' : 'Tirar foto'}</Text>
            </Pressable>
          </View>
        </View>
      ) : photoUri ? (
        <View style={styles.photoCard}>
          <Image source={{ uri: photoUri }} style={styles.photoPreview} />
          <Pressable
            onPress={() => setPhotoUri(null)}
            style={styles.removePhotoButton}
            accessibilityRole="button"
            accessibilityLabel="Remover foto"
          >
            <Text style={styles.removePhotoText}>Remover foto</Text>
          </Pressable>
        </View>
      ) : (
        <Pressable style={styles.secondaryButton} onPress={() => void openCamera()}>
          <Text style={styles.secondaryButtonText}>Abrir câmera</Text>
        </Pressable>
      )}
      {!!cameraMessage && <Text style={styles.errorText}>{cameraMessage}</Text>}

      <View style={[styles.sectionHeading, styles.locationHeading]}>
        <Text style={styles.sectionTitle}>Localização</Text>
        <Text style={styles.optional}>opcional</Text>
      </View>

      <Pressable
        disabled={location.status === 'loading'}
        onPress={() => void location.getCurrentLocation()}
        style={[styles.secondaryButton, location.status === 'loading' && styles.disabledButton]}
      >
        <Text style={styles.secondaryButtonText}>
          {location.status === 'loading' ? 'Obtendo localização...' : 'Usar minha localização'}
        </Text>
      </Pressable>
      {location.status === 'loading' && <ActivityIndicator style={styles.spinner} color="#286B50" />}
      {location.coordinates && (
        <Text style={styles.successText}>
          Coordenadas: {location.coordinates.latitude.toFixed(5)}, {location.coordinates.longitude.toFixed(5)}
        </Text>
      )}
      {!!location.error && <Text style={styles.errorText}>{location.error}</Text>}

      <Pressable
        disabled={saving}
        onPress={() => void savePlace()}
        style={[styles.primaryButton, styles.saveButton, saving && styles.disabledButton]}
      >
        <Text style={styles.primaryButtonText}>{saving ? 'Salvando...' : 'Salvar lugar'}</Text>
      </Pressable>
      {!!saveMessage && <Text style={styles.errorText}>{saveMessage}</Text>}

      <Pressable onPress={() => navigation.navigate('PlaceList')} style={styles.listLink}>
        <Text style={styles.listLinkText}>Ver lugares salvos</Text>
      </Pressable>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  screen: { flex: 1, backgroundColor: '#F4F3ED' },
  content: { padding: 20, paddingBottom: 40 },
  eyebrow: { color: '#286B50', fontSize: 11, fontWeight: '800', letterSpacing: 1.5 },
  title: { color: '#193B2B', fontSize: 27, fontWeight: '800', marginTop: 8 },
  subtitle: { color: '#65746A', fontSize: 14, lineHeight: 20, marginTop: 7, marginBottom: 18 },
  label: { color: '#263D30', fontSize: 14, fontWeight: '700', marginTop: 12, marginBottom: 7 },
  input: {
    backgroundColor: '#FFFFFF',
    borderColor: '#D9DED5',
    borderRadius: 12,
    borderWidth: 1,
    color: '#1F3026',
    fontSize: 15,
    minHeight: 48,
    paddingHorizontal: 13,
  },
  noteInput: { minHeight: 90, paddingTop: 12 },
  sectionHeading: { alignItems: 'baseline', flexDirection: 'row', gap: 8, marginTop: 22, marginBottom: 9 },
  sectionTitle: { color: '#263D30', fontSize: 16, fontWeight: '700' },
  optional: { color: '#879187', fontSize: 12 },
  locationHeading: { marginTop: 20 },
  primaryButton: {
    alignItems: 'center',
    backgroundColor: '#286B50',
    borderRadius: 12,
    justifyContent: 'center',
    minHeight: 48,
    paddingHorizontal: 16,
  },
  primaryButtonText: { color: '#FFFFFF', fontSize: 15, fontWeight: '700' },
  secondaryButton: {
    alignItems: 'center',
    backgroundColor: '#FFFFFF',
    borderColor: '#286B50',
    borderRadius: 12,
    borderWidth: 1,
    justifyContent: 'center',
    minHeight: 46,
    paddingHorizontal: 16,
  },
  secondaryButtonText: { color: '#286B50', fontSize: 14, fontWeight: '700' },
  disabledButton: { opacity: 0.55 },
  cameraCard: { backgroundColor: '#17251D', borderRadius: 14, overflow: 'hidden' },
  cameraPreview: { height: 230, width: '100%' },
  cameraLoading: {
    ...StyleSheet.absoluteFill,
    alignItems: 'center',
    backgroundColor: 'rgba(20, 35, 27, 0.55)',
    justifyContent: 'center',
  },
  cameraLoadingText: { color: '#FFFFFF', fontSize: 13, marginTop: 8 },
  cameraActions: { flexDirection: 'row', gap: 10, padding: 10 },
  cameraAction: { flex: 1 },
  photoCard: { backgroundColor: '#FFFFFF', borderRadius: 14, overflow: 'hidden' },
  photoPreview: { backgroundColor: '#D8DED6', height: 220, width: '100%' },
  removePhotoButton: { alignItems: 'center', padding: 11 },
  removePhotoText: { color: '#8B3730', fontSize: 13, fontWeight: '700' },
  spinner: { marginTop: 12 },
  successText: { color: '#286B50', fontSize: 13, marginTop: 10 },
  errorText: { color: '#A13D35', fontSize: 13, lineHeight: 19, marginTop: 8 },
  saveButton: { marginTop: 24 },
  listLink: { alignItems: 'center', marginTop: 17, padding: 8 },
  listLinkText: { color: '#286B50', fontSize: 14, fontWeight: '700' },
});
