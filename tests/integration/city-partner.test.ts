import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { mkdtemp, rm } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { randomUUID } from 'node:crypto';
import { createLocalDatabase, type LocalDatabase } from '../../server/database.js';
import { createPlayer, runCommand, state } from './fixtures.js';
import { CATALOG as clientCatalog } from '../../src/lib/catalog.js';

let directory: string;
let database: LocalDatabase;
beforeAll(async () => {
  directory = await mkdtemp(join(tmpdir(), 'lifecity-city-'));
  database = await createLocalDatabase({path: join(directory, 'db')});
}, 60_000);
afterAll(async () => { await database?.close(); if (directory) await rm(directory, {recursive: true, force: true}); });

describe('city commerce and persisted placements', () => {
  it('matches display catalog prices/footprints to the authoritative SQL seed', async () => {
    const player = await createPlayer(database, 'catalog');
    const catalog = (await state(database, player.id)).catalog;
    expect(catalog).toHaveLength(clientCatalog.length);
    for (const item of clientCatalog) expect(catalog.find((row) => row.id === item.id)).toMatchObject({id: item.id, price: item.price, footprint_x: item.footprint_x, footprint_z: item.footprint_z, is_furniture: item.is_furniture});
  });

  it('uses server prices, enforces ownership/collision/version, and recovers purchased inventory', async () => {
    const owner = await createPlayer(database, 'builder', 30_000);
    const stranger = await createPlayer(database, 'stranger', 30_000);
    const key = randomUUID();
    const bought = await runCommand(database, owner.id, 'purchase', {catalog_id: 'road', price: 0, user_id: stranger.id}, key);
    await runCommand(database, owner.id, 'purchase', {catalog_id: 'road', price: 0, user_id: stranger.id}, key);
    const inventoryId = bought.result.inventory_id as string;
    expect((await state(database, owner.id)).wallet.balance).toBe(29_990);
    expect((await state(database, owner.id)).inventory).toHaveLength(1);
    await expect(runCommand(database, stranger.id, 'place', {inventory_id: inventoryId, x: 0, z: 0, rotation: 0})).rejects.toThrow(/not_owned/i);
    const placed = await runCommand(database, owner.id, 'place', {inventory_id: inventoryId, x: 2, z: 3, rotation: 90});
    const placementId = placed.result.placement_id as string;
    const second = await runCommand(database, owner.id, 'purchase', {catalog_id: 'tree'});
    await expect(runCommand(database, owner.id, 'place', {inventory_id: second.result.inventory_id, x: 2, z: 3, rotation: 0})).rejects.toThrow(/collision/i);
    await expect(runCommand(database, owner.id, 'place', {inventory_id: second.result.inventory_id, x: 15, z: 15, rotation: 45})).rejects.toThrow(/invalid_rotation/i);
    await runCommand(database, owner.id, 'move', {placement_id: placementId, x: 5, z: 7, rotation: 270, expected_version: 1});
    await expect(runCommand(database, owner.id, 'move', {placement_id: placementId, x: 6, z: 7, rotation: 0, expected_version: 1})).rejects.toThrow(/version_conflict/i);
    const saved = await state(database, owner.id);
    expect(saved.placements.find((row) => row.id === placementId)).toMatchObject({inventory_id: inventoryId, x: 5, z: 7, rotation: 270, version: 2});
    const xp = saved.wallet.city_xp;
    await runCommand(database, owner.id, 'remove', {placement_id: placementId, expected_version: 2});
    const recovered = await state(database, owner.id);
    expect(recovered.placements).toHaveLength(0);
    expect(recovered.inventory.some((row) => row.id === inventoryId)).toBe(true);
    expect(recovered.wallet.balance).toBe(29_970);
    expect(recovered.wallet.city_xp).toBe(xp);
    await runCommand(database, owner.id, 'place', {inventory_id: inventoryId, x: 1, z: 1, rotation: 0});
    expect((await state(database, owner.id)).wallet.city_xp).toBe(xp);
  });

  it('persists water and furniture in an owned interior and recovers furniture with its house', async () => {
    const owner = await createPlayer(database, 'interior', 30_000);
    // Unlock fixtures are privileged SQL; production has no funding/XP endpoint.
    await database.owner((tx) => tx.query('UPDATE public.wallets SET city_xp=10000 WHERE user_id=$1', [owner.id]));
    const home = await runCommand(database, owner.id, 'purchase', {catalog_id: 'house'});
    const placed = await runCommand(database, owner.id, 'place', {inventory_id: home.result.inventory_id, x: 1, z: 1, rotation: 90});
    const houseId = placed.result.placement_id as string;
    const desk = await runCommand(database, owner.id, 'purchase', {catalog_id: 'desk'});
    await expect(runCommand(database, owner.id, 'place', {inventory_id: desk.result.inventory_id, x: 10, z: 10, rotation: 0})).rejects.toThrow(/wrong_item_type/i);
    const furnishing = await runCommand(database, owner.id, 'interior_place', {house_id: houseId, inventory_id: desk.result.inventory_id, x: 2, z: 3, rotation: 180});
    await runCommand(database, owner.id, 'interior_move', {placement_id: furnishing.result.placement_id, x: 4, z: 5, rotation: 90, expected_version: 1});
    await expect(runCommand(database, owner.id, 'interior_remove', {placement_id: furnishing.result.placement_id, expected_version: 1})).rejects.toThrow(/version_conflict/i);
    const lake = await runCommand(database, owner.id, 'purchase', {catalog_id: 'lake'});
    await runCommand(database, owner.id, 'place', {inventory_id: lake.result.inventory_id, x: 10, z: 10, rotation: 0});
    let saved = await state(database, owner.id);
    expect(saved.furniture[0]).toMatchObject({house_id: houseId, x: 4, z: 5, rotation: 90, version: 2});
    expect(saved.placements.some((row) => row.catalog_id === 'lake')).toBe(true);
    await runCommand(database, owner.id, 'remove', {placement_id: houseId, expected_version: 1});
    saved = await state(database, owner.id);
    expect(saved.furniture).toHaveLength(0);
    expect(saved.inventory.some((row) => row.id === desk.result.inventory_id)).toBe(true);
    expect(saved.inventory.some((row) => row.id === home.result.inventory_id)).toBe(true);
  });
});

describe('Yuyi explicit consent and privacy', () => {
  it('restricts invite acceptance, chosen awards/deductions, daily limits, scoped views and revocation', async () => {
    const owner = await createPlayer(database, 'owner');
    const partner = await createPlayer(database, 'yuyi');
    const stranger = await createPlayer(database, 'unlinked');
    await runCommand(database, owner.id, 'prayer_set', {prayer: 'fajr', status: 'completed'});
    await expect(runCommand(database, stranger.id, 'partner_adjust', {owner_id: owner.id, amount: 99})).rejects.toThrow(/forbidden/i);
    const invitation = await runCommand(database, owner.id, 'partner_invite', {email: partner.email});
    const linkId = invitation.result.link_id as string;
    const code = invitation.result.code as string;
    await expect(runCommand(database, stranger.id, 'partner_accept', {code})).rejects.toThrow(/invitation_recipient/i);
    await runCommand(database, partner.id, 'partner_accept', {code});
    await expect(runCommand(database, partner.id, 'partner_accept', {code})).rejects.toThrow(/invalid_invitation/i);
    await expect(runCommand(database, partner.id, 'partner_adjust', {owner_id: owner.id, amount: 1})).rejects.toThrow(/partner_limit/i);
    let inspected = (await runCommand(database, partner.id, 'partner_inspect', {owner_id: owner.id})).result;
    expect(inspected.city).toBeNull();
    expect(inspected.tasks).toBeNull();
    expect(inspected.wallet).toBeNull();
    expect(inspected).not.toHaveProperty('prayers');
    const policy = {link_id: linkId, can_award: true, can_deduct: true, can_view_city: true, can_view_tasks: true, max_award: 40, max_deduction: 100, daily_award_limit: 50, daily_deduction_limit: 100};
    await expect(runCommand(database, partner.id, 'partner_policy', policy)).rejects.toThrow(/forbidden/i);
    await runCommand(database, owner.id, 'partner_policy', policy);
    await expect(runCommand(database, partner.id, 'partner_adjust', {owner_id: owner.id, amount: 41})).rejects.toThrow(/partner_limit/i);
    const key = randomUUID();
    await runCommand(database, partner.id, 'partner_adjust', {owner_id: owner.id, amount: 37, reason: 'Chosen amount', note: 'Private memory'}, key);
    await runCommand(database, partner.id, 'partner_adjust', {owner_id: owner.id, amount: 37, reason: 'Chosen amount', note: 'Private memory'}, key);
    await expect(runCommand(database, partner.id, 'partner_adjust', {owner_id: owner.id, amount: 14})).rejects.toThrow(/partner_daily_limit/i);
    await expect(runCommand(database, partner.id, 'partner_adjust', {owner_id: owner.id, amount: -100})).rejects.toThrow(/confirmation_required/i);
    await runCommand(database, partner.id, 'partner_adjust', {owner_id: owner.id, amount: -100, confirmed: true, reason: 'Chosen deduction'});
    const saved = await state(database, owner.id);
    expect(saved.wallet.balance).toBe(-33);
    expect(saved.wallet.player_xp).toBe(30);
    expect(saved.yuyi_memories).toHaveLength(1);
    expect(saved.yuyi_memories[0]!.growth).toBe(37);
    inspected = (await runCommand(database, partner.id, 'partner_inspect', {owner_id: owner.id})).result;
    expect(inspected.city).toBeTruthy();
    expect(inspected.tasks).toBeInstanceOf(Array);
    expect(JSON.stringify(inspected)).not.toContain('Private memory');
    expect(inspected).not.toHaveProperty('prayers');
    const direct = await database.asUser(partner.id, (tx) => tx.query('SELECT * FROM public.prayer_logs WHERE user_id=$1', [owner.id]));
    expect(direct.rows).toHaveLength(0);
    await runCommand(database, owner.id, 'partner_unlink', {link_id: linkId});
    await expect(runCommand(database, partner.id, 'partner_adjust', {owner_id: owner.id, amount: 1})).rejects.toThrow(/forbidden/i);
    await expect(runCommand(database, partner.id, 'partner_inspect', {owner_id: owner.id})).rejects.toThrow(/forbidden/i);
  });
});
