import i18n from '@/shared/i18n'

const { t } = i18n.global

export const timeFormat = (totalSeconds: number): string => {
    if (totalSeconds == null || totalSeconds < 0) return "";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
        return t('units.hMinSec', { h: hours, m: minutes, s: seconds });
    } else if (minutes > 0) {
        return t('units.minSec', { m: minutes, s: seconds });
    } else {
        return t('units.sec', { n: seconds });
    }
};