import { crearApp } from './app.js';
import { crearPool } from './db.js';
import { migrar } from './migrate.js';
import { iniciarAdaptadorIoT } from './iot/adaptador.js';

const pool = crearPool();
await migrar(pool);

const app = crearApp({ pool });
const puerto = Number(process.env.PORT ?? 3000);
app.listen(puerto, () => console.log(`API de AgroRiego escuchando en el puerto ${puerto}`));

iniciarAdaptadorIoT({ pool });
