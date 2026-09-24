import type { BiomeId } from '../curriculum/biomeMapping';
import type { LessonId, LocaleId } from '../curriculum/domain';

export type ContentStatus = 'planned' | 'implemented';
export type ContentKey = string;
export type AssetId = string;
export type RestorationStageId = string;
export type MissionId = string;
export type SpeciesId = string;
export type RewardId = string;

export interface BiomeDefinition {
  readonly id: BiomeId;
  readonly status: ContentStatus;
  readonly contentVersion: number;
  readonly displayNameKey: ContentKey;
  readonly shortDescriptionKey: ContentKey;
  readonly lessonIds: readonly LessonId[];
  readonly sceneKey: string;
  readonly assetPackId: string;
  readonly restorationStageIds: readonly RestorationStageId[];
  readonly missionIds: readonly MissionId[];
  readonly wildlifeDiscoveryIds: readonly SpeciesId[];
  readonly ambientAudioId: AssetId | null;
  readonly paletteToken: string;
  readonly unlockSelectorId: 'canEnterBiome';
  readonly completionSelectorId: 'biomeMissionsComplete';
}

export interface RestorationStage {
  readonly id: RestorationStageId;
  readonly biomeId: BiomeId;
  readonly order: number;
  readonly requiredMilestone: string;
  readonly visibleLayers: readonly AssetId[];
  readonly hiddenLayers: readonly AssetId[];
  readonly propChanges: readonly AssetId[];
  readonly wildlifeArrivals: readonly SpeciesId[];
  readonly animationCueId: string | null;
  readonly accessibleSummaryKey: ContentKey;
  readonly reducedMotionFallback: 'instantLayerSwap' | 'gentleFade';
  readonly completionPersistenceKey: string;
}

export interface MissionDefinition {
  readonly id: MissionId;
  readonly status: ContentStatus;
  readonly biomeId: BiomeId;
  readonly lessonId: LessonId;
  readonly missionType: 'introduction' | 'growth' | 'review';
  readonly objectiveKey: ContentKey;
  readonly typingInteractionId: string;
  readonly restorationOutcomeId: RestorationStageId;
  readonly rewardIds: readonly RewardId[];
  readonly estimatedDurationSeconds: number;
  readonly retryPolicy: 'supportiveRetry';
  readonly accessibilityModes: readonly ('keyboard' | 'touchFallback' | 'screenReader')[];
  readonly seedPolicy: 'fixed' | 'sessionSeed';
}

export interface WildlifeEntry {
  readonly id: SpeciesId;
  readonly status: ContentStatus;
  readonly commonNameKey: ContentKey;
  readonly scientificName: string | null;
  readonly biomeIds: readonly BiomeId[];
  readonly discoveryTrigger: string;
  readonly illustrationAssetId: AssetId;
  readonly animationAssetIds: readonly AssetId[];
  readonly factContentIds: readonly ContentKey[];
  readonly factReview: { readonly status: 'pending' | 'reviewed'; readonly source: string | null; readonly reviewer: string | null };
  readonly accessibilityDescriptionKey: ContentKey;
  readonly pronunciationKey: ContentKey | null;
}

export interface RewardDefinition {
  readonly id: RewardId;
  readonly type: 'habitatState' | 'fieldGuideEntry' | 'companionMilestone' | 'badge';
  readonly targetId: string;
}

export interface AssetSlot { readonly id: AssetId; readonly status: ContentStatus; readonly sourcePath: string | null; }
export type LocalizedStrings = Readonly<Record<LocaleId, Readonly<Record<ContentKey, string>>>>;
export interface ContentData {
  readonly releasePhase: 'meadow' | 'expanded';
  readonly biomes: readonly BiomeDefinition[];
  readonly stages: readonly RestorationStage[];
  readonly missions: readonly MissionDefinition[];
  readonly wildlife: readonly WildlifeEntry[];
  readonly rewards: readonly RewardDefinition[];
  readonly assets: readonly AssetSlot[];
  readonly strings: LocalizedStrings;
}
