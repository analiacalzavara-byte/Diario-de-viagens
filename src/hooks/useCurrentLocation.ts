import * as Location from 'expo-location';
import { useState } from 'react';

const LOCATION_TIMEOUT_MS = 20_000;

export type Coordinates = {
  latitude: number;
  longitude: number;
};

type LocationStatus = 'idle' | 'loading' | 'ready' | 'error';

export function useCurrentLocation() {
  const [coordinates, setCoordinates] = useState<Coordinates | null>(null);
  const [status, setStatus] = useState<LocationStatus>('idle');
  const [error, setError] = useState<string | null>(null);

  async function getCurrentLocation(): Promise<Coordinates | null> {
    setStatus('loading');
    setError(null);

    try {
      const permission = await Location.requestForegroundPermissionsAsync();
      if (permission.status !== 'granted') {
        throw new Error('Permissão de localização negada. Você ainda pode salvar com uma foto.');
      }

      let timeoutId: ReturnType<typeof setTimeout> | undefined;
      try {
        const timeout = new Promise<never>((_, reject) => {
          timeoutId = setTimeout(
            () => reject(new Error('A localização demorou mais de 20 segundos. Tente novamente.')),
            LOCATION_TIMEOUT_MS,
          );
        });

        const position = await Promise.race([
          Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.High }),
          timeout,
        ]);

        const nextCoordinates = {
          latitude: position.coords.latitude,
          longitude: position.coords.longitude,
        };
        setCoordinates(nextCoordinates);
        setStatus('ready');
        return nextCoordinates;
      } finally {
        if (timeoutId !== undefined) clearTimeout(timeoutId);
      }
    } catch (cause) {
      const message = cause instanceof Error
        ? cause.message
        : 'Não foi possível obter a localização. Tente novamente.';
      setError(message);
      setStatus('error');
      return null;
    }
  }

  function clearLocation() {
    setCoordinates(null);
    setError(null);
    setStatus('idle');
  }

  return { coordinates, status, error, getCurrentLocation, clearLocation };
}
