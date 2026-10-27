# Diário de Lugares

App mobile feito com Expo e React Native para guardar lembranças dos lugares visitados. Cada registro precisa de um título e de pelo menos uma destas informações: foto ou localização. O comentário é opcional.

## O que funciona

- Formulário para escrever o título e um comentário.
- Captura de foto com pedido de permissão, prévia e tratamento de erro.
- Captura da localização em primeiro plano, com estado de carregamento, mensagens de erro e limite de 20 segundos.
- Regra de validação no repositório: é necessário ter foto **ou** coordenadas.
- Lista de registros persistida com AsyncStorage e ação para excluir.
- Duas telas com React Navigation: formulário e diário.

## Executar

Na pasta do projeto:

```sh
npx expo start
```

Abra pelo Expo Go em um celular físico para testar câmera e GPS reais. Com o emulador Android aberto, você pode injetar uma localização de teste pelo comando `adb emu geo fix -48.9936 -22.4068` (longitude primeiro, latitude depois).

## Organização

- `src/types`: formato do registro e parâmetros das rotas.
- `src/hooks/useCurrentLocation.ts`: permissão, leitura do GPS e limite de tempo.
- `src/models/AsyncStorageRepository.ts`: operações genéricas de armazenamento.
- `src/storage/PlaceRepository.ts`: chave exclusiva e regra de validação do Diário de Lugares.
- `src/screens/PlaceFormScreen.tsx`: formulário, câmera, localização e salvamento.
- `src/screens/PlaceListScreen.tsx`: leitura dos registros e exclusão.

## Dados de cada registro

`id`, `title`, `note`, `photoUri`, `latitude`, `longitude` e `createdAt`. Foto e coordenadas podem ser `null`; o repositório só aceita salvar quando existe uma foto ou um par de coordenadas. A chave AsyncStorage deste app é `@diario-de-lugares:places`.

## Permissões

O `app.json` declara as mensagens da câmera e da localização em uso. No runtime, cada recurso é solicitado quando a pessoa toca no botão correspondente. Negar um recurso não bloqueia o outro: ainda é possível salvar usando foto ou GPS.

## Capturas de tela

Adicionar aqui uma captura do formulário e outra da lista com um registro salvo depois de executar o app em um celular ou emulador.
