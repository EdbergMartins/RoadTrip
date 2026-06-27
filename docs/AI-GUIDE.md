# RoadTrip LATAM — Guia do Projeto para IAs

Este documento contém todo o conhecimento necessário para qualquer IA (ou desenvolvedor)
entender e contribuir com este projeto de forma consistente e eficiente.

---

## 1. Visão Geral

**RoadTrip LATAM** é uma **Single-Page Application (SPA)** Angular para rastrear viagens
de moto pelos municípios brasileiros (com plano futuro de expandir para toda a América
Latina). O usuário visualiza um mapa interativo com todos os 5.570 municípios do Brasil
(dados reais do IBGE 2024), pode clicar para selecionar, marcar como "visitado",
filtrar por UF e buscar por nome.

### Funcionalidades atuais

- Mapa preto-e-branco com contornos municipais reais (TopoJSON 2024)
- Clique no mapa para selecionar município
- Marcar/desmarcar municípios como visitados
- Filtrar por UF (chips de estado) e busca textual (nome, sigla, região, etc.)
- Sugestões de busca (dropdown com até 8 resultados)
- Painel de detalhes do município (estado, região, área em km²)
- "Mapa de detalhe" — um segundo mapa mostrando apenas o município visitado
- Persistência em `localStorage` (chave: `roadtrip.visited-municipalities`)
- Contador de progresso (X/Y municípios visitados, % de conclusão)
- Design responsivo (breakpoints em 1080px e 720px)
- Tema escuro com acentos dourados/alaranjados

---

## 2. Stack Tecnológica

| Camada | Tecnologia | Versão |
|---|---|---|
| Framework | Angular (standalone components) | `^19.2.20` |
| Linguagem | TypeScript | `~5.7.2` |
| Programação Reativa | RxJS | `~7.8.0` |
| Mapa | OpenLayers (`ol`) | `^10.8.0` |
| CSS | SCSS (Sass) | (bundled com Angular CLI) |
| Bundler/Dev | Angular CLI + Vite (esbuild) | `^19.2.22` (devkit) |
| Testes | Jasmine + Karma | Jasmine `~5.6.0`, Karma `~6.4.0` |
| Runtime | Zone.js | `~0.15.0` |
| Node.js | Recomendado 18.20.5+ | — |

### Propósito de cada lib principal

- **Angular 19**: Framework SPA. Usa **standalone components** (sem NgModules),
  **Signals** para estado reativo, **OnPush change detection** para performance.
- **OpenLayers 10**: Renderização do mapa. Lê TopoJSON, cria camadas vetoriais
  (`VectorLayer` + `VectorSource`), estilização customizada (`Style`, `Fill`,
  `Stroke`, `Text`), eventos de clique/hover, controle de view (fit, zoom, center).
- **RxJS 7.8**: Dependência interna do Angular (não usado diretamente no código).
- **Zone.js 0.15**: Change detection do Angular. Configurado com `eventCoalescing: true`.

---

## 3. Estrutura de Diretórios

```
RoadTrip/
├── .angular/                    # Cache do Angular CLI (gitignorado)
├── .editorconfig                # 2 espaços, UTF-8, aspas simples TS
├── .gitignore
├── .vscode/                     # Configs do VS Code
│   ├── extensions.json          # Recomenda angular.ng-template
│   ├── launch.json              # Debug Chrome para ng serve e ng test
│   └── tasks.json               # Tarefas npm (start, test)
├── angular.json                 # Config principal do Angular CLI
├── package.json                 # Manifest do projeto
├── package-lock.json            # Lockfile
├── tsconfig.json                # Config base do TypeScript
├── tsconfig.app.json            # Config TS específica da app
├── tsconfig.spec.json           # Config TS dos testes
├── README.md                    # Documentação original (português)
├── public/                      # Assets estáticos (copiados como-is para dist/)
│   ├── favicon.ico
│   └── data/
│       └── br-municipios-2024.topo.json    # ≈ Malha municipal IBGE 2024
└── src/                         # Código fonte
    ├── index.html               # Shell HTML (<app-root>)
    ├── main.ts                  # Bootstrap da aplicação
    ├── styles.scss              # Estilos globais + CSS custom properties + fontes
    └── app/
        ├── app.component.ts     # Componente principal (toda a lógica — 600 linhas)
        ├── app.component.html   # Template principal (194 linhas)
        ├── app.component.scss   # Estilos do componente (540 linhas)
        ├── app.component.spec.ts # Testes unitários (3 testes)
        ├── app.config.ts        # Config da aplicação (providers)
        ├── app.routes.ts        # Rotas (array vazio — SPA sem sub-rotas)
        └── data/
            └── latin-america-municipalities.ts  # Dataset legado de 35 cidades LATAM (NÃO USADO no código atual)
```

---

## 4. Arquitetura

### Padrão: Monolítico Single-Component

Toda a aplicação reside em **um único componente** (`AppComponent`). Não há
serviços separados, não há componentes filhos, não há rotas. Isso é intencional
para esta fase inicial do projeto.

### Fluxo de Inicialização

```
main.ts
  → bootstrapApplication(AppComponent, appConfig)
    → appConfig provê: ZoneChangeDetection (eventCoalescing) + Router (rotas vazias)
    → AppComponent é instanciado
      → Construtor: registra 4 effects
      → ngAfterViewInit():
        1. initializeMap()      — cria mapa principal OpenLayers
        2. initializeDetailMap() — cria mapa de detalhe OpenLayers
        3. loadMunicipalities()  — fetch TopoJSON, parse, popula signals
```

### Estado Reativo (Signals)

O estado é gerenciado exclusivamente com **Angular Signals** (`signal`, `computed`,
`effect`). Não há serviços de estado, não há RxJS Subjects, não há NgRx/ngxs.

---

## 5. Sinais (Signals) — Referência Completa

### Signals writable (estado mutável)

| Signal | Tipo | Inicial | Descrição |
|---|---|---|---|
| `municipalities` | `Municipality[]` | `[]` | Todos os municípios carregados do TopoJSON |
| `searchTerm` | `string` | `''` | Termo de busca textual |
| `pinnedMunicipalityId` | `string` | `''` | ID do município "pinado" via sugestão de busca |
| `activeState` | `string` | `'Todos'` | UF selecionada no filtro |
| `activeMunicipalityId` | `string` | `''` | ID do município atualmente selecionado/focado |
| `visitedMunicipalityIds` | `string[]` | `localStorage` | IDs dos municípios marcados como visitados |
| `loadingMap` | `boolean` | `true` | Se o mapa está carregando |
| `loadingMessage` | `string` | `'Carregando...'` | Mensagem exibida durante carregamento |
| `loadingError` | `string` | `''` | Mensagem de erro (vazia = sem erro) |

### Signals computados (derivados)

| Signal | Tipo | Descrição |
|---|---|---|
| `states` | `string[]` | Lista de UFs únicas para os chips (`['Todos', 'AC', 'AL', ...]`) |
| `filteredMunicipalities` | `Municipality[]` | Municípios que passam pelo filtro de estado + busca. Se `pinnedMunicipalityId` está setado, retorna apenas o município pinado. A busca é feita em name, stateCode, stateName, regionName, intermediateRegion |
| `visibleMunicipalityIds` | `Set<string>` | Set dos IDs visíveis (usado para estilização do mapa) |
| `searchSuggestions` | `Municipality[]` | Até 8 sugestões de busca (exige >= 2 caracteres, sem pin) |
| `listedMunicipalities` | `Municipality[]` | Lista paginada (máx 300) para exibição no DOM, sempre inclui o ativo |
| `hiddenFilteredCount` | `number` | Quantos municípios ficaram ocultos além do limite de 300 |
| `totalMunicipalities` | `number` | Total de municípios carregados |
| `visitedCount` | `number` | Total de visitados |
| `activeMunicipality` | `Municipality \| undefined` | Município atualmente selecionado (fallback para primeiro do filtro) |
| `activeMunicipalityVisited` | `boolean` | Se o município ativo está visitado |
| `completion` | `number` | Percentual de conclusão (0-100) |

---

## 6. Effects (Efeitos Colaterais)

O construtor registra 4 effects:

1. **Persistência localStorage**: Toda vez que `visitedMunicipalityIds` muda,
   salva no `localStorage`.

2. **Auto-seleção quando filtro remove o ativo**: Se o município ativo não está
   mais nos visíveis, seleciona o primeiro do filtro.

3. **Atualização do mapa**: Quando `activeMunicipality`, `visitedMunicipalityIds`,
   ou `visibleMunicipalityIds` mudam, força `changed()` nas camadas do mapa e
   sincroniza o mapa de detalhe.

4. **Foco no mapa**: Quando `activeMunicipality` muda, dá `fit` na view do mapa
   principal para o extent do município.

---

## 7. Sistema de Mapas (OpenLayers)

### Mapa Principal (`#mapHost`)

- **Target**: `div.municipality-map`
- **View inicial**: Centro `[-54.5, -14.5]` (Brasil central), zoom `4.2`
- **Zoom**: min 3.5, max 13
- **Controls**: nenhum (mapa limpo, sem botões de zoom)
- **Camada**: `VectorLayer` com `VectorSource`, `declutter: true`, estilização
  dinâmica por feature
- **Eventos**:
  - `singleclick`: seleciona município clicado
  - `pointermove`: muda cursor para `pointer` quando sobre feature

### Mapa de Detalhe (`#detailMapHost`)

- **Target**: `div.municipality-detail-map`
- **View inicial**: Centro `[-54.5, -14.5]`, zoom `5`
- **Zoom**: min 4, max 15
- **Source**: `this.detailSource` (VectorSource separado, populado dinamicamente)
- **Comportamento**: Só mostra feature quando o município ativo está **visitado**.
  Quando não visitado, exibe placeholder "Marque este municipio como visitado...".

### Estilização

#### Mapa Principal (`getMunicipalityStyle`)

Estilos cacheados por chave `${id}-${isVisited}-${isActive}-${isVisible}`.

| Estado | Fill | Stroke | Texto |
|---|---|---|---|
| Não visitado, não ativo, visível | `#000` | branco 0.92, width 0.7 | branco, font 500 9px |
| Não visitado, ativo | branco 0.12 | branco 0.92, width 1.8 | branco, font 700 11px |
| Visitado, não ativo | laranja 0.58 | amarelo 0.96, width 1.4 | amarelo claro |
| Visitado, ativo | laranja 0.72 | amarelo 0.96, width 1.8 | amarelo claro, font 700 11px |
| Fora do filtro | `#000` | branco 0.22, width 0.7 | branco 0.3 |

#### Mapa de Detalhe (`getDetailMunicipalityStyle`)

- Fill preto, stroke branco 2.2, nome branco 700 18px com outline preto 4px.

---

## 8. Interface Municipality

```typescript
interface Municipality {
  id: string;                // CD_MUN do IBGE (7 dígitos)
  name: string;              // NM_MUN
  stateCode: string;         // SIGLA_UF (ex: 'SP')
  stateName: string;         // NM_UF (ex: 'São Paulo')
  regionName: string;        // NM_REGIA (ex: 'Sudeste')
  intermediateRegion: string;// NM_RGINT (ex: 'Campinas')
  areaKm2: number;           // AREA_KM2
}
```

---

## 9. Layout do Template

```
main.shell
├── section.workspace (CSS Grid: 1.35fr mapa | 0.85fr painel)
│   ├── article.map-card
│   │   ├── Título + botão "Limpar progresso"
│   │   ├── Descrição
│   │   ├── div.map-frame--mono
│   │   │   ├── div#mapHost (mapa principal)
│   │   │   └── div.map-status (loading/erro — condicional)
│   │   └── div.legend (legenda: perímetro, foco, fora do filtro)
│   │
│   └── aside.control-panel
│       ├── section.panel-card (filtros)
│       │   ├── input de busca + dropdown de sugestões
│       │   ├── Ação rápida "Marcar/Desmarcar" (município ativo)
│       │   └── Chips de UF
│       │
│       ├── section.panel-card--spotlight (detalhes)
│       │   ├── Nome, status, meta (estado, região, área)
│       │   ├── Mapa de detalhe (com placeholder condicional)
│       │   └── Botão Marcar/Desmarcar
│       │
│       └── section.panel-card (lista)
│           ├── Título com contagem
│           ├── Lista de municípios (scroll, max 32rem altura)
│           │   └── Cada linha: nome, estado·região, pill status
│           └── Nota de rodapé se > 300 itens
```

---

## 10. CSS — Custom Properties e Design System

### Cores (tema escuro)

```css
--bg-deep: #081417;       /* fundo mais escuro */
--bg-mid: #0d1f23;        /* fundo intermediário */
--ink-strong: #fff8e9;    /* texto principal (off-white quente) */
--ink-soft: rgba(255, 248, 233, 0.72);  /* texto secundário */
--accent-soft: #f6d26f;   /* destaque dourado */
```

### Fontes

- **Display**: `Fraunces` (serif, Google Fonts) — títulos, números grandes
- **Body**: `Space Grotesk` (sans-serif, Google Fonts) — corpo, UI

### Background do body

Três camadas sobrepostas: dois radiais (dourado no top-left, vermelho no
bottom-right) + linear gradient de `--bg-mid` para `--bg-deep`.

### Cards e painéis

Todos usam:
- `border: 1px solid rgba(255,255,255,0.1)`
- Background com `linear-gradient` semi-transparente + blur
- `border-radius: 2rem` (1.45rem em mobile)
- `backdrop-filter: blur(22px)`

### Breakpoints

- `max-width: 1080px` — grid vira single-column
- `max-width: 720px` — padding reduzido, bordas menores, rows empilhadas

### Convenções CSS

- Nomenclatura BEM-like: `.municipality-row`, `.municipality-row--active`,
  `.municipality-row__copy`
- Animações sutis: `transform: translateY(-1px)` no hover
- Focus visible: outline dourado de 2px com offset

---

## 11. Convenções de Código

### TypeScript

- **2 espaços** de indentação
- **Aspas simples** para strings
- **Arrow functions** para métodos em signals computados
- **Português** para mensagens de UI, strings, comentários
- Nomes em **inglês** para variáveis, métodos, interfaces
- **OnPush** change detection no componente
- **Strict mode** completo do TypeScript
- `private readonly` para constantes e serviços internos
- Sem `any` — uso de genéricos e tipos corretos
- Signals tipados explicitamente: `signal<Municipality[]>([])`

### HTML/Template

- **Novo control flow** do Angular 19 (`@if`, `@for`, `@empty`)
- `trackBy` em todos os `@for`
- Sem pipes customizados (usa `| number: '1.0-2'` nativo)
- Atributos ARIA nos elementos do mapa (`role="img"`, `aria-label`)

### SCSS

- CSS custom properties para todas as cores
- Aninhamento SCSS apenas quando melhora legibilidade
- Seletores específicos, evitando aninhamento profundo (>3 níveis)
- `clamp()` para tipografia responsiva

---

## 12. Comandos

| Comando | Ação |
|---|---|
| `npm install` | Instalar dependências |
| `npm start` | Dev server em `http://localhost:4200/` |
| `npm run build` | Build produção → `dist/roadtrip-app/` |
| `npm run watch` | Build desenvolvimento com watch |
| `npm test` | Rodar testes (Karma/Jasmine) |

---

## 13. Arquivo de Dados: TopoJSON

### Localização

`public/data/br-municipios-2024.topo.json`

### Carregamento

O arquivo é carregado via `fetch()` no método `loadMunicipalities()`. É parseado
com `new TopoJSON()` do OpenLayers, com `featureProjection: 'EPSG:3857'`.

### Propriedades esperadas em cada feature

| Propriedade | Tipo | Descrição |
|---|---|---|
| `CD_MUN` | string | Código do município (IBGE, 7 dígitos) |
| `NM_MUN` | string | Nome do município |
| `SIGLA_UF` | string | Sigla da UF |
| `NM_UF` | string | Nome da UF |
| `NM_REGIA` | string | Nome da região |
| `NM_RGINT` | string | Nome da região intermediária |
| `AREA_KM2` | number | Área em km² |

### Features inválidas

Features sem `CD_MUN` ou `NM_MUN` são filtradas como `null` e descartadas.

---

## 14. Arquivo Legado: `latin-america-municipalities.ts`

**NÃO É MAIS USADO.** Contém 35 cidades latino-americanas com coordenadas x/y
para um mapa estilizado antigo. Foi substituído pelo TopoJSON real. Mantido
apenas como referência. A interface `LatamMunicipality` e o array
`LATIN_AMERICA_MUNICIPALITIES` não são importados em lugar nenhum.

---

## 15. Testes

Arquivo: `src/app/app.component.spec.ts` — 3 testes:

1. **should create the app** — verifica que o componente instancia
2. **should expose the seeded municipalities** — verifica `totalMunicipalities > 20`
3. **should render the application title** — verifica elemento `[data-testid="app-title"]`
   contém "Mapa vivo das viagens de moto pela America Latina"

Test runner: Karma + Jasmine, configurado em `angular.json` com `polyfills: zone.js/testing`.

---

## 16. Estado Atual e Limitações

### O que funciona

- Mapa com os 5.570 municípios brasileiros reais
- Interação completa (clique, busca, filtro, visitado)
- Persistência local
- Interface responsiva e temática
- Performance razoável (cache de estilos, limite de 300 na lista, OnPush)

### Limitações conhecidas

1. **Apenas Brasil**: O README menciona América Latina, mas só há dados do Brasil
2. **Sem backend**: Nada de autenticação, sync, ou API. Dados 100% locais
3. **TopoJSON é pesado**: O arquivo é carregado inteiro (pode ser grande)
4. **Monolítico**: 600 linhas em um único componente. Conforme crescer, precisará
   ser dividido em serviços e componentes filhos
5. **Sem rotas**: Aplicação SPA sem navegação interna
6. **Acessibilidade limitada**: Apenas atributos aria básicos no mapa
7. **Testes mínimos**: Apenas 3 testes, sem cobertura de interações de mapa
8. **Título da página**: `index.html` tem `<title>RoadtripApp</title>` genérico
9. **Idioma do HTML**: `<html lang="en">` mas conteúdo é em português
10. **README desatualizado**: Fala em "municípios de exemplo" e "mapa estilizado",
    mas o app já usa dados reais do IBGE

---

## 17. Próximos Passos (do README)

1. ~~Trocar municípios de exemplo por dataset real~~ ✅ Já feito
2. ~~Substituir mapa estilizado por GeoJSON/SVG real~~ ✅ Já feito (TopoJSON real)
3. Adicionar autenticação e sincronização em nuvem para histórico de viagens

---

## 18. Guia Rápido para Novas Features

### Para adicionar um novo país/região

1. Obter arquivo TopoJSON com as mesmas propriedades (ou adaptar `mapMunicipality`)
2. Colocar em `public/data/`
3. Ajustar `municipalityDataUrl` ou criar lógica de múltiplos arquivos
4. Atualizar `initialCenter` e `initialZoom` se necessário

### Para adicionar autenticação/backend

1. Criar um serviço Angular (`ng generate service services/auth`)
2. Adicionar provider no `app.config.ts`
3. Migrar `localStorage` para sync com API
4. Considerar refatorar `AppComponent` — extrair lógica de mapa, busca, estado
   para serviços separados

### Para refatorar o componente monolítico

Sugestão de separação:
- `MapService` — lógica de OpenLayers (inicialização, estilos, eventos)
- `MunicipalityService` — carregamento de dados, filtros, busca
- `PersistenceService` — localStorage
- Componentes filhos: `MapViewComponent`, `ControlPanelComponent`,
  `MunicipalityListComponent`, `SpotlightCardComponent`

### Convenções para novas contribuições

- Manter português para UI, inglês para código
- Seguir padrão de Signals (não introduzir RxJS desnecessariamente)
- Usar OnPush em novos componentes
- Manter naming BEM-like no CSS
- Testes seguindo padrão Jasmine existente
- Respeitar breakpoints existentes (1080px, 720px)
- Usar CSS custom properties para cores (não hardcodar)

---

## 19. Debugging e Troubleshooting

### Mapa não carrega
- Verificar se `public/data/br-municipios-2024.topo.json` existe
- Verificar console para erros de fetch
- Verificar se `mapHost` ElementRef está disponível

### localStorage não persiste
- Verificar se `localStorage` está disponível (pode ser bloqueado em iframes/incógnito)
- Chave: `roadtrip.visited-municipalities`

### Performance
- Estilos são cacheados (`styleCache`, `detailStyleCache`)
- Lista limitada a 300 itens (`listDisplayLimit`)
- `OnPush` change detection evita re-renders desnecessários
- Features são indexadas em `municipalityFeatures` Map para lookup rápido

---

*Última atualização: Junho 2026 | Projeto RoadTrip v0.0.0*
