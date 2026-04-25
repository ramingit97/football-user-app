const AZ_MONTHS_LONG  = ['yanvar','fevral','mart','aprel','may','iyun','iyul','avqust','sentyabr','oktyabr','noyabr','dekabr'];
const AZ_MONTHS_SHORT = ['yan','fev','mar','apr','may','iyn','iyl','avq','sen','okt','noy','dek'];
const AZ_DAYS_LONG    = ['bazar','bazar ertəsi','çərşənbə axşamı','çərşənbə','cümə axşamı','cümə','şənbə'];
const AZ_DAYS_SHORT   = ['baz','b.e.','ç.a.','çər','c.a.','cüm','şnb'];

export const formatDateLocale = (date, language, options = {}) => {
    if (language !== 'az') {
        return date.toLocaleDateString('ru-RU', options);
    }

    const weekday = options.weekday === 'long'  ? AZ_DAYS_LONG[date.getDay()]
                  : options.weekday === 'short' ? AZ_DAYS_SHORT[date.getDay()]
                  : null;

    const month = options.month === 'long'  ? AZ_MONTHS_LONG[date.getMonth()]
                : options.month === 'short' ? AZ_MONTHS_SHORT[date.getMonth()]
                : null;

    const dateParts = [
        options.day  ? date.getDate()       : null,
        month,
        options.year ? date.getFullYear()   : null,
    ].filter(v => v !== null).join(' ');

    return [weekday, dateParts].filter(Boolean).join(', ');
};
