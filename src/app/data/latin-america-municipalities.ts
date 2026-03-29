export interface LatamMunicipality {
  id: string;
  name: string;
  country: string;
  region: string;
  x: number;
  y: number;
  note: string;
}

export const LATIN_AMERICA_MUNICIPALITIES: LatamMunicipality[] = [
  {
    id: 'mexico-city-mx',
    name: 'Cidade do Mexico',
    country: 'Mexico',
    region: 'Vale do Mexico',
    x: 154,
    y: 154,
    note: 'Bom ponto de partida para rotas urbanas, vulcoes e serras no centro do pais.'
  },
  {
    id: 'oaxaca-mx',
    name: 'Oaxaca de Juarez',
    country: 'Mexico',
    region: 'Oaxaca',
    x: 184,
    y: 192,
    note: 'Combina curvas, montanha e uma cena cultural forte para viagens mais lentas.'
  },
  {
    id: 'bogota-co',
    name: 'Bogota',
    country: 'Colombia',
    region: 'Cundinamarca',
    x: 330,
    y: 308,
    note: 'Ponto central para explorar a cordilheira e descer rumo aos Andes do sul.'
  },
  {
    id: 'medellin-co',
    name: 'Medellin',
    country: 'Colombia',
    region: 'Antioquia',
    x: 318,
    y: 280,
    note: 'Rodeada de montanhas, perfeita para testar trilhas e estradas panoramicas.'
  },
  {
    id: 'cartagena-co',
    name: 'Cartagena',
    country: 'Colombia',
    region: 'Bolivar',
    x: 300,
    y: 252,
    note: 'Ideal para cruzar costa caribenha e registrar trechos mais quentes da viagem.'
  },
  {
    id: 'quito-ec',
    name: 'Quito',
    country: 'Equador',
    region: 'Pichincha',
    x: 342,
    y: 358,
    note: 'Uma boa ancora para rotas de altitude e vulcoes no norte dos Andes.'
  },
  {
    id: 'cuenca-ec',
    name: 'Cuenca',
    country: 'Equador',
    region: 'Azuay',
    x: 358,
    y: 420,
    note: 'Cidade serrana com estradas sinuosas e visual forte para turismo de moto.'
  },
  {
    id: 'lima-pe',
    name: 'Lima',
    country: 'Peru',
    region: 'Lima',
    x: 386,
    y: 516,
    note: 'Conecta a costa pacifica com varias portas de entrada para o interior do Peru.'
  },
  {
    id: 'cusco-pe',
    name: 'Cusco',
    country: 'Peru',
    region: 'Cusco',
    x: 460,
    y: 550,
    note: 'Excelente base para viagens historicas e rotas serranas mais tecnicas.'
  },
  {
    id: 'arequipa-pe',
    name: 'Arequipa',
    country: 'Peru',
    region: 'Arequipa',
    x: 430,
    y: 610,
    note: 'Trecho classico para quem quer deserto, altitude e vulcoes em uma mesma rota.'
  },
  {
    id: 'la-paz-bo',
    name: 'La Paz',
    country: 'Bolivia',
    region: 'La Paz',
    x: 510,
    y: 590,
    note: 'Destino iconico para viagens de alta montanha e travessias marcantes.'
  },
  {
    id: 'uyuni-bo',
    name: 'Uyuni',
    country: 'Bolivia',
    region: 'Potosi',
    x: 500,
    y: 652,
    note: 'Marca aventuras mais extremas, com salares e paisagens bem fora da curva.'
  },
  {
    id: 'santa-cruz-bo',
    name: 'Santa Cruz de la Sierra',
    country: 'Bolivia',
    region: 'Santa Cruz',
    x: 585,
    y: 602,
    note: 'Bom elo entre o altiplano e as rotas mais baixas do centro-oeste sul-americano.'
  },
  {
    id: 'manaus-br',
    name: 'Manaus',
    country: 'Brasil',
    region: 'Amazonas',
    x: 602,
    y: 386,
    note: 'Ponto emblematico para quem quer registrar grandes deslocamentos pela Amazonia.'
  },
  {
    id: 'belem-br',
    name: 'Belem',
    country: 'Brasil',
    region: 'Para',
    x: 720,
    y: 390,
    note: 'Une rios, litoral e uma identidade forte de entrada para o norte do Brasil.'
  },
  {
    id: 'brasilia-br',
    name: 'Brasilia',
    country: 'Brasil',
    region: 'Distrito Federal',
    x: 760,
    y: 566,
    note: 'Centro logistico excelente para viagens longas em todas as direcoes.'
  },
  {
    id: 'salvador-br',
    name: 'Salvador',
    country: 'Brasil',
    region: 'Bahia',
    x: 830,
    y: 520,
    note: 'Boa parada para ligar litoral nordestino com o miolo do pais.'
  },
  {
    id: 'campo-grande-br',
    name: 'Campo Grande',
    country: 'Brasil',
    region: 'Mato Grosso do Sul',
    x: 660,
    y: 630,
    note: 'Base forte para rotas rumo ao Pantanal, Bolivia e Paraguai.'
  },
  {
    id: 'sao-paulo-br',
    name: 'Sao Paulo',
    country: 'Brasil',
    region: 'Sao Paulo',
    x: 750,
    y: 658,
    note: 'Hub de estradas, serras e litoral para testar varias experiencias de viagem.'
  },
  {
    id: 'rio-de-janeiro-br',
    name: 'Rio de Janeiro',
    country: 'Brasil',
    region: 'Rio de Janeiro',
    x: 792,
    y: 618,
    note: 'Entrega costa, montanha e um visual forte para viagens mais cenicas.'
  },
  {
    id: 'curitiba-br',
    name: 'Curitiba',
    country: 'Brasil',
    region: 'Parana',
    x: 730,
    y: 702,
    note: 'Boa base para descer a serra ou seguir para a regiao da fronteira sul.'
  },
  {
    id: 'florianopolis-br',
    name: 'Florianopolis',
    country: 'Brasil',
    region: 'Santa Catarina',
    x: 760,
    y: 736,
    note: 'Mistura litoral, serra e clima de road trip bem forte no sul do Brasil.'
  },
  {
    id: 'porto-alegre-br',
    name: 'Porto Alegre',
    country: 'Brasil',
    region: 'Rio Grande do Sul',
    x: 732,
    y: 784,
    note: 'Ponto chave para seguir rumo a Uruguai, Argentina e serra gaucha.'
  },
  {
    id: 'foz-br',
    name: 'Foz do Iguacu',
    country: 'Brasil',
    region: 'Parana',
    x: 700,
    y: 728,
    note: 'Cruza fronteiras com facilidade e funciona muito bem para viagens internacionais.'
  },
  {
    id: 'asuncion-py',
    name: 'Assuncao',
    country: 'Paraguai',
    region: 'Distrito Capital',
    x: 624,
    y: 698,
    note: 'Ponto de conexao entre Chaco, sul do Brasil e norte da Argentina.'
  },
  {
    id: 'encarnacion-py',
    name: 'Encarnacion',
    country: 'Paraguai',
    region: 'Itapua',
    x: 650,
    y: 752,
    note: 'Boa base para uma rota curta entre Paraguai, Misiones e oeste do Parana.'
  },
  {
    id: 'montevideo-uy',
    name: 'Montevideo',
    country: 'Uruguai',
    region: 'Montevideo',
    x: 722,
    y: 808,
    note: 'Marca o fim ou recomeco de varias viagens costeiras pelo Cone Sul.'
  },
  {
    id: 'cordoba-ar',
    name: 'Cordoba',
    country: 'Argentina',
    region: 'Cordoba',
    x: 646,
    y: 734,
    note: 'Rodeada de serras, ideal para roteiros de curvas e bate-voltas mais curtos.'
  },
  {
    id: 'mendoza-ar',
    name: 'Mendoza',
    country: 'Argentina',
    region: 'Mendoza',
    x: 540,
    y: 758,
    note: 'Porta de entrada para travessias andinas e paisagens secas inesqueciveis.'
  },
  {
    id: 'buenos-aires-ar',
    name: 'Buenos Aires',
    country: 'Argentina',
    region: 'Buenos Aires',
    x: 694,
    y: 782,
    note: 'Hub urbano excelente para organizar entradas e saidas do Cone Sul.'
  },
  {
    id: 'salta-ar',
    name: 'Salta',
    country: 'Argentina',
    region: 'Salta',
    x: 566,
    y: 676,
    note: 'Muito boa para rotas em altitude e viagens mais contemplativas pelo noroeste.'
  },
  {
    id: 'ushuaia-ar',
    name: 'Ushuaia',
    country: 'Argentina',
    region: 'Terra do Fogo',
    x: 616,
    y: 902,
    note: 'Destino simbolico para qualquer motoviajante que sonha em chegar ao fim do mapa.'
  },
  {
    id: 'santiago-cl',
    name: 'Santiago',
    country: 'Chile',
    region: 'Regiao Metropolitana',
    x: 418,
    y: 780,
    note: 'Base urbana forte para cruzar cordilheira, litoral e vinhedos.'
  },
  {
    id: 'san-pedro-cl',
    name: 'San Pedro de Atacama',
    country: 'Chile',
    region: 'Antofagasta',
    x: 420,
    y: 688,
    note: 'Rota marcante para deserto e paisagens mais extremas da America do Sul.'
  },
  {
    id: 'puerto-montt-cl',
    name: 'Puerto Montt',
    country: 'Chile',
    region: 'Los Lagos',
    x: 432,
    y: 846,
    note: 'Boa ancora para lagos, vulcoes e o inicio de uma descida mais austral.'
  }
];
