import { describe, expect, it } from 'vitest';
import {
  ALL_WEAPONS,
  PROTAGONIST_WEAPONS,
  SSR_HERO_WEAPONS,
  WEAPON_MAX_LEVEL,
  WEAPON_SPARK_COST,
  WEAPON_UNLOCK_REGION,
  rollWeaponSummon,
  weaponAtkMultiplier,
  weaponCombinedMods,
  weaponDef,
  weaponForClass,
  weaponForHero,
  weaponUpgradeCost,
} from './weapons';
import { useSaveStore } from '../store/saveStore';

describe('Exclusive Weapon System (專武系統)', () => {
  it('defines 8 SSR hero weapons and 5 protagonist weapons with unique IDs', () => {
    expect(SSR_HERO_WEAPONS).toHaveLength(8);
    expect(PROTAGONIST_WEAPONS).toHaveLength(5);
    expect(ALL_WEAPONS).toHaveLength(13);

    const ids = new Set(ALL_WEAPONS.map(w => w.id));
    expect(ids.size).toBe(ALL_WEAPONS.length);
  });

  it('correctly retrieves weapons by hero ID and class ID', () => {
    const phoenixWp = weaponForHero('phoenix');
    expect(phoenixWp).toBeDefined();
    expect(phoenixWp?.name).toBe('不死火鳥之羽杖');

    const swordWp = weaponForClass('swordsman');
    expect(swordWp).toBeDefined();
    expect(swordWp?.name).toBe('誓約聖劍・艾爾德');

    expect(weaponDef('wp_tempest')?.name).toBe('暴風怒濤之弓');
  });

  it('calculates weapon attack multipliers across levels 0 to 5', () => {
    expect(weaponAtkMultiplier(0)).toBeCloseTo(0.07, 3);
    expect(weaponAtkMultiplier(1)).toBeCloseTo(0.086, 3);
    expect(weaponAtkMultiplier(WEAPON_MAX_LEVEL)).toBeCloseTo(0.15, 3);
    // Over-cap clamped to level 5
    expect(weaponAtkMultiplier(10)).toBeCloseTo(0.15, 3);
  });

  it('provides upgrade costs up to max level and null at max level', () => {
    const cost0 = weaponUpgradeCost(0);
    expect(cost0).toEqual({ shards: 5, gold: 500 });

    const cost4 = weaponUpgradeCost(4);
    expect(cost4).toEqual({ shards: 30, gold: 5000 });

    expect(weaponUpgradeCost(5)).toBeNull();
  });

  it('combines weapon passive mods with attack multiplier', () => {
    const wp = weaponDef('wp_eclipse')!;
    const mods = weaponCombinedMods(wp, 0);
    expect(mods.atk).toBeCloseTo(0.07, 3);
    expect(mods.crit).toBe(0.06);
    expect(mods.critDmg).toBe(0.35);
  });

  it('enforces 30-pull pity in rollWeaponSummon', () => {
    // Mock rand that returns 0.99 (fails 5% weapon chance)
    const mockRand = () => 0.99;

    const counter = { sinceSsr: 29, spark: 0 };
    const res = rollWeaponSummon(1, counter, {}, mockRand);
    expect(res.drops[0].kind).toBe('weapon');
    expect(res.nextCounter.sinceSsr).toBe(0);
    expect(res.nextCounter.spark).toBe(1);
  });

  it('handles weapon summon, upgrade, and spark in saveStore', () => {
    const store = useSaveStore.getState();
    store.resetProgress();

    // Add weapon tickets and gold
    store.addWeaponTickets(30);
    store.addGold(50000);
    expect(useSaveStore.getState().weaponTickets).toBe(30);

    // Summon 10 weapons
    const drops = store.summonWeapons(10);
    expect(drops).toBeDefined();
    expect(drops?.length).toBe(10);
    expect(useSaveStore.getState().weaponTickets).toBe(20);
    expect(useSaveStore.getState().weaponCounter.spark).toBe(10);

    // Test manual weapon unlock
    store.unlockWeapon('wp_swordsman');
    expect(useSaveStore.getState().weapons.wp_swordsman).toEqual({ level: 0, unlocked: true });

    // Give shards to upgrade
    useSaveStore.setState(s => ({
      weaponShards: { ...s.weaponShards, wp_swordsman: 50 },
    }));

    const upgraded = store.upgradeWeapon('wp_swordsman');
    expect(upgraded).toBe(true);
    expect(useSaveStore.getState().weapons.wp_swordsman.level).toBe(1);

    // Test spark redemption
    useSaveStore.setState(s => ({
      weaponCounter: { ...s.weaponCounter, spark: WEAPON_SPARK_COST },
    }));

    const sparkSuccess = store.exchangeWeaponSpark('wp_tempest');
    expect(sparkSuccess).toBe(true);
    expect(useSaveStore.getState().weapons.wp_tempest.unlocked).toBe(true);
    expect(useSaveStore.getState().weaponCounter.spark).toBe(0);

    // Defeating B1 boss grants 10 weapon tickets
    store.defeatRegionBoss(WEAPON_UNLOCK_REGION);
    expect(useSaveStore.getState().weaponTickets).toBe(30); // 20 + 10 = 30
  });
});
