import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { updateUser } from '../services/api';
import { BASE_URL } from '../config/api.js';
import { useSettings } from '../context/SettingsContext';

const Profile = () => {
    const { t } = useSettings();
    const { user, updateUser: updateAuthUser } = useAuth();
    const [formData, setFormData] = useState({
        fullName: user?.fullName || '',
        phone: user?.phone || '',
        password: '',
        confirmPassword: '',
    });
    const [avatar, setAvatar] = useState(null);
    const [avatarPreview, setAvatarPreview] = useState(user?.avatar ? `${BASE_URL}${user.avatar}` : null);
    const [loading, setLoading] = useState(false);
    const [success, setSuccess] = useState('');
    const [error, setError] = useState('');

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
            setAvatarPreview(URL.createObjectURL(file));
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');
        setSuccess('');

        if (formData.password && formData.password !== formData.confirmPassword) {
            setError(t('profile.passwordMismatch'));
            return;
        }

        setLoading(true);

        try {
            const form = new FormData();
            form.append('fullName', formData.fullName);
            form.append('phone', formData.phone);
            if (formData.password) {
                form.append('password', formData.password);
            }
            if (avatar) {
                form.append('avatar', avatar);
            }

            const res = await updateUser(user.id, form);
            updateAuthUser(res.data);
            setSuccess(t('profile.success'));
            setFormData({ ...formData, password: '', confirmPassword: '' });
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        } finally {
            setLoading(false);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div>
            <div className="page-header">
                <h1 className="page-title">{t('profile.title')}</h1>
                <p className="page-subtitle">{t('profile.subtitle')}</p>
            </div>

            <div className="card" style={{ maxWidth: '600px' }}>
                {error && <div className="error-message">{error}</div>}
                {success && <div className="success-message">{success}</div>}

                <form onSubmit={handleSubmit}>
                    <div className="avatar-upload mb-lg">
                        <div className="avatar-preview">
                            {avatarPreview ? (
                                <img src={avatarPreview} alt="Avatar" />
                            ) : (
                                getInitials(user?.fullName)
                            )}
                        </div>
                        <label className="btn btn-secondary">
                            {t('profile.changePhoto')}
                            <input
                                type="file"
                                accept="image/*"
                                onChange={handleAvatarChange}
                                style={{ display: 'none' }}
                            />
                        </label>
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('profile.email')}</label>
                        <input
                            type="email"
                            className="form-input"
                            value={user?.email || ''}
                            disabled
                            style={{ opacity: 0.6 }}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('profile.fullName')}</label>
                        <input
                            type="text"
                            name="fullName"
                            className="form-input"
                            value={formData.fullName}
                            onChange={handleChange}
                            required
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('profile.phone')}</label>
                        <input
                            type="tel"
                            name="phone"
                            className="form-input"
                            placeholder={t('profile.phonePlaceholder')}
                            value={formData.phone}
                            onChange={handleChange}
                        />
                    </div>

                    <hr style={{ border: 'none', borderTop: '1px solid var(--border-color)', margin: 'var(--spacing-lg) 0' }} />

                    <h3 style={{ marginBottom: 'var(--spacing-md)', fontSize: '1rem' }}>{t('profile.changePassword')}</h3>

                    <div className="form-group">
                        <label className="form-label">{t('profile.newPassword')}</label>
                        <input
                            type="password"
                            name="password"
                            className="form-input"
                            placeholder={t('profile.passwordHint')}
                            value={formData.password}
                            onChange={handleChange}
                        />
                    </div>

                    <div className="form-group">
                        <label className="form-label">{t('profile.confirmPassword')}</label>
                        <input
                            type="password"
                            name="confirmPassword"
                            className="form-input"
                            placeholder={t('profile.confirmPasswordPlaceholder')}
                            value={formData.confirmPassword}
                            onChange={handleChange}
                        />
                    </div>

                    <button type="submit" className="btn btn-primary btn-block btn-lg" disabled={loading}>
                        {loading ? t('profile.saving') : t('profile.save')}
                    </button>
                </form>
            </div>
        </div>
    );
};

export default Profile;
