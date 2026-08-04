/** Canonical equipment labels (PT-PT). Only material the athlete actually has. */
export const EQUIPMENT = {
  bodyweight: 'Peso corporal',
  foamRoller: 'Foam roller',
  massageBall: 'Bola de massagem',
  band: 'Banda elástica',
  miniBand: 'Mini-band',
  kettlebell: 'Kettlebell',
  barbell: 'Barra olímpica',
  plates: 'Discos',
  rack: 'Rack',
  box: 'Caixa ou banco',
  cable: 'Cabo/polia',
  medBall: 'Bola medicinal',
  bosu: 'BOSU',
  bike: 'Bicicleta',
  rower: 'Remo',
  treadmill: 'Passadeira',
  tire: 'Pneu com corda',
  wall: 'Parede',
  dowel: 'Vara ou cabo de vassoura',
  slider: 'Superfície deslizante ou toalha',
  mat: 'Colchão ou tapete',
  space: 'Espaço livre',
} as const;

export type EquipmentLabel = (typeof EQUIPMENT)[keyof typeof EQUIPMENT];
