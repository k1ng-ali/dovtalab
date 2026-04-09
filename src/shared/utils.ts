export const timeFormat = (totalSeconds: number): string => {
    if (totalSeconds == null || totalSeconds < 0) return "";

    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = Math.floor(totalSeconds % 60);

    if (hours > 0) {
        return `${hours} ч ${minutes} мин ${seconds} сек`;
    } else if (minutes > 0) {
        return `${minutes} мин ${seconds} сек`;
    } else {
        return `${seconds} сек`;
    }
};