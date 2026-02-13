export interface Habitacion{
    id: string;
    nombre: string;
    descripcion: string;
    precio_noche: number;
    imagen_principal: string;
    camas: number;
    tipo_cama: string;
    banos: number;
    wifi: boolean;
    disponible: boolean;
    capacidad: number;
    destacada: boolean;
    galeria: {
        cama: string;
        bano: string;
        closet: string;
        otras: string[];
    };
}