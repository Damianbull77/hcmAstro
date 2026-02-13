
import { initializeApp } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';
import { onRequest } from 'firebase-functions/v2/https';

// Inicialización del Admin SDK
const app = initializeApp({
    projectId: 'hcm2-99b6c'
});

// CORRECCIÓN CLAVE: Usamos el nombre correcto de la BD
const db = getFirestore(app, 'default');

const homePageContentHandler = async (req: any, res: any) => {
    // ... (CORS y chequeos de método quedan igual) ...
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET, POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }

    if (req.method !== 'GET') {
        return res.status(405).send('Método no permitido.');
    }

    try {
        const docRef = db.collection('settings').doc('home_page');
        let doc = await docRef.get();
        let data;

        if (!doc.exists) {
            // Upsert: Creamos si no existe
            const defaultData = { imageUrl: 'https://via.placeholder.com/1500' };
            await docRef.set(defaultData);
            doc = await docRef.get();
            data = doc.data();

            console.log('Documento creado con datos predeterminados.');
        } else {
            data = doc.data();
        }

        return res.status(200).json({
            heroImage: data!.imageUrl
        });

    } catch (error) {
        console.error('Error fetching home page content:', error);
        // El error 5 NOT_FOUND ya no debería ocurrir aquí
        return res.status(500).send('Error interno del servidor al obtener datos.');
    }
};

// Exportación FINAL V2 en la región correcta (us-east4)
export const getHomePageContent = onRequest({
    region: 'us-east4',
    memory: '256MiB',
    serviceAccount: 'hcm2-99b6c@appspot.gserviceaccount.com'
}, homePageContentHandler as any);

// ============================================
// HABITACIONES
// ============================================

// Interface para tipado de habitaciones
interface Habitacion {
    id: string;
    nombre: string;
    descripcion: string;
    precio_noche: number;
    imagen_principal: string;
    camas: number;
    tipo_cama: string;
    banos: number;
    wifi: boolean;
    capacidad: number;
    destacada: boolean;
    galeria: {
        cama: string;
        bano: string;
        closet: string;
        otras: string[];
    };
    amenidades: string[];
}

// Handler para obtener habitaciones (todas o solo destacadas)
const getHabitacionesHandler = async (req: any, res: any) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }

    if (req.method !== 'GET') {
        return res.status(405).send('Método no permitido.');
    }

    try {
        // Parámetro opcional: ?destacadas=true
        const soloDestacadas = req.query.destacadas === 'true';
        
        let query: FirebaseFirestore.Query = db.collection('habitaciones');
        
        if (soloDestacadas) {
            query = query.where('destacada', '==', true);
        }

        const snapshot = await query.get();

        if (snapshot.empty) {
            return res.status(200).json({ habitaciones: [] });
        }

        const habitaciones: Habitacion[] = [];
        snapshot.forEach((doc) => {
            habitaciones.push({
                id: doc.id,
                ...doc.data()
            } as Habitacion);
        });

        return res.status(200).json({ habitaciones });

    } catch (error) {
        console.error('Error fetching habitaciones:', error);
        return res.status(500).send('Error interno del servidor al obtener habitaciones.');
    }
};

// Handler para obtener UNA habitación por ID
const getHabitacionHandler = async (req: any, res: any) => {
    res.set('Access-Control-Allow-Origin', '*');

    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }

    if (req.method !== 'GET') {
        return res.status(405).send('Método no permitido.');
    }

    try {
        // El ID viene como query param: ?id=hab_001
        const habitacionId = req.query.id;

        if (!habitacionId) {
            return res.status(400).send('Falta el parámetro id.');
        }

        const docRef = db.collection('habitaciones').doc(habitacionId);
        const doc = await docRef.get();

        if (!doc.exists) {
            return res.status(404).send('Habitación no encontrada.');
        }

        const habitacion: Habitacion = {
            id: doc.id,
            ...doc.data()
        } as Habitacion;

        return res.status(200).json({ habitacion });

    } catch (error) {
        console.error('Error fetching habitacion:', error);
        return res.status(500).send('Error interno del servidor al obtener habitación.');
    }
};

// Exportar Cloud Functions
export const getHabitaciones = onRequest({
    region: 'us-east4',
    memory: '256MiB',
    serviceAccount: 'hcm2-99b6c@appspot.gserviceaccount.com'
}, getHabitacionesHandler as any);

export const getHabitacion = onRequest({
    region: 'us-east4',
    memory: '256MiB',
    serviceAccount: 'hcm2-99b6c@appspot.gserviceaccount.com'
}, getHabitacionHandler as any);

const getDisponibilidadHandler = async (req: any, res: any) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'GET');
        res.set('Access-Control-Allow-Headers', 'Content-Type');
        return res.status(204).send('');
    }
    try{
        const snapshot = await db.collection('habitaciones').get();
        if(snapshot.empty) {
            return res.status(200).json({ disponibilidad: {} });
        }
            const disponibilidad: Record<string, boolean> = {};

            snapshot.forEach((doc)=>{
                const data = doc.data();
                disponibilidad[doc.id] = data.disponible ?? true;
            })
            return res.status(200).json({ disponibilidad });
    }catch(error) {
        console.error('Error fetching disponibilidad:', error);
        return res.status(500).send('Error interno del servidor al obtener disponibilidad.');
    }
}

export const getDisponibilidad = onRequest({
    region: 'us-east4',
    memory: '256MiB',
    serviceAccount: 'hcm2-99b6c@appspot.gserviceaccount.com'
}, getDisponibilidadHandler as any);

const createHabitacionHandler = async (req: any, res: any) => {
    res.set('Access-Control-Allow-Origin', '*');
    if (req.method === 'OPTIONS') {
        res.set('Access-Control-Allow-Methods', 'POST');
        res.set('Access-Control-Allow-Headers', 'Content-Type, x-api-key');
        return res.status(204).send('');        
    }
    const secretWord = "casa_modelia_admin";
    const headerSecret = req.headers['x-api-key'];
    if (headerSecret !== secretWord) {
        return res.status(401).send('Unauthorized');
    }
    if (req.method !== 'POST') {
        return res.status(405).send('Método no permitido.');
    }
    try{
        const {habitaciones} = req.body;

        if(habitaciones.length === 0 || !Array.isArray(habitaciones)) {
            return res.status(400).send('Falta el parámetro habitaciones.');
        }

        const batch = db.batch();
        habitaciones.forEach((hab: any) => {
            if(!hab.id) return;
            const docRef = db.collection('habitaciones').doc(hab.id);
            const precio_limpio = Number(hab.precio_noche);
            const camas_limpio = Number(hab.camas);
            const banos_limpio = Number(hab.banos);
            const capacidad_limpio = Number(hab.capacidad);
            const wifi_limpio = (hab.wifi?.toString().toLowerCase().trim() === "no")? false:true;
            const destacada_limpio = (hab.destacada?.toString().toLowerCase().trim() === "no")? false:true;
            const disponible_limpio = (hab.disponible?.toString().toLowerCase().trim() === "no")? false:true;

            

            batch.set(docRef, {
                ...hab,
                precio_noche: isNaN(precio_limpio) ? 0 : precio_limpio,
                camas: isNaN(camas_limpio) ? 0 : camas_limpio,
                banos: isNaN(banos_limpio) ? 0 : banos_limpio,
                capacidad: isNaN(capacidad_limpio) ? 0 : capacidad_limpio,
                wifi: wifi_limpio,
                destacada: destacada_limpio,
                disponible: disponible_limpio,
            })
        })
        await batch.commit();
        return res.status(200).json({ message: `Se crearon ${habitaciones.length} habitaciones` });

        }catch(error) {
            console.error('Error creating habitacion:', error);
            return res.status(500).send('Error interno del servidor al crear habitación.');
        }
}

export const createHabitacion = onRequest({
    region: 'us-east4',
    memory: '256MiB',
    serviceAccount: 'hcm2-99b6c@appspot.gserviceaccount.com'
}, createHabitacionHandler as any);