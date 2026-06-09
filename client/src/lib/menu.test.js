import { describe, it, expect } from 'vitest';
import { unitPrice, formatSpecs, validateSchedule, groupsForItem, defaultSpecs } from './menu.js';

const config = {
  optionGroups: {
    scoops: { label: 'scoopsLabel', type: 'radio', values: ['oneScoop', 'twoScoops', 'threeScoops'], def: 'oneScoop' },
    serving: { label: 'servingLabel', type: 'radio', values: ['cup', 'cone'], def: 'cup' },
    toppings: { label: 'toppingsLabel', type: 'multi', values: ['nuts', 'pistachio'] },
    flavors: { label: 'flavorsLabel', type: 'multi', values: ['fA', 'fB'] },
    cakeSize: { label: 'cakeSizeLabel', type: 'radio', values: ['cake6', 'cake10'], def: 'cake6' },
    cakeFlavor: { label: 'cakeFlavorLabel', type: 'multi', values: ['fA', 'fB'] },
    cakeMsg: { label: 'cakeMsgLabel', type: 'text' },
  },
  optionPrices: {
    scoops: { oneScoop: 0, twoScoops: 1, threeScoops: 2 },
    serving: { cup: 0, cone: 0.5 },
    toppings: { nuts: 0.75, pistachio: 1 },
    cakeSize: { cake6: 0, cake10: 8 },
  },
};
const t = (k) => k;
const scoop = { category: 'arabic', price: 3 };
const cake = { category: 'cakes', price: 18, maxFlavors: 2 };

describe('unitPrice', () => {
  it('base price with no add-ons', () =>
    expect(unitPrice(scoop, { scoops: 'oneScoop', serving: 'cup', toppings: [] }, config)).toBe(3));
  it('two scoops + cone + nuts = 5.25', () =>
    expect(unitPrice(scoop, { scoops: 'twoScoops', serving: 'cone', toppings: ['nuts'] }, config)).toBe(5.25));
  it('cake size surcharge', () =>
    expect(unitPrice(cake, { cakeSize: 'cake10', cakeFlavor: [] }, config)).toBe(26));
});

describe('groupsForItem', () => {
  it('cakes', () => expect(groupsForItem('cakes')).toEqual(['cakeSize', 'cakeFlavor', 'cakeMsg']));
  it('boxes', () => expect(groupsForItem('boxes')).toEqual(['flavors']));
  it('default scoop item', () => expect(groupsForItem('arabic')).toEqual(['scoops', 'serving', 'toppings']));
});

describe('validateSchedule', () => {
  it('cake requires a date', () => expect(validateSchedule({ date: '', time: '', leadDays: 2 })).toBe('cakeLead'));
  it('rejects before opening hours', () => expect(validateSchedule({ date: '2999-01-01', time: '09:00', leadDays: 0 })).toBe('outsideHours'));
  it('accepts a valid in-hours slot', () => expect(validateSchedule({ date: '2999-01-01', time: '23:00', leadDays: 0 })).toBe(null));
});

describe('formatSpecs', () => {
  it('renders scoop selections', () =>
    expect(formatSpecs(scoop, { scoops: 'twoScoops', serving: 'cone', toppings: ['nuts'] }, t, config)).toContain('twoScoops'));
  it('shows assorted when a cake has no flavor', () =>
    expect(formatSpecs(cake, { cakeSize: 'cake6', cakeFlavor: [] }, t, config)).toContain('assorted'));
});

describe('defaultSpecs', () => {
  it('builds correct cake defaults', () => {
    const s = defaultSpecs(cake, config);
    expect(s.cakeSize).toBe('cake6');
    expect(s.cakeFlavor).toEqual([]);
    expect(s.cakeMsg).toBe('');
  });
});
