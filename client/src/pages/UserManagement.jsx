import { useState, useEffect } from 'react';
import { getUsers, createUser, updateUser, deleteUser } from '../services/api';
import { BASE_URL } from '../config/api.js';
import { useSettings } from '../context/SettingsContext';

const UserManagement = () => {
    const { t } = useSettings();
    const [users, setUsers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [modalOpen, setModalOpen] = useState(false);
    const [editingUser, setEditingUser] = useState(null);
    const [formData, setFormData] = useState({
        username: '',
        email: '',
        password: '',
        fullName: '',
        phone: '',
        role: 'user',
        status: 'active',
    });
    const [avatar, setAvatar] = useState(null);
    const [error, setError] = useState('');

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await getUsers();
            setUsers(res.data);
        } catch (error) {
            console.error('Error fetching users:', error);
        } finally {
            setLoading(false);
        }
    };

    const handleOpenModal = (user = null) => {
        if (user) {
            setEditingUser(user);
            setFormData({
                username: user.username,
                email: user.email,
                password: '',
                fullName: user.fullName,
                phone: user.phone || '',
                role: user.role,
                status: user.status,
            });
        } else {
            setEditingUser(null);
            setFormData({
                username: '',
                email: '',
                password: '',
                fullName: '',
                phone: '',
                role: 'user',
                status: 'active',
            });
        }
        setAvatar(null);
        setError('');
        setModalOpen(true);
    };

    const handleCloseModal = () => {
        setModalOpen(false);
        setEditingUser(null);
    };

    const handleChange = (e) => {
        setFormData({ ...formData, [e.target.name]: e.target.value });
    };

    const handleAvatarChange = (e) => {
        const file = e.target.files[0];
        if (file) {
            setAvatar(file);
        }
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

        try {
            const form = new FormData();
            Object.keys(formData).forEach(key => {
                if (formData[key] || key !== 'password') {
                    form.append(key, formData[key]);
                }
            });
            if (avatar) {
                form.append('avatar', avatar);
            }

            if (editingUser) {
                await updateUser(editingUser.id, form);
            } else {
                if (!formData.password) {
                    setError(t('userManagement.passwordRequired'));
                    return;
                }
                await createUser(form);
            }

            handleCloseModal();
            fetchUsers();
        } catch (err) {
            setError(err.response?.data?.error || 'An error occurred');
        }
    };

    const handleDelete = async (id) => {
        if (!confirm(t('userManagement.deleteConfirm'))) return;

        try {
            await deleteUser(id);
            setUsers(users.filter(u => u.id !== id));
        } catch (error) {
            console.error('Error deleting user:', error);
        }
    };

    const getInitials = (name) => {
        if (!name) return 'U';
        return name.split(' ').map(n => n[0]).join('').toUpperCase().slice(0, 2);
    };

    return (
        <div>
            <div className="page-header flex-between">
                <div>
                    <h1 className="page-title">{t('userManagement.title')}</h1>
                    <p className="page-subtitle">{t('userManagement.subtitle')}</p>
                </div>
                <button className="btn btn-primary" onClick={() => handleOpenModal()}>
                    {t('userManagement.addUser')}
                </button>
            </div>

            <div className="table-container">
                {loading ? (
                    <div className="empty-state">
                        <p>{t('common.loading')}</p>
                    </div>
                ) : (
                    <table className="table">
                        <thead>
                            <tr>
                                <th>{t('userManagement.user')}</th>
                                <th>{t('userManagement.username')}</th>
                                <th>{t('userManagement.email')}</th>
                                <th>{t('userManagement.phone')}</th>
                                <th>{t('userManagement.role')}</th>
                                <th>{t('userManagement.status')}</th>
                                <th>{t('userManagement.actions')}</th>
                            </tr>
                        </thead>
                        <tbody>
                            {users.map((user) => (
                                <tr key={user.id}>
                                    <td>
                                        <div className="flex gap-sm" style={{ alignItems: 'center' }}>
                                            <div className="sidebar-avatar" style={{ width: 36, height: 36, fontSize: '0.8rem' }}>
                                                {user.avatar ? (
                                                    <img src={`${BASE_URL}${user.avatar}`} alt={user.fullName} />
                                                ) : (
                                                    getInitials(user.fullName)
                                                )}
                                            </div>
                                            <span>{user.fullName}</span>
                                        </div>
                                    </td>
                                    <td>{user.username}</td>
                                    <td>{user.email}</td>
                                    <td>{user.phone || '-'}</td>
                                    <td>
                                        <span className={`badge badge-${user.role}`}>
                                            {user.role === 'admin' ? t('userManagement.admin') : t('userManagement.user')}
                                        </span>
                                    </td>
                                    <td>
                                        <span className={`badge badge-${user.status}`}>
                                            {user.status === 'active' ? t('userManagement.active') : t('userManagement.inactive')}
                                        </span>
                                    </td>
                                    <td>
                                        <div className="flex gap-sm">
                                            <button
                                                className="btn btn-secondary btn-sm"
                                                onClick={() => handleOpenModal(user)}
                                            >
                                                ✏️
                                            </button>
                                            <button
                                                className="btn btn-danger btn-sm"
                                                onClick={() => handleDelete(user.id)}
                                            >
                                                🗑️
                                            </button>
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                )}
            </div>

            {/* Modal */}
            {modalOpen && (
                <div className="modal-overlay">
                    <div className="modal">
                        <div className="modal-header">
                            <h2 className="modal-title">{editingUser ? t('userManagement.editUser') : t('userManagement.createUser')}</h2>
                            <button className="modal-close" onClick={handleCloseModal}>×</button>
                        </div>

                        {error && <div className="error-message">{error}</div>}

                        <form onSubmit={handleSubmit}>
                            <div className="form-group">
                                <label className="form-label">{t('userManagement.username')}</label>
                                <input
                                    type="text"
                                    name="username"
                                    className="form-input"
                                    value={formData.username}
                                    onChange={handleChange}
                                    required
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('userManagement.email')}</label>
                                <input
                                    type="email"
                                    name="email"
                                    className="form-input"
                                    value={formData.email}
                                    onChange={handleChange}
                                    required
                                    disabled={!!editingUser}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('login.password')} {editingUser && `(${t('profile.passwordHint')})`}</label>
                                <input
                                    type="password"
                                    name="password"
                                    className="form-input"
                                    value={formData.password}
                                    onChange={handleChange}
                                    required={!editingUser}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('userManagement.fullName')}</label>
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
                                <label className="form-label">{t('userManagement.phone')}</label>
                                <input
                                    type="tel"
                                    name="phone"
                                    className="form-input"
                                    value={formData.phone}
                                    onChange={handleChange}
                                />
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('userManagement.role')}</label>
                                <select
                                    name="role"
                                    className="form-select"
                                    value={formData.role}
                                    onChange={handleChange}
                                >
                                    <option value="user">{t('userManagement.user')}</option>
                                    <option value="admin">{t('userManagement.admin')}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">{t('userManagement.status')}</label>
                                <select
                                    name="status"
                                    className="form-select"
                                    value={formData.status}
                                    onChange={handleChange}
                                >
                                    <option value="active">{t('userManagement.active')}</option>
                                    <option value="inactive">{t('userManagement.inactive')}</option>
                                </select>
                            </div>

                            <div className="form-group">
                                <label className="form-label">Avatar</label>
                                <input
                                    type="file"
                                    accept="image/*"
                                    onChange={handleAvatarChange}
                                    className="form-input"
                                />
                            </div>

                            <div className="modal-footer">
                                <button type="button" className="btn btn-secondary" onClick={handleCloseModal}>
                                    {t('common.cancel')}
                                </button>
                                <button type="submit" className="btn btn-primary">
                                    {editingUser ? t('common.save') : t('common.add')}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
};

export default UserManagement;
