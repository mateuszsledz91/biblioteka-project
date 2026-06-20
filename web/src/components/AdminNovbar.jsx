import { Link } from "react-router-dom";

function AdminNovbar() {
	return (
		<header className="admin-navbar">
			<nav>
				<Link className="admin-link" to="/books">Książki</Link>
				<Link className="admin-link" to="/adminusers">Użytkownicy</Link>
			</nav>
		</header>
	);
}

export default AdminNovbar;
