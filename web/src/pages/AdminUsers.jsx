import { useEffect, useState } from "react";
import { getUsers, getUserStats, toggleBlockUser  } from "../api/api";
import { toast } from "react-toastify";

function AdminUsers() {
	const [users, setUsers] = useState([]);
	const [selectedUser, setSelectedUser] = useState(null);
	const [userStats, setUserStats] = useState(null);
	const [loading, setLoading] = useState(false);
	const [statsLoading, setStatsLoading] = useState(false);
	const [error, setError] = useState(null);
	const [statsError, setStatsError] = useState(null);

	useEffect(() => {
		const fetchUsers = async () => {
			setLoading(true);
			try {
				const data = await getUsers();
				setUsers(data);
			} catch (err) {
				setError(err.message || "Błąd podczas pobierania użytkowników");
			} finally {
				setLoading(false);
			}
		};

		fetchUsers();
	}, []);

	const handleSelectUser = async (user) => {
		setSelectedUser(user);
		setUserStats(null);
		setStatsError(null);
		setStatsLoading(true);

		try {
			const stats = await getUserStats(user.id);
			setUserStats(stats);
		} catch (err) {
			setStatsError(err.message || "Błąd podczas pobierania statystyk użytkownika");
		} finally {
			setStatsLoading(false);
		}
	};



	const handleToggleBlock = async (userId) => {
  try {
    const updatedUser = await toggleBlockUser(userId);

    setUsers(
      users.map((u) =>
        u.id === userId ? updatedUser : u
      )
    );

    setSelectedUser(updatedUser);

    toast.success(
  updatedUser.is_blocked === true
    ? "Użytkownik został zablokowany."
    : "Użytkownik został odblokowany."
);
  } catch (err) {
    toast.error(err.message);
  }
};

	return (
		<div className="admin-users-page">
			<h2>Użytkownicy</h2>

			{loading ? (
				<p>Ładowanie...</p>
			) : error ? (
				<p className="error">{error}</p>
			) : (
				<>
					<p>Ilość użytkowników: <strong>{users.length}</strong></p>

					<div className="users-container">
						<ul className="users-list">
							{users.map((u) => (
								<li key={u.id}>
									<button
										className="user-link"
										onClick={() => handleSelectUser(u)}
									>
										{u.username}
									</button>
									<span className="user-email"> — {u.email}</span>
								</li>
							))}
						</ul>

						{selectedUser && (
							<div className="user-stats">
								<h3>Statystyki użytkownika: {selectedUser.username}</h3>
								<p><strong>ID:</strong> {selectedUser.id}</p>
								<p><strong>Email:</strong> {selectedUser.email}</p>
								<p><strong>Rola:</strong> {selectedUser.role}</p>
								<p>
									<strong>Utworzony:</strong>{" "}
									{selectedUser.created_at
										? new Date(selectedUser.created_at).toLocaleString()
										: "-"}
								</p>
								{statsLoading ? (
									<p>Ładowanie statystyk...</p>
								) : statsError ? (
									<p className="error">{statsError}</p>
								) : userStats ? (
									<>
										<p><strong>Wypożyczonych:</strong> {userStats.borrowedCount}</p>
										<p><strong>Nieoddanych:</strong> {userStats.notReturnedCount}</p>
									</>
								) : null}

								

<p>
  <strong>Status:</strong>{" "}
  {selectedUser.is_blocked === true ? "🔴 Zablokowany" : "🟢 Aktywny"}
</p>

{selectedUser.role !== "ADMIN" && (
  <button
    onClick={() => handleToggleBlock(selectedUser.id)}
  >
    {selectedUser.is_blocked === true
  ? "Odblokuj użytkownika"
  : "Zablokuj użytkownika"}
  </button>
)}
							</div>
						)}
					</div>
				</>
			)}
		</div>
	);
}

export default AdminUsers;

