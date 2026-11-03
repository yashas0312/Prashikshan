import { Link, NavLink, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const links = [
  { to: '/courses', label: 'Learning' },
  { to: '/internships', label: 'Opportunities' },
];

export default function Navbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const dashboardPath = user?.role === 'partner' ? '/partner' : user?.role === 'coordinator' ? '/coordination' : '/dashboard';
  const onLogout = () => { logout(); navigate('/'); };
  return (
    <header className="site-header">
      <Link to="/" className="brand" aria-label="Prashikshan home"><span className="brand-mark">P</span><span>Prashikshan</span></Link>
      <nav className="nav-links" aria-label="Primary navigation">
        {user?.role === 'coordinator' ? (
          <NavLink to="/coordination">Coordination</NavLink>
        ) : user?.role === 'partner' ? (
          <NavLink to="/internships">Opportunities</NavLink>
        ) : (
          links.map((link) => <NavLink key={link.to} to={link.to}>{link.label}</NavLink>)
        )}
        {user && user.role !== 'coordinator' && <NavLink to={dashboardPath}>Workspace</NavLink>}
      </nav>
      <div className="nav-account">
        {user ? <><span className="avatar">{user.name?.slice(0, 1).toUpperCase()}</span><span className="account-name">{user.name?.split(' ')[0]}</span><button className="button button-ghost button-small" onClick={onLogout}>Log out</button></> : <><Link className="text-link" to="/login">Sign in</Link><Link className="button button-small" to="/register">Create account</Link></>}
      </div>
    </header>
  );
}
