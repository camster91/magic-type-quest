import { BIOME_ORDER, LESSON_BIOMES, type BiomeId } from '../curriculum/biomeMapping';
import { LESSON_ORDER } from '../curriculum/domain';
import { ASSET_MANIFEST } from '../assets/manifest';
import type { BiomeDefinition, ContentData, RestorationStage } from './schema';

const meadowStages: readonly RestorationStage[] = [
  { id: 'meadow-sparse', biomeId: 'meadow-base', order: 0, requiredMilestone: 'initial', visibleLayers: ['biomes.meadow.background.sky', 'biomes.meadow.habitat.sparse'], hiddenLayers: [], propChanges: [], wildlifeArrivals: [], animationCueId: null, accessibleSummaryKey: 'stage.meadow.sparse', reducedMotionFallback: 'instantLayerSwap', completionPersistenceKey: 'naturequest:v2:meadow:stage:0' },
  { id: 'meadow-planting-spots', biomeId: 'meadow-base', order: 1, requiredMilestone: 'mission:meadow-a:complete', visibleLayers: ['biomes.meadow.background.sky', 'biomes.meadow.habitat.sparse', 'biomes.meadow.restoration.plantingSpots'], hiddenLayers: [], propChanges: ['biomes.meadow.restoration.plantingSpots'], wildlifeArrivals: [], animationCueId: 'meadow.spots', accessibleSummaryKey: 'stage.meadow.spots', reducedMotionFallback: 'instantLayerSwap', completionPersistenceKey: 'naturequest:v2:meadow:stage:1' },
  { id: 'meadow-flowers', biomeId: 'meadow-base', order: 2, requiredMilestone: 'mission:meadow-b:complete', visibleLayers: ['biomes.meadow.background.sky', 'biomes.meadow.restoration.flowers'], hiddenLayers: ['biomes.meadow.habitat.sparse'], propChanges: ['biomes.meadow.restoration.flowers'], wildlifeArrivals: [], animationCueId: 'meadow.grow', accessibleSummaryKey: 'stage.meadow.flowers', reducedMotionFallback: 'gentleFade', completionPersistenceKey: 'naturequest:v2:meadow:stage:2' },
  { id: 'meadow-pollinator', biomeId: 'meadow-base', order: 3, requiredMilestone: 'mission:meadow-c:sequence', visibleLayers: ['biomes.meadow.background.sky', 'biomes.meadow.restoration.flowers'], hiddenLayers: ['biomes.meadow.habitat.sparse'], propChanges: [], wildlifeArrivals: ['danaus-plexippus'], animationCueId: 'meadow.arrival', accessibleSummaryKey: 'stage.meadow.pollinator', reducedMotionFallback: 'instantLayerSwap', completionPersistenceKey: 'naturequest:v2:meadow:stage:3' },
  { id: 'meadow-restored', biomeId: 'meadow-base', order: 4, requiredMilestone: 'mission:meadow-c:complete', visibleLayers: ['biomes.meadow.background.sky', 'biomes.meadow.restoration.flowers', 'biomes.meadow.restoration.restored'], hiddenLayers: ['biomes.meadow.habitat.sparse'], propChanges: ['biomes.meadow.restoration.restored'], wildlifeArrivals: [], animationCueId: 'meadow.complete', accessibleSummaryKey: 'stage.meadow.restored', reducedMotionFallback: 'gentleFade', completionPersistenceKey: 'naturequest:v2:meadow:stage:4' },
];

const titles: Readonly<Record<BiomeId, [string, string, string]>> = {
  'meadow-base': ['biome.meadow.name', 'biome.meadow.description', 'MeadowScene'],
  'forest-trail': ['biome.forest.name', 'biome.forest.description', 'ForestScene'],
  wetlands: ['biome.wetlands.name', 'biome.wetlands.description', 'WetlandsScene'],
  'river-coast': ['biome.river.name', 'biome.river.description', 'RiverScene'],
  'mountain-research-station': ['biome.mountain.name', 'biome.mountain.description', 'MountainScene'],
  'wildlife-reserve': ['biome.reserve.name', 'biome.reserve.description', 'ReserveScene'],
};

const biomes: readonly BiomeDefinition[] = BIOME_ORDER.map((id) => ({
  id, status: 'planned', contentVersion: 1, displayNameKey: titles[id][0], shortDescriptionKey: titles[id][1],
  lessonIds: LESSON_ORDER.filter((lessonId) => LESSON_BIOMES[lessonId] === id), sceneKey: titles[id][2],
  assetPackId: `biomes.${id}`, restorationStageIds: id === 'meadow-base' ? meadowStages.map((stage) => stage.id) : [],
  missionIds: id === 'meadow-base' ? ['meadow-a', 'meadow-b', 'meadow-c'] : [],
  wildlifeDiscoveryIds: id === 'meadow-base' ? ['achillea-millefolium', 'danaus-plexippus'] : [],
  ambientAudioId: null, paletteToken: `palette.${id}`, unlockSelectorId: 'canEnterBiome', completionSelectorId: 'biomeMissionsComplete',
}));

export const STARTER_CONTENT: ContentData = {
  releasePhase: 'meadow',
  biomes,
  stages: meadowStages,
  missions: [
    { id: 'meadow-a', status: 'planned', biomeId: 'meadow-base', lessonId: 'meadow-fj', missionType: 'introduction', objectiveKey: 'mission.meadow.a', typingInteractionId: 'home-position', restorationOutcomeId: 'meadow-planting-spots', rewardIds: ['reward.meadow.spots'], estimatedDurationSeconds: 180, retryPolicy: 'supportiveRetry', accessibilityModes: ['keyboard', 'touchFallback', 'screenReader'], seedPolicy: 'fixed' },
    { id: 'meadow-b', status: 'planned', biomeId: 'meadow-base', lessonId: 'meadow-growth', missionType: 'growth', objectiveKey: 'mission.meadow.b', typingInteractionId: 'home-row-growth', restorationOutcomeId: 'meadow-flowers', rewardIds: ['reward.meadow.flowers', 'reward.yarrow'], estimatedDurationSeconds: 240, retryPolicy: 'supportiveRetry', accessibilityModes: ['keyboard', 'touchFallback', 'screenReader'], seedPolicy: 'fixed' },
    { id: 'meadow-c', status: 'planned', biomeId: 'meadow-base', lessonId: 'meadow-review', missionType: 'review', objectiveKey: 'mission.meadow.c', typingInteractionId: 'home-row-review', restorationOutcomeId: 'meadow-restored', rewardIds: ['reward.meadow.restored', 'reward.monarch'], estimatedDurationSeconds: 240, retryPolicy: 'supportiveRetry', accessibilityModes: ['keyboard', 'touchFallback', 'screenReader'], seedPolicy: 'fixed' },
  ],
  wildlife: [
    { id: 'achillea-millefolium', status: 'planned', commonNameKey: 'species.yarrow.name', scientificName: 'Achillea millefolium', biomeIds: ['meadow-base'], discoveryTrigger: 'mission:meadow-b:complete', illustrationAssetId: 'plants.yarrow.card', animationAssetIds: [], factContentIds: [], factReview: { status: 'pending', source: null, reviewer: null }, accessibilityDescriptionKey: 'species.yarrow.description', pronunciationKey: null },
    { id: 'danaus-plexippus', status: 'planned', commonNameKey: 'species.monarch.name', scientificName: 'Danaus plexippus', biomeIds: ['meadow-base'], discoveryTrigger: 'mission:meadow-c:sequence', illustrationAssetId: 'wildlife.monarch.idle', animationAssetIds: [], factContentIds: [], factReview: { status: 'pending', source: null, reviewer: null }, accessibilityDescriptionKey: 'species.monarch.description', pronunciationKey: null },
  ],
  rewards: [
    { id: 'reward.meadow.spots', type: 'habitatState', targetId: 'meadow-planting-spots' },
    { id: 'reward.meadow.flowers', type: 'habitatState', targetId: 'meadow-flowers' },
    { id: 'reward.yarrow', type: 'fieldGuideEntry', targetId: 'achillea-millefolium' },
    { id: 'reward.meadow.restored', type: 'habitatState', targetId: 'meadow-restored' },
    { id: 'reward.monarch', type: 'fieldGuideEntry', targetId: 'danaus-plexippus' },
  ],
  assets: ASSET_MANIFEST.map(({ id, status, sourcePath }) => ({ id, status, sourcePath })),
  strings: {
    en: {
      'biome.meadow.name': 'Meadow Base', 'biome.meadow.description': 'Help a meadow recover.',
      'biome.forest.name': 'Forest Trail', 'biome.forest.description': 'Explore upper-row keys.',
      'biome.wetlands.name': 'Wetlands', 'biome.wetlands.description': 'Explore lower-row keys.',
      'biome.river.name': 'River & Coast', 'biome.river.description': 'Learn capitals and Shift.',
      'biome.mountain.name': 'Mountain Research Station', 'biome.mountain.description': 'Learn numbers and punctuation.',
      'biome.reserve.name': 'Wildlife Reserve', 'biome.reserve.description': 'Review all learned keys.',
      'stage.meadow.sparse': 'The meadow has open patches ready for care.', 'stage.meadow.spots': 'Planting spots are marked.',
      'stage.meadow.flowers': 'Wildflower patches are growing.', 'stage.meadow.pollinator': 'A pollinator has arrived near the flowers.',
      'stage.meadow.restored': 'The meadow is healthier and ready for observation.',
      'mission.meadow.a': 'Mark planting spots with F and J.', 'mission.meadow.b': 'Grow wildflower patches with home-row practice.',
      'mission.meadow.c': 'Care for the meadow and observe returning wildlife.',
      'species.yarrow.name': 'Common yarrow', 'species.yarrow.description': 'Illustration slot for a flowering meadow plant.',
      'species.monarch.name': 'Monarch butterfly', 'species.monarch.description': 'Illustration slot for a butterfly near meadow flowers.',
    },
    fr: {
      'biome.meadow.name': 'Base de la prairie', 'biome.meadow.description': 'Aide une prairie à se rétablir.',
      'biome.forest.name': 'Sentier forestier', 'biome.forest.description': 'Explore la rangée du haut.',
      'biome.wetlands.name': 'Zones humides', 'biome.wetlands.description': 'Explore la rangée du bas.',
      'biome.river.name': 'Rivière et côte', 'biome.river.description': 'Apprends les majuscules et Maj.',
      'biome.mountain.name': 'Station de recherche en montagne', 'biome.mountain.description': 'Apprends les chiffres et la ponctuation.',
      'biome.reserve.name': 'Réserve faunique', 'biome.reserve.description': 'Révise les touches apprises.',
      'stage.meadow.sparse': 'La prairie a des espaces à aménager.', 'stage.meadow.spots': 'Les endroits à planter sont marqués.',
      'stage.meadow.flowers': 'Les fleurs sauvages poussent.', 'stage.meadow.pollinator': 'Un pollinisateur arrive près des fleurs.',
      'stage.meadow.restored': 'La prairie se porte mieux et peut être observée.',
      'mission.meadow.a': 'Marque les endroits à planter avec F et J.', 'mission.meadow.b': 'Fais pousser les fleurs en pratiquant la rangée de repos.',
      'mission.meadow.c': 'Prends soin de la prairie et observe la faune de retour.',
      'species.yarrow.name': 'Achillée millefeuille', 'species.yarrow.description': 'Emplacement prévu pour une illustration de plante fleurie.',
      'species.monarch.name': 'Monarque', 'species.monarch.description': 'Emplacement prévu pour une illustration de papillon près des fleurs.',
    },
    es: {
      'biome.meadow.name': 'Base de la pradera', 'biome.meadow.description': 'Ayuda a recuperar una pradera.',
      'biome.forest.name': 'Sendero del bosque', 'biome.forest.description': 'Explora la fila superior.',
      'biome.wetlands.name': 'Humedales', 'biome.wetlands.description': 'Explora la fila inferior.',
      'biome.river.name': 'Río y costa', 'biome.river.description': 'Aprende mayúsculas y Mayús.',
      'biome.mountain.name': 'Estación de investigación de montaña', 'biome.mountain.description': 'Aprende números y puntuación.',
      'biome.reserve.name': 'Reserva de vida silvestre', 'biome.reserve.description': 'Repasa las teclas aprendidas.',
      'stage.meadow.sparse': 'La pradera tiene espacios que necesitan cuidado.', 'stage.meadow.spots': 'Los lugares para plantar están marcados.',
      'stage.meadow.flowers': 'Crecen parches de flores silvestres.', 'stage.meadow.pollinator': 'Un polinizador llega cerca de las flores.',
      'stage.meadow.restored': 'La pradera está más sana y lista para observar.',
      'mission.meadow.a': 'Marca lugares para plantar con F y J.', 'mission.meadow.b': 'Haz crecer las flores practicando la fila guía.',
      'mission.meadow.c': 'Cuida la pradera y observa el regreso de la fauna.',
      'species.yarrow.name': 'Milenrama común', 'species.yarrow.description': 'Espacio para una ilustración de una planta de pradera con flores.',
      'species.monarch.name': 'Mariposa monarca', 'species.monarch.description': 'Espacio para una ilustración de una mariposa junto a flores.',
    },
  },
};
