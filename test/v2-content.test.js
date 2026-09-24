import { describe, expect, it } from 'vitest';
import { STARTER_CONTENT } from '../src/v2/content/data.ts';
import { ContentRegistry, contentRegistry, validateContent } from '../src/v2/content/registry.ts';

const cloneContent = () => JSON.parse(JSON.stringify(STARTER_CONTENT));
function invalidAt(section, index, patch) {
  const data = cloneContent();
  data[section][index] = { ...data[section][index], ...patch };
  return validateContent(data);
}

describe('v2 data-driven content model (#159)', () => {
  it('validates canonical stubs and sample Meadow with stable registry lookup', () => {
    expect(validateContent(STARTER_CONTENT)).toEqual([]);
    expect(STARTER_CONTENT.biomes).toHaveLength(6);
    expect(STARTER_CONTENT.missions.map((mission) => mission.lessonId)).toEqual(['meadow-fj', 'meadow-growth', 'meadow-review']);
    expect(STARTER_CONTENT.stages.map((stage) => stage.order)).toEqual([0, 1, 2, 3, 4]);
    expect(STARTER_CONTENT.biomes.filter((biome) => biome.id !== 'meadow-base').every((biome) => biome.status === 'planned')).toBe(true);
    expect(contentRegistry.getImplementedBiomes()).toEqual([]);
    expect(contentRegistry.getBiome('meadow-base').missionIds).toEqual(['meadow-a', 'meadow-b', 'meadow-c']);
    expect(contentRegistry.getMission('meadow-a').lessonId).toBe('meadow-fj');
    expect(contentRegistry.getRestorationStage('meadow-restored').order).toBe(4);
    expect(contentRegistry.getWildlife('danaus-plexippus').factReview.status).toBe('pending');
    expect(contentRegistry.getReward('reward.monarch').type).toBe('fieldGuideEntry');
    for (const locale of ['en', 'fr', 'es']) expect(contentRegistry.getString('mission.meadow.a', locale).length).toBeGreaterThan(0);
    expect(() => contentRegistry.getMission('missing')).toThrow(/Unknown mission/);
  });

  it('reports duplicate/missing references and curriculum mismatches with paths', () => {
    expect(invalidAt('missions', 1, { id: 'meadow-a' })).toContain('missions[1].id: duplicate meadow-a');
    expect(invalidAt('missions', 0, { lessonId: 'forest-upper' })).toContain('missions[0].lessonId: outside biome curriculum');
    expect(invalidAt('missions', 0, { restorationOutcomeId: 'unknown' })).toContain('missions[0].restorationOutcomeId: missing or foreign stage');
    expect(invalidAt('stages', 1, { order: 3 }).some((error) => error.includes('out-of-order stage'))).toBe(true);
    expect(invalidAt('stages', 1, { reducedMotionFallback: null })).toContain('stages[1].reducedMotionFallback: missing');
    expect(invalidAt('stages', 1, { accessibleSummaryKey: '' })).toContain('stages[1].accessibleSummaryKey: missing content key');
    expect(invalidAt('stages', 1, { visibleLayers: ['unlisted'] })).toContain('stages[1].layers: missing asset unlisted');
    expect(invalidAt('wildlife', 0, { biomeIds: ['forest-trail'] }).some((error) => error.includes('wildlife[0].biomeIds'))).toBe(true);
    expect(invalidAt('wildlife', 0, { factReview: null })).toContain('wildlife[0].factReview: missing review record');
    expect(invalidAt('missions', 0, { rewardIds: null })).toContain('missions[0].rewardIds: expected an array');
    expect(invalidAt('biomes', 1, { status: 'implemented' })).toContain('biomes[1].status: later biome must remain planned before Meadow gate');
    const afterGate = cloneContent();
    afterGate.releasePhase = 'expanded';
    afterGate.biomes[1].status = 'implemented';
    expect(validateContent(afterGate)).not.toContain('biomes[1].status: later biome must remain planned before Meadow gate');
  });

  it('rejects unreviewed production facts, currencies, missing locales and planned assets falsely marked complete', () => {
    expect(invalidAt('wildlife', 0, { status: 'implemented' }).some((error) => error.includes('factReview'))).toBe(true);
    expect(invalidAt('rewards', 0, { type: 'coins', coins: 10 }).some((error) => error.includes('unsupported reward'))).toBe(true);
    expect(invalidAt('rewards', 0, { type: 'coins', coins: 10 })).toContain('rewards[0].coins: currency/loot fields forbidden');
    const untranslated = cloneContent();
    delete untranslated.strings.fr['mission.meadow.a'];
    expect(validateContent(untranslated)).toContain('strings.fr.mission.meadow.a: untranslated required key');
    const production = cloneContent();
    production.biomes[0].status = 'implemented';
    expect(validateContent(production).some((error) => error.includes('implemented content needs a built asset'))).toBe(true);
    expect(() => new ContentRegistry(untranslated)).toThrow(/strings.fr.mission.meadow.a/);
  });
});
