import test from 'node:test';
import assert from 'node:assert/strict';

import {
    imageForSlot,
    imagesForWorkspace,
    orderImages,
} from '../extension/assignment.js';

test('usa ogni immagine prima di ripetere', () => {
    const images = ['a', 'b', 'c', 'd', 'e'];
    const assigned = [0, 1, 2].flatMap(workspace =>
        imagesForWorkspace(images, workspace, 2)
    );

    assert.deepEqual(assigned, ['a', 'b', 'c', 'd', 'e', 'a']);
    assert.equal(new Set(assigned.slice(0, images.length)).size, images.length);
});

test('assegna uno sfondo diverso a ogni monitor quando possibile', () => {
    assert.deepEqual(
        imagesForWorkspace(['a', 'b', 'c'], 0, 3),
        ['a', 'b', 'c']
    );
});

test('il rimescolamento è stabile per lo stesso seme', () => {
    const paths = ['d', 'a', 'c', 'b'];
    assert.deepEqual(orderImages(paths, true, 42), orderImages(paths, true, 42));
    assert.notDeepEqual(orderImages(paths, true, 42), orderImages(paths, true, 43));
});

test('l’ordine normale è alfabetico', () => {
    assert.deepEqual(orderImages(['z.jpg', 'a.jpg']), ['a.jpg', 'z.jpg']);
});

test('lo slot combina spazio di lavoro e monitor', () => {
    const images = ['a', 'b', 'c', 'd', 'e'];
    assert.equal(imageForSlot(images, 1, 0, 2), 'c');
    assert.equal(imageForSlot(images, 2, 1, 2), 'a');
});

test('uno slot non valido non restituisce immagini', () => {
    assert.equal(imageForSlot([], 0, 0, 2), null);
    assert.equal(imageForSlot(['a'], 0, 0, 0), null);
});
