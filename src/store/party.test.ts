import { beforeEach, describe, expect, it } from 'vitest';
import { initialSave, useSaveStore } from './saveStore';
import { DEFAULT_CHARACTER } from '../game/character';

const party = () => useSaveStore.getState().party;
const place = (id: string, slot: number) => useSaveStore.getState().placeMember(id, slot);

// 隊伍拖拉：拖到格子上換位、替換、補空位
describe('placeMember', () => {
  beforeEach(() => {
    useSaveStore.setState({ ...initialSave, character: DEFAULT_CHARACTER, heroes: ['knight', 'forest', 'island', 'castle'], party: ['player', 'knight'] });
  });

  it('swaps two party members (dragging to slot 1 makes a new leader)', () => {
    place('knight', 0);
    expect(party()).toEqual(['knight', 'player']);
  });

  it('adds a hero dropped on an empty slot', () => {
    place('forest', 3);
    expect(party()).toEqual(['player', 'knight', 'forest']);
  });

  it('replaces the member in an occupied slot', () => {
    place('island', 1);
    expect(party()).toEqual(['player', 'island']);
  });

  it('ignores heroes the player does not own and full parties on empty slots', () => {
    place('nobody', 2);
    expect(party()).toEqual(['player', 'knight']);
    useSaveStore.setState({ party: ['player', 'knight', 'forest', 'island'] });
    place('castle', 3);
    expect(party()).toEqual(['player', 'knight', 'forest', 'castle']);
  });
});
