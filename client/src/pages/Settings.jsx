import { useSettings } from '../context/SettingsContext';

const Settings = () => {
    const { dateFormat, setDateFormat, language, setLanguage, t } = useSettings();

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('settings.title')}</h1>
                <p className="page-subtitle">{t('settings.subtitle')}</p>
            </div>

            {/* Language Settings */}
            <div className="card" style={{ marginBottom: 'var(--spacing-lg)' }}>
                <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <span className="card-title" style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                        {t('settings.language')}
                    </span>
                </div>

                <div className="settings-option">
                    <label className="settings-label">{t('settings.selectLanguage')}</label>
                    <div className="settings-radio-group">
                        <label className={`settings-radio-option ${language === 'th' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="language"
                                value="th"
                                checked={language === 'th'}
                                onChange={(e) => setLanguage(e.target.value)}
                            />
                            <div className="settings-radio-content">
                                <span className="settings-radio-title">🇹🇭 {t('settings.thai')}</span>
                            </div>
                        </label>
                        <label className={`settings-radio-option ${language === 'en' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="language"
                                value="en"
                                checked={language === 'en'}
                                onChange={(e) => setLanguage(e.target.value)}
                            />
                            <div className="settings-radio-content">
                                <span className="settings-radio-title">🇬🇧 {t('settings.english')}</span>
                            </div>
                        </label>
                    </div>
                </div>
            </div>

            {/* Date Format Settings */}
            <div className="card">
                <div className="card-header" style={{ marginBottom: 'var(--spacing-lg)' }}>
                    <span className="card-title" style={{ fontSize: '1.1rem', color: 'var(--color-text-primary)' }}>
                        {t('settings.dateFormat')}
                    </span>
                </div>

                <div className="settings-option">
                    <label className="settings-label">{t('settings.yearFormat')}</label>
                    <div className="settings-radio-group">
                        <label className={`settings-radio-option ${dateFormat === 'ce' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="dateFormat"
                                value="ce"
                                checked={dateFormat === 'ce'}
                                onChange={(e) => setDateFormat(e.target.value)}
                            />
                            <div className="settings-radio-content">
                                <span className="settings-radio-title">{t('settings.ce')}</span>
                                <span className="settings-radio-example">{t('settings.ceExample')}</span>
                            </div>
                        </label>
                        <label className={`settings-radio-option ${dateFormat === 'be' ? 'active' : ''}`}>
                            <input
                                type="radio"
                                name="dateFormat"
                                value="be"
                                checked={dateFormat === 'be'}
                                onChange={(e) => setDateFormat(e.target.value)}
                            />
                            <div className="settings-radio-content">
                                <span className="settings-radio-title">{t('settings.be')}</span>
                                <span className="settings-radio-example">{t('settings.beExample')}</span>
                            </div>
                        </label>
                    </div>
                </div>

                <div className="settings-preview">
                    <span className="settings-preview-label">{t('settings.preview')}</span>
                    <span className="settings-preview-value">
                        {dateFormat === 'ce' ? '14/12/2025' : '14/12/2568'}
                    </span>
                </div>
            </div>
        </div>
    );
};

export default Settings;
