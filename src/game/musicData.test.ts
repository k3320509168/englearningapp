import { describe, expect, it } from 'vitest';
import { SONGS, musicTrackFor, regionMusic, validateMusicData } from './musicData';

describe('背景音樂資料', () => {
  it('每首曲子格式正確（8 小節、MIDI 範圍）', () => {
    expect(() => validateMusicData()).not.toThrow();
    expect(Object.keys(SONGS)).toHaveLength(25);
  });
  it('選曲：區域、戰鬥、各種 BOSS', () => {
    expect(regionMusic(0)).toBe('a1');
    expect(regionMusic(8)).toBe('c2');
    expect(musicTrackFor('a1', 'map')).toBe('map-a1');
    expect(musicTrackFor('a2p', 'normal')).toBe('battle-a2p');
    expect(musicTrackFor('b1', 'big')).toBe('boss-big');
    expect(musicTrackFor('c1', 'region')).toBe('boss-region');
    expect(musicTrackFor('c2', 'region')).toBe('boss-silent');
  });
});
