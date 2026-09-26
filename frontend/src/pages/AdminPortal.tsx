import { useEffect, useMemo, useState } from "react";
import { createUser, getUsers, updateUserStatus} from "../api/admin.api";
import type { AuthUser } from "../types/auth.types";
import type { CreateUserPayload, ManagedUser, ManagedUserRole } from "../types/admin.types";
import '../styles/portal.css';
interface AdminPortalProps {
    token: string;
    user: AuthUser;
    onLogout: () => void;
}
const departments = [
    {id: 1, name: 'IT'},
    {id: 2, name: 'HR'},
    {id: 3, name: 'Finance'}
];
function AdminPortal({token, user, onLogout}: AdminPortalProps){
    const [users, setUsers] = useState<ManagedUser[]> ([]);
    const [loading, setLoading] = useState(true);
    const [creating, setCreating] = useState(false);
    const [actionUserId, setActionUserId] = useState<number | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState<string | null>(null);
    const [name, setName] = useState('');
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');
    const [role, setRole] = useState<ManagedUserRole>('EMPLOYEE');
    const [departmentId, setDepartmentId] = useState<number | ''>('');
    async function loadUsers(){
        try {
            setLoading(true);
            setError(null);
            const result = await getUsers(token);
            setUsers(result);
        }
        catch (error){
            setError(error instanceof Error ? error.message : 'Failed to load users');
        }
        finally {
            setLoading(false);
        }
    }
    useEffect(() => {
        loadUsers();
    }, []);
    const employeeCount = useMemo(() => users.filter(
        (item) => item.role === 'EMPLOYEE',
    ).length, [users]);
    const handlerCount = useMemo(() => users.filter(
        (item) => item.role === 'HANDLER',
    ).length, [users]);
    const activeCount = useMemo(() => users.filter(
        (item) => item.isActive,
    ).length, [users]);
    function resetForm() {
        setName('');
        setEmail('');
        setPassword('');
        setRole('EMPLOYEE');
        setDepartmentId('');
    }
    async function handleCreateUser(event: React.FormEvent<HTMLFormElement>){
        event.preventDefault();
        setError(null);
        setSuccess(null);
        if (role === 'HANDLER' && departmentId === ''){
            setError('Please select a department for the handler.');
            return;
        }
        const payload: CreateUserPayload = {
            name,
            email,
            password,
            role
        };
        if (role === 'HANDLER' && departmentId !== ''){
            payload.departmentId = Number(departmentId);
        }
        try {
            setCreating(true);
            await createUser(payload, token);
            setSuccess(`${role === 'HANDLER' ? 'Handler' : 'Employee'} created successfully.`);
            resetForm();
            await loadUsers();
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to create user')
        }
        finally {
            setCreating(false);
        }
    }
    async function handleStatusChange(managedUser: ManagedUser){
        try {
            setActionUserId(managedUser.id);
            setError(null);
            setSuccess(null);
            const nextStatus = !managedUser.isActive;
            await updateUserStatus(
                managedUser.id,
                nextStatus,
                token
            );
            setSuccess(`${managedUser.name} has been ${nextStatus ? 'activated' : 'deactivated'}.`);
            await loadUsers();
        }
        catch (error) {
            setError(error instanceof Error ? error.message : 'Failed to update user status');
        }
        finally {
            setActionUserId(null);
        }
    }
    function getDepartmentName(managedUser: ManagedUser){
        return(
            managedUser.department?.name ?? departments.find((department) => department.id === managedUser.departmentId)?.name ?? '-'
        );
    }
    return (
        <main className="portal-page">
            <header className="portal-header">
                <div>
                    <span className="portal-eyebrow">Administration</span>
                    <h1>User Management</h1>
                    <p>Welcome, {user.name}. Manage employees, handlers, departments, and account access.</p>
                </div>
                <div className="portal-header-actions">
                    <button className="secondary-button" onClick={loadUsers} disabled={loading}>Refresh</button>
                    <button className="secondary-button" onClick={onLogout}>Sign Out</button>
                </div>
            </header>
            <section className="admin-stats">
                <div className="admin-stat-card">
                    <span>Total Users</span>
                    <strong>{users.length}</strong>
                </div>
                <div className="admin-stat-card">
                    <span>Employees</span>
                    <strong>{employeeCount}</strong>
                </div>
                <div className="admin-stat-card">
                    <span>Handlers</span>
                    <strong>{handlerCount}</strong>
                </div>
                <div className="admin-stat-card">
                    <span>Active Accounts</span>
                    <strong>{activeCount}</strong>
                </div>
            </section>
            {(error || success) && (
                <section className="admin-message-section">
                    {error && (
                        <div className="error-message">{error}</div>
                    )}
                    {success && (
                        <div className="success-state">
                            <strong>{success}</strong>
                        </div>
                    )}
                </section>
            )}
            <section className="admin-layout">
                <div className="portal-card">
                    <div className="card-heading">
                        <span className="step-badge">+</span>
                        <div>
                            <h2>Add User</h2>
                            <p>Create a new employee or department handler.</p>
                        </div>
                    </div>
                    <form className="admin-user-form" onSubmit={handleCreateUser}>
                        <div className="form-field">
                            <label htmlFor="admin-user-name">Full Name</label>
                            <input id="admin-user-name" type="text" value={name} onChange={(event) => setName(event.target.value)} placeholder="jihad yaghi" required minLength={2} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="admin-user-email">Email</label>
                            <input id="admin-user-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="jihadyaghie@gmail.com" required/>
                        </div>
                        <div className="form-field">
                            <label htmlFor="admin-user-password">Password</label>
                            <input id="admin-user-password" type="password" value={password} onChange={(event) => setPassword(event.target.value)} placeholder="Minimum 8 characters" required minLength={8} />
                        </div>
                        <div className="form-field">
                            <label htmlFor="admin-user-role">Role</label>
                            <select id="admin-user-role" value={role} onChange={(event) => {
                                const nextRole = event.target.value as ManagedUserRole;
                                setRole(nextRole);
                                if (nextRole === 'EMPLOYEE'){
                                    setDepartmentId('')
                                }
                            }}>
                                <option value="EMPLOYEE">Employee</option>
                                <option value="HANDLER">Handler</option>
                            </select>
                        </div>
                        {role === 'HANDLER' && (
                            <div className="form-field">
                                <label htmlFor="admin-user-department">Department</label>
                                <select id="admin-user-department" value={departmentId} onChange={(event) => setDepartmentId(event.target.value ? Number(event.target.value) : '')} required>
                                    <option value=''>Select department</option>
                                    {departments.map((department) => (
                                        <option key={department.id} value={department.id}>{department.name}</option>
                                    ))}
                                </select>
                            </div>
                        )}
                        <button className="primary-button" type="submit" disabled= {creating}>{creating ? 'Creating user...' : 'Create User'}</button>
                    </form>
                </div>
                <div className="portal-card admin-users-panel">
                    <div className="card-heading">
                        <span className="step-badge">{users.length}</span>
                        <div>
                            <h2>System Users</h2>
                            <p>Review account roles, departments,and access status.</p>
                        </div>
                    </div>
                    {loading ? (
                        <div className="loading-state">Loading users...</div>
                    ) : users.length === 0 ? (
                        <div className="empty-state">
                            <p> No managed users have been created yet.</p>
                        </div>
                    ) : (
                        <div className="admin-user-list">
                            {users.map(
                                (managedUser) => (
                                    <article className="admin-user-card"  key={managedUser.id}>
                                        <div className="admin-user-main">
                                            <div className="admin-user-avatar" aria-hidden="true">
                                                {managedUser.name.charAt(0).toUpperCase()}
                                            </div>
                                            <div>
                                                <h3>{managedUser.name}</h3>
                                                <p>{managedUser.email}</p>
                                            </div>
                                        </div>
                                        <div className="admin-user-details">
                                            <div>
                                                <span>Role</span>
                                                <strong>{managedUser.role}</strong>
                                            </div>
                                            <div>
                                                <span>Department</span>
                                                <strong>{getDepartmentName(managedUser)}</strong>
                                            </div>
                                            <div>
                                                <span>Status</span>
                                                <strong className={managedUser.isActive ? 'account-active' : 'account-inactive'}>
                                                    {managedUser.isActive ? 'Active' : 'Inactive'}
                                                </strong>
                                            </div>
                                        </div>
                                        <div className="admin-user-actions">
                                            {managedUser.role === 'ADMIN' ? (
                                                <span className="assigned-note">Protected administrator</span>
                                            ) : (
                                                <button className={managedUser.isActive ? 'danger-button' : 'success-button'} disabled = {actionUserId === managedUser.id} onClick={() => handleStatusChange(managedUser)}>
                                                    {actionUserId === managedUser.id ? 'Updating...' : managedUser.isActive ? 'Deactivate' : 'Activate'}
                                                </button>
                                            )}
                                        </div>
                                    </article>
                                )
                            )}
                        </div>
                    )}
                </div>
            </section>
        </main>
    );
}
export default AdminPortal;