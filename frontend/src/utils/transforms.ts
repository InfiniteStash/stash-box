import { MeasurementsInput, BreastTypeEnum, URLInput } from 'src/definitions/globalTypes';

export const boobJobStatus = (val:BreastTypeEnum) => {
    if (val === BreastTypeEnum.NATURAL) return 'Natural';
    if (val === BreastTypeEnum.FAKE) return 'Augmented';
    if (val === BreastTypeEnum.NA) return 'N/A';
    return 'Unknown';
};

export const getBraSize = (measurements:MeasurementsInput) => (
    measurements === null || measurements.band_size === null || measurements.cup_size === null ? ''
        : measurements.band_size + measurements.cup_size
);

interface URL {
    url: string;
    type: string;
    image_id: string | null;
    height: number | null;
    width: number | null;
}

export const getUrlByType = (
    urls:URL[],
    type:string,
    orientation?: 'portrait'|'landscape'
) => {
    if (urls.length === 0) return '';
    if (type === 'PHOTO') {
        const sortedURLs = urls.filter((u) => u.type === 'PHOTO' && u.image_id !== null).map((u) => {
            const width = u.width;
            const height = u.height;
            return {
                ...u,
                aspect: orientation === 'portrait' ? (height / width > 1) : (width / height) > 1
            }
        }).sort((a, b) => {
            if (a.aspect > b.aspect) return -1;
            if (a.aspect < b.aspect) return 1;
            if (orientation === 'portrait' && a.height > b.height) return -1;
            if (orientation === 'portrait' && a.height < b.height) return 1;
            if (orientation === 'landscape' && a.width > b.width) return -1;
            if (orientation === 'landscape' && a.width < b.width) return 1;
            return 0;
        });
        return sortedURLs.length
            ? `${process.env.CDN}/${sortedURLs[0].image_id.slice(0,2)}/${sortedURLs[0].image_id.slice(2,4)}/${sortedURLs[0].image_id}`
            : '';
    }
    return (urls && (urls.find((url) => url.type === type) || {}).url) || '';
};

export const getBodyModification = (bodyMod:{location:string, description?:string}[]) => (
    (bodyMod || []).map((mod) => (
        mod.location + (mod.description ? ` (${mod.description})` : '')
    )).join(', ')
);
