import { NavigationContainer } from '@react-navigation/native';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { StatusBar } from 'expo-status-bar';
import PlaceFormScreen from './src/screens/PlaceFormScreen';
import PlaceListScreen from './src/screens/PlaceListScreen';
import { RootStackParamList } from './src/types';

const Stack = createNativeStackNavigator<RootStackParamList>();

export default function App() {
  return (
    <NavigationContainer>
      <StatusBar style="dark" />
      <Stack.Navigator
        initialRouteName="PlaceForm"
        screenOptions={{
          headerTintColor: '#193B2B',
          headerTitleStyle: { fontWeight: '700' },
          contentStyle: { backgroundColor: '#F4F3ED' },
        }}
      >
        <Stack.Screen
          name="PlaceForm"
          component={PlaceFormScreen}
          options={{ title: 'Novo registro' }}
        />
        <Stack.Screen
          name="PlaceList"
          component={PlaceListScreen}
          options={{ title: 'Diário de Lugares' }}
        />
      </Stack.Navigator>
    </NavigationContainer>
  );
}
