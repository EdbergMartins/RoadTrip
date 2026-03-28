# RoadTrip LATAM

Base inicial para um app Angular focado em motoviagem pela America Latina. O primeiro recorte ja
permite:

- visualizar um mapa estilizado da America Latina;
- clicar em municipios de exemplo para marcar como visitados;
- filtrar por pais e buscar municipios;
- salvar o progresso no `localStorage`.

## Stack atual

- Angular `19.2.x`
- TypeScript `5.7.x`
- RxJS `7.8.x`
- Node `18.20.5` compativel

## Como rodar

```bash
npm install
npm start
```

Depois abra `http://localhost:4200/`.

## Proximos passos naturais

1. Trocar os municipios de exemplo por um dataset real de limites municipais.
2. Substituir o mapa estilizado por camadas GeoJSON ou SVG reais da America Latina.
3. Adicionar autenticacao e sincronizacao em nuvem para o historico das viagens.
