import { BIOME_ORDER, LESSON_BIOMES } from '../curriculum/biomeMapping';
import type { BiomeId } from '../curriculum/biomeMapping';
import type { LocaleId } from '../curriculum/domain';
import type { BiomeDefinition, ContentData, MissionDefinition, RestorationStage, RewardDefinition, SpeciesId, WildlifeEntry } from './schema';
import { STARTER_CONTENT } from './data';
import { ASSET_MANIFEST, getAsset, validateAssetManifest, type AssetDefinition } from '../assets/manifest';
import { BIOME_PALETTES } from '../assets/palettes';

const locales: readonly LocaleId[] = ['en', 'fr', 'es'];
const rewardTypes = ['habitatState', 'fieldGuideEntry', 'companionMilestone', 'badge'];
const forbiddenFields = ['coins', 'gems', 'currency', 'loot', 'xp', 'price', 'purchasableEnergy'];

function uniqueIds(entries: readonly { id: string }[], path: string, failures: string[]): void {
  const seen = new Set<string>();
  for (const [index, entry] of entries.entries()) {
    if (!entry?.id || typeof entry.id !== 'string') failures.push(`${path}[${index}].id: missing stable id`);
    else if (seen.has(entry.id)) failures.push(`${path}[${index}].id: duplicate ${entry.id}`);
    else seen.add(entry.id);
  }
}

/** Validates untrusted authored data at runtime, with paths suitable for CI errors. */
export function validateContent(input: unknown): readonly string[] {
  const failures: string[] = [];
  if (!input || typeof input !== 'object') return ['content: expected an object'];
  const data = input as ContentData;
  for (const name of ['biomes', 'stages', 'missions', 'wildlife', 'rewards', 'assets'] as const) {
    if (!Array.isArray(data[name])) failures.push(`${name}: expected an array`);
  }
  if (!data.strings || typeof data.strings !== 'object') failures.push('strings: expected a locale map');
  if (failures.length) return failures;
  if (data.releasePhase !== 'meadow' && data.releasePhase !== 'expanded') failures.push('releasePhase: expected meadow or expanded');
  failures.push(...validateAssetManifest());
  const manifest = new Map(ASSET_MANIFEST.map((entry) => [entry.id, entry]));
  for (const [index, assetSlot] of data.assets.entries()) {
    const entry = manifest.get(assetSlot?.id);
    if (!entry || assetSlot.status !== entry.status || assetSlot.sourcePath !== entry.sourcePath) failures.push(`assets[${index}]: typed manifest mismatch for ${assetSlot?.id}`);
  }
  const requiredArrays: Readonly<Record<string, readonly string[]>> = {
    biomes: ['lessonIds', 'restorationStageIds', 'missionIds', 'wildlifeDiscoveryIds'],
    stages: ['visibleLayers', 'hiddenLayers', 'propChanges', 'wildlifeArrivals'],
    missions: ['rewardIds', 'accessibilityModes'], wildlife: ['biomeIds', 'animationAssetIds', 'factContentIds'],
  };
  for (const [section, fields] of Object.entries(requiredArrays)) {
    for (const [index, value] of (data[section as keyof ContentData] as readonly object[]).entries()) {
      if (!value || typeof value !== 'object') { failures.push(`${section}[${index}]: expected an object`); continue; }
      for (const field of fields) if (!Array.isArray((value as Record<string, unknown>)[field])) failures.push(`${section}[${index}].${field}: expected an array`);
      if (section === 'wildlife' && (!(value as WildlifeEntry).factReview || typeof (value as WildlifeEntry).factReview !== 'object')) failures.push(`${section}[${index}].factReview: missing review record`);
    }
  }
  if (failures.length) return failures;
  for (const name of ['biomes', 'stages', 'missions', 'wildlife', 'rewards', 'assets'] as const) uniqueIds(data[name], name, failures);
  const biomes = new Map(data.biomes.map((entry) => [entry.id, entry]));
  const missions = new Map(data.missions.map((entry) => [entry.id, entry]));
  const stages = new Map(data.stages.map((entry) => [entry.id, entry]));
  const wildlife = new Map(data.wildlife.map((entry) => [entry.id, entry]));
  const rewards = new Map(data.rewards.map((entry) => [entry.id, entry]));
  const assets = new Map(data.assets.map((entry) => [entry.id, entry]));
  const requiredStrings = new Set<string>();
  const key = (value: string, path: string): void => {
    if (!value || typeof value !== 'string') failures.push(`${path}: missing content key`);
    else requiredStrings.add(value);
  };
  const asset = (id: string, path: string, implemented: boolean): void => {
    const slot = assets.get(id);
    if (!slot) failures.push(`${path}: missing asset ${id}`);
    else if (implemented && (slot.status !== 'implemented' || !slot.sourcePath)) failures.push(`${path}: implemented content needs a built asset ${id}`);
  };
  const milestone = (value: string, path: string): void => {
    if (value === 'initial') return;
    const match = /^mission:(.+):(complete|sequence)$/.exec(value || '');
    if (!match || !missions.has(match[1]!)) failures.push(`${path}: invalid mission milestone ${value}`);
  };

  if (data.biomes.length !== BIOME_ORDER.length || BIOME_ORDER.some((id) => !biomes.has(id))) failures.push('biomes: exactly six canonical biomes are required');
  for (const [index, biome] of data.biomes.entries()) {
    const path = `biomes[${index}]`;
    if (biome.status !== 'planned' && biome.status !== 'implemented') failures.push(`${path}.status: invalid`);
    if (data.releasePhase === 'meadow' && biome.id !== 'meadow-base' && biome.status === 'implemented') failures.push(`${path}.status: later biome must remain planned before Meadow gate`);
    if (!Number.isInteger(biome.contentVersion) || biome.contentVersion < 1) failures.push(`${path}.contentVersion: expected positive integer`);
    key(biome.displayNameKey, `${path}.displayNameKey`); key(biome.shortDescriptionKey, `${path}.shortDescriptionKey`);
    if (!biome.sceneKey || !biome.assetPackId || biome.paletteToken !== BIOME_PALETTES[biome.id]?.token || biome.unlockSelectorId !== 'canEnterBiome' || biome.completionSelectorId !== 'biomeMissionsComplete') failures.push(`${path}: missing scene, pack, palette or selector contract`);
    const expectedLessons = Object.entries(LESSON_BIOMES).filter(([, id]) => id === biome.id).map(([id]) => id);
    if (JSON.stringify([...biome.lessonIds].sort()) !== JSON.stringify(expectedLessons.sort())) failures.push(`${path}.lessonIds: curriculum mapping mismatch`);
    for (const id of biome.missionIds) if (missions.get(id)?.biomeId !== biome.id) failures.push(`${path}.missionIds: missing or foreign ${id}`);
    for (const id of biome.restorationStageIds) if (stages.get(id)?.biomeId !== biome.id) failures.push(`${path}.restorationStageIds: missing or foreign ${id}`);
    for (const id of biome.wildlifeDiscoveryIds) if (!wildlife.get(id)?.biomeIds.includes(biome.id)) failures.push(`${path}.wildlifeDiscoveryIds: missing or foreign ${id}`);
    if (biome.ambientAudioId) asset(biome.ambientAudioId, `${path}.ambientAudioId`, biome.status === 'implemented');
    if (biome.status === 'implemented' && (!biome.missionIds.length || !biome.restorationStageIds.length)) failures.push(`${path}: implemented biome needs missions and stages`);
    const ordered = biome.restorationStageIds.map((id) => stages.get(id)?.order);
    if (ordered.some((order, stageIndex) => order !== stageIndex)) failures.push(`${path}.restorationStageIds: gap, duplicate or out-of-order stage`);
  }

  for (const [index, stage] of data.stages.entries()) {
    const path = `stages[${index}]`;
    const biome = biomes.get(stage.biomeId);
    if (!biome?.restorationStageIds.includes(stage.id)) failures.push(`${path}.biomeId: missing biome/stage reference`);
    if (!Number.isInteger(stage.order) || stage.order < 0) failures.push(`${path}.order: invalid`);
    milestone(stage.requiredMilestone, `${path}.requiredMilestone`);
    for (const id of [...stage.visibleLayers, ...stage.hiddenLayers, ...stage.propChanges]) asset(id, `${path}.layers`, biome?.status === 'implemented');
    for (const id of stage.wildlifeArrivals) if (!wildlife.has(id)) failures.push(`${path}.wildlifeArrivals: missing ${id}`);
    key(stage.accessibleSummaryKey, `${path}.accessibleSummaryKey`);
    if (!['instantLayerSwap', 'gentleFade'].includes(stage.reducedMotionFallback)) failures.push(`${path}.reducedMotionFallback: missing`);
    if (!stage.completionPersistenceKey?.startsWith('naturequest:v2:')) failures.push(`${path}.completionPersistenceKey: missing v2 namespace`);
  }

  for (const [index, mission] of data.missions.entries()) {
    const path = `missions[${index}]`;
    const biome = biomes.get(mission.biomeId);
    if (!biome?.missionIds.includes(mission.id)) failures.push(`${path}.biomeId: missing biome/mission reference`);
    if (LESSON_BIOMES[mission.lessonId] !== mission.biomeId || !biome?.lessonIds.includes(mission.lessonId)) failures.push(`${path}.lessonId: outside biome curriculum`);
    if (stages.get(mission.restorationOutcomeId)?.biomeId !== mission.biomeId) failures.push(`${path}.restorationOutcomeId: missing or foreign stage`);
    for (const id of mission.rewardIds) if (!rewards.has(id)) failures.push(`${path}.rewardIds: missing ${id}`);
    key(mission.objectiveKey, `${path}.objectiveKey`);
    if (!mission.typingInteractionId || !Number.isFinite(mission.estimatedDurationSeconds) || mission.estimatedDurationSeconds <= 0 || !mission.accessibilityModes.includes('screenReader') || mission.retryPolicy !== 'supportiveRetry' || !['fixed', 'sessionSeed'].includes(mission.seedPolicy)) failures.push(`${path}: invalid interaction, duration, accessibility, retry or seed contract`);
    if (mission.status === 'implemented' && biome?.status !== 'implemented') failures.push(`${path}.status: implemented mission in planned biome`);
  }

  for (const [index, entry] of data.wildlife.entries()) {
    const path = `wildlife[${index}]`;
    key(entry.commonNameKey, `${path}.commonNameKey`); key(entry.accessibilityDescriptionKey, `${path}.accessibilityDescriptionKey`);
    if (entry.pronunciationKey) key(entry.pronunciationKey, `${path}.pronunciationKey`);
    for (const id of entry.biomeIds) if (!biomes.get(id)?.wildlifeDiscoveryIds.includes(entry.id)) failures.push(`${path}.biomeIds: missing or foreign ${id}`);
    if (!entry.biomeIds.length) failures.push(`${path}.biomeIds: empty`);
    milestone(entry.discoveryTrigger, `${path}.discoveryTrigger`);
    asset(entry.illustrationAssetId, `${path}.illustrationAssetId`, entry.status === 'implemented');
    for (const id of entry.animationAssetIds) asset(id, `${path}.animationAssetIds`, entry.status === 'implemented');
    for (const id of entry.factContentIds) key(id, `${path}.factContentIds`);
    if (entry.status === 'implemented' && (entry.factReview.status !== 'reviewed' || !entry.factReview.source || !entry.factReview.reviewer || !entry.factContentIds.length)) failures.push(`${path}.factReview: production fact needs reviewed source, reviewer and content`);
  }

  for (const [index, reward] of data.rewards.entries()) {
    const path = `rewards[${index}]`;
    if (!rewardTypes.includes(reward.type)) failures.push(`${path}.type: unsupported reward ${reward.type}`);
    for (const field of forbiddenFields) if (Object.hasOwn(reward, field)) failures.push(`${path}.${field}: currency/loot fields forbidden`);
    if (reward.type === 'habitatState' && !stages.has(reward.targetId)) failures.push(`${path}.targetId: missing stage`);
    if (reward.type === 'fieldGuideEntry' && !wildlife.has(reward.targetId)) failures.push(`${path}.targetId: missing discovery`);
    if (!reward.targetId) failures.push(`${path}.targetId: missing`);
  }
  for (const locale of locales) for (const value of requiredStrings) {
    if (typeof data.strings[locale]?.[value] !== 'string' || !data.strings[locale][value]?.trim()) failures.push(`strings.${locale}.${value}: untranslated required key`);
  }
  return failures;
}

export class ContentRegistry {
  private readonly data: ContentData;
  constructor(data: ContentData = STARTER_CONTENT) {
    const failures = validateContent(data);
    if (failures.length) throw new Error(`Invalid v2 content:\n${failures.join('\n')}`);
    this.data = data;
  }
  getBiome(id: BiomeId): BiomeDefinition { const value = this.data.biomes.find((entry) => entry.id === id); if (!value) throw new Error(`Unknown biome ${id}`); return value; }
  getMission(id: string): MissionDefinition { const value = this.data.missions.find((entry) => entry.id === id); if (!value) throw new Error(`Unknown mission ${id}`); return value; }
  getRestorationStage(id: string): RestorationStage { const value = this.data.stages.find((entry) => entry.id === id); if (!value) throw new Error(`Unknown stage ${id}`); return value; }
  getWildlife(id: SpeciesId): WildlifeEntry { const value = this.data.wildlife.find((entry) => entry.id === id); if (!value) throw new Error(`Unknown species ${id}`); return value; }
  getReward(id: string): RewardDefinition { const value = this.data.rewards.find((entry) => entry.id === id); if (!value) throw new Error(`Unknown reward ${id}`); return value; }
  getAsset(id: string): AssetDefinition { return getAsset(id); }
  getString(key: string, locale: LocaleId): string { const value = this.data.strings[locale][key]; if (!value) throw new Error(`Untranslated content ${locale}.${key}`); return value; }
  getImplementedBiomes(): readonly BiomeDefinition[] { return this.data.biomes.filter((entry) => entry.status === 'implemented'); }
}

export const contentRegistry = new ContentRegistry();
