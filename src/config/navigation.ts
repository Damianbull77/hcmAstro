export interface NavLink{
    title: string;
    url: string;
    icon?: string;
}

export const navigation: NavLink[] = [
    {
        title: 'Home',
        url: '/',
        icon: 'fa-solid fa-house',
    },
    {
        title: 'Habitaciones',
        url: '/rooms',
        icon: 'fa-solid fa-bed',
    },
    {
        title: 'contacto',
        url: '/contact',
        icon: 'fa-solid fa-phone-volume',
        
    }
];