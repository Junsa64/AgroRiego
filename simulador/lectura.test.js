import { test } from 'node:test';
import assert from 'node:assert/strict';
import { leerArgumentos, siguienteLectura } from './lectura.js';

test('la humedad baja poco a poco y se mantiene en rango', () => {
  let lectura = { humedad: 42, temperatura: 28, bateria: 95 };
  for (let i = 0; i < 500; i += 1) lectura = siguienteLectura(lectura);
  assert.ok(lectura.humedad >= 5 && lectura.humedad < 42);
  assert.ok(lectura.temperatura >= 10 && lectura.temperatura <= 45);
  assert.ok(lectura.bateria >= 0 && lectura.bateria <= 95);
});

test('--rapido publica cada 10 s y sin opciones cada 5 min', () => {
  assert.equal(leerArgumentos(['--rapido']).intervaloMs, 10_000);
  assert.equal(leerArgumentos([]).intervaloMs, 300_000);
});

test('acepta varios códigos y los pone en mayúsculas', () => {
  assert.deepEqual(leerArgumentos(['--codigo', 'hs-0161', '--codigo', 'HS-0162']).codigos, ['HS-0161', 'HS-0162']);
});
