import i18next from 'i18next';

export const changeLanguage = (path: string) => {
	const lang = path?.split('/')[1];
	i18next.changeLanguage(i18next.languages.includes(lang) ? lang : 'cs');
};
