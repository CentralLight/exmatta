import React, { useState, useEffect } from 'react';
import { FaEye, FaEyeSlash, FaPlus, FaEdit, FaTrash, FaUser, FaMusic, FaEnvelope, FaGraduationCap, FaTimes } from 'react-icons/fa';

const GestioneUtenti = ({ toast }) => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [selectedUser, setSelectedUser] = useState(null);
  const [showPasswordModal, setShowPasswordModal] = useState(false);
  const [showRoleModal, setShowRoleModal] = useState(false);
  const [showAddUserModal, setShowAddUserModal] = useState(false);
  const [newPassword, setNewPassword] = useState('');
  const [newRole, setNewRole] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [updating, setUpdating] = useState(false);
  
  // Form per nuovo utente
  const [newUser, setNewUser] = useState({
    username: '',
    role: 'user',
    password: '',
    confirmPassword: ''
  });

  // Nuovo stato per i tab e gestione insegnanti
  const [activeTab, setActiveTab] = useState('utenti');
  const [teachers, setTeachers] = useState([]);
  const [showAddTeacherModal, setShowAddTeacherModal] = useState(false);
  const [showBioModal, setShowBioModal] = useState(false);
  const [selectedTeacher, setSelectedTeacher] = useState(null);
  const [newTeacher, setNewTeacher] = useState({
    name: '',
    email: '',
    instruments: '',
    bio: ''
  });

  // Stato per modifica insegnante
  const [showEditTeacherModal, setShowEditTeacherModal] = useState(false);
  const [editingTeacher, setEditingTeacher] = useState(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [teacherToDelete, setTeacherToDelete] = useState(null);
  
  // Stato per eliminazione utenti
  const [showDeleteUserConfirm, setShowDeleteUserConfirm] = useState(false);
  const [userToDelete, setUserToDelete] = useState(null);

  // Stato per modifica utente
  const [showEditUserModal, setShowEditUserModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [editUserForm, setEditUserForm] = useState({
    username: '',
    email: '',
    role: 'user',
    newPassword: '',
    confirmPassword: ''
  });

  // Stati per ricerca e ordinamento utenti
  const [searchTerm, setSearchTerm] = useState('');
  const [sortField, setSortField] = useState('');
  const [sortDirection, setSortDirection] = useState('asc');

  // Stati per ricerca e ordinamento insegnanti
  const [teacherSearchTerm, setTeacherSearchTerm] = useState('');
  const [teacherSortField, setTeacherSortField] = useState('');
  const [teacherSortDirection, setTeacherSortDirection] = useState('asc');

  // Utility function to handle JWT errors
  const handleJWTError = () => {
    console.warn('JWT error detected, clearing tokens and redirecting to login');
    localStorage.removeItem('adminToken');
    localStorage.removeItem('userRole');
    localStorage.removeItem('adminUsername');
    window.location.reload();
  };

  // Validate JWT token format
  const isValidJWT = (token) => {
    if (!token) return false;
    
    // JWT tokens have 3 parts separated by dots
    const parts = token.split('.');
    if (parts.length !== 3) return false;
    
    // Each part should be base64 encoded
    try {
      // Check if parts are valid base64
      parts.forEach(part => {
        if (part && part.length > 0) {
          // Add padding if needed for base64
          const paddedPart = part + '='.repeat((4 - part.length % 4) % 4);
          atob(paddedPart);
        }
      });
      return true;
    } catch (error) {
      return false;
    }
  };

  useEffect(() => {
    fetchUsers();
    if (activeTab === 'insegnanti') {
      fetchTeachers();
    }
  }, [activeTab]);

  // Cleanup effect for JWT errors - DISABILITATO PER EVITARE CANCELLAZIONE AUTOMATICA
  // useEffect(() => {
  //   return () => {
  //     // Clear any corrupted tokens on unmount
  //     const token = localStorage.getItem('adminToken');
  //     if (token && !isValidJWT(token)) {
  //       localStorage.removeItem('adminToken');
  //       localStorage.removeItem('userRole');
  //       localStorage.removeItem('adminUsername');
  //     }
  //   };
  // }, []);

  // Gestisce il focus quando si apre il modal di modifica utente
  useEffect(() => {
    if (showEditUserModal) {
      // Rimuove il focus dal campo di ricerca
      const searchInput = document.querySelector('.search-input');
      if (searchInput) {
        searchInput.blur();
      }
      
      // Aspetta che il DOM sia aggiornato e poi imposta il focus sul primo campo del modal
      const timer = setTimeout(() => {
        const firstInput = document.getElementById('edit-username');
        if (firstInput) {
          firstInput.focus();
        }
      }, 100);
      
      return () => clearTimeout(timer);
    }
  }, [showEditUserModal]);

  const fetchUsers = async () => {
    setLoading(true);
    setError(null);
    
    const token = localStorage.getItem('adminToken');
    if (!token) {
      setError('Token di autenticazione mancante. Effettua nuovamente il login.');
      setLoading(false);
      return;
    }

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('http://localhost:3001/api/auth/users', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);
      
      if (response.status === 401) {
        setError('Sessione scaduta. Effettua nuovamente il login.');
        handleJWTError();
        return;
      } else if (response.status === 403) {
        setError('Accesso negato. Non hai i permessi per visualizzare gli utenti.');
      } else if (response.status === 500) {
        setError('Errore del server. Riprova più tardi.');
      } else if (!response.ok) {
        setError(`Errore HTTP: ${response.status}`);
      } else {
        const data = await response.json();
        if (data.success) {
          setUsers(data.users || []);
        } else {
          setError('Errore nel caricamento degli utenti.');
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('❌ Errore durante fetch utenti:', error);
      
      if (error.name === 'AbortError') {
        console.error('⏱️ Timeout della richiesta');
        setError('Timeout della richiesta. Il server potrebbe essere sovraccarico.');
      } else if (error.message === 'Failed to fetch') {
        console.error('🌐 Impossibile raggiungere il server');
        setError('Impossibile raggiungere il server. Verifica la connessione.');
      } else {
        console.error('💥 Errore di connessione:', error.message);
        setError(`Errore di connessione: ${error.message}`);
      }
    } finally {
      setLoading(false);
    }
  };

  const fetchTeachers = async () => {
    const token = localStorage.getItem('adminToken');
    if (!token) return;

    const controller = new AbortController();
    const timeoutId = setTimeout(() => controller.abort(), 10000);

    try {
      const response = await fetch('http://localhost:3001/api/teachers', {
        method: 'GET',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        signal: controller.signal
      });

      clearTimeout(timeoutId);

      if (response.status === 401) {
        // JWT token expired or invalid
        console.warn('JWT token expired in fetchTeachers, clearing tokens');
        handleJWTError();
        return;
      }

      if (response.ok) {
        const data = await response.json();
        if (data.success) {
          setTeachers(data.teachers);
        }
      }
    } catch (error) {
      clearTimeout(timeoutId);
      console.error('Error fetching teachers:', error);
    }
  };

  const handlePasswordChange = async () => {
    if (!selectedUser || !newPassword || newPassword.length < 6) {
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/auth/users/${selectedUser.id}/password`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newPassword }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
        throw new Error('Failed to update password');
      }

      setShowPasswordModal(false);
      setSelectedUser(null);
      setNewPassword('');
      toast.showSuccess('✅ Password aggiornata con successo!');
    } catch (err) {
      toast.showError(`❌ Errore: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleRoleChange = async () => {
    if (!selectedUser || !newRole) {
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/auth/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ newRole }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
        throw new Error('Failed to update role');
      }

      setShowRoleModal(false);
      setSelectedUser(null);
      setNewRole('');
      toast.showSuccess('✅ Ruolo aggiornato con successo!');
      fetchUsers();
    } catch (err) {
      toast.showError(`❌ Errore: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleAddUser = async () => {
    if (!newUser.username || !newUser.password || newUser.password !== newUser.confirmPassword) {
      toast.showError('❌ Compila tutti i campi e conferma la password!');
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch('http://localhost:3001/api/auth/users', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          username: newUser.username,
          password: newUser.password,
          role: newUser.role
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create user');
      }

      setShowAddUserModal(false);
      setNewUser({ username: '', role: 'user', password: '', confirmPassword: '' });
      toast.showSuccess('✅ Utente creato con successo!');
      fetchUsers();
    } catch (err) {
      toast.showError(`❌ Errore: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  // Funzioni helper per i ruoli
  const getRoleBadgeClass = (role) => {
    switch (role) {
      case 'admin': return 'orange';
      case 'docente': return 'purple';
      case 'salaprove': return 'green';
      case 'salacorsi': return 'blue';
      case 'news': return 'red';
      case 'user': return 'gray';
      default: return 'blue';
    }
  };

  const getRoleDisplayText = (role) => {
    switch (role) {
      case 'admin': return '👑 Admin';
      case 'docente': return '🎸 Docente';
      case 'salaprove': return '🎵 Sala Prove';
              case 'salacorsi': return '🎼 Imparar Suonando';
      case 'news': return '📰 News';
      case 'user': return '👤 User';
      default: return '👤 User';
    }
  };

  // Funzione per generare username automatico
  const generateUsername = (fullName) => {
    const words = fullName.trim().split(' ').filter(word => word.length > 0);
    if (words.length < 2) return fullName.toLowerCase().replace(/\s+/g, '');
    
    const firstName = words[0].toLowerCase();
    const lastName = words[words.length - 1].toLowerCase();
    
    return `${firstName.charAt(0)}.${lastName}`;
  };

  const handleAddTeacher = async () => {
    if (!newTeacher.name || !newTeacher.email || !newTeacher.instruments || !newTeacher.bio) {
      toast.showError('❌ Compila tutti i campi!');
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Genera username automatico
      const username = generateUsername(newTeacher.name);
      
      const response = await fetch('http://localhost:3001/api/teachers', {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...newTeacher,
          username: username
        }),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to create teacher');
      }
      
      const result = await response.json();
      
      // Gestisci diversi tipi di risposta
      if (result.userUpdated) {
        toast.showInfo('ℹ️ Utente esistente aggiornato con ruolo "docente"!');
      } else {
        toast.showSuccess('✅ Insegnante creato con successo!');
      }

      setShowAddTeacherModal(false);
      setNewTeacher({ name: '', email: '', instruments: '', bio: '' });
      fetchTeachers();
    } catch (err) {
      toast.showError(`❌ Errore: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const handleDeleteTeacher = async (teacherId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/teachers/${teacherId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        toast.showSuccess('✅ Insegnante eliminato con successo!');
        fetchTeachers();
        setShowDeleteConfirm(false);
        setTeacherToDelete(null);
      } else {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
        const error = await response.json();
        toast.showError(`❌ Errore: ${error.error}`);
      }
    } catch (error) {
      toast.showError('❌ Errore durante l\'eliminazione');
    }
  };

  const handleEditTeacher = async () => {
    if (!editingTeacher || !editingTeacher.name || !editingTeacher.email || !editingTeacher.instruments || !editingTeacher.bio) {
      toast.showError('❌ Tutti i campi sono obbligatori');
      return;
    }

    try {
      setUpdating(true);
      const token = localStorage.getItem('adminToken');
      
      // Genera username automatico per la modifica
      const username = generateUsername(editingTeacher.name);
      
      const response = await fetch(`http://localhost:3001/api/teachers/${editingTeacher.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
        },
        body: JSON.stringify({
          ...editingTeacher,
          username: username
        })
      });

      if (response.ok) {
        toast.showSuccess('✅ Insegnante modificato con successo!');
        fetchTeachers();
        setShowEditTeacherModal(false);
        setEditingTeacher(null);
      } else {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
        const error = await response.json();
        toast.showError(`❌ Errore: ${error.error}`);
      }
    } catch (error) {
      toast.showError('❌ Errore durante la modifica');
    } finally {
      setUpdating(false);
    }
  };

  const openEditModal = (teacher) => {
    setEditingTeacher({ ...teacher });
    setShowEditTeacherModal(true);
  };

  const openDeleteConfirm = (teacher) => {
    setTeacherToDelete(teacher);
    setShowDeleteConfirm(true);
  };

  const handleDeleteUser = async (userId) => {
    try {
      const token = localStorage.getItem('adminToken');
      const response = await fetch(`http://localhost:3001/api/auth/users/${userId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`,
        }
      });

      if (response.ok) {
        toast.showSuccess('✅ Utente eliminato con successo!');
        fetchUsers();
        setShowDeleteUserConfirm(false);
        setUserToDelete(null);
      } else {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
        const error = await response.json();
        toast.showError(`❌ Errore: ${error.error}`);
      }
    } catch (error) {
      toast.showError('❌ Errore durante l\'eliminazione');
    }
  };

  const openDeleteUserConfirm = (user) => {
    setUserToDelete(user);
    setShowDeleteUserConfirm(true);
  };

  // Funzione per aprire il modal di modifica utente
  const openEditUserModal = (user) => {
    setEditingUser(user);
    setEditUserForm({
      username: user.username || '',
      email: user.email || '',
      role: user.role || 'user',
      newPassword: '',
      confirmPassword: ''
    });
    setShowEditUserModal(true);
  };

  // Funzione per gestire la modifica utente
  const handleEditUser = async () => {
    if (!editUserForm.username || !editUserForm.email || !editUserForm.role) {
      toast.showError('❌ Username, email e ruolo sono obbligatori!');
      return;
    }

    // Se si vuole cambiare la password, verificare che le password coincidano
    if (editUserForm.newPassword && editUserForm.newPassword !== editUserForm.confirmPassword) {
      toast.showError('❌ Le password non coincidono!');
      return;
    }

    setUpdating(true);
    try {
      const token = localStorage.getItem('adminToken');
      
      // Preparare i dati da inviare
      const updateData = {
        username: editUserForm.username,
        email: editUserForm.email,
        role: editUserForm.role
      };

      // Aggiungere la password solo se è stata specificata
      if (editUserForm.newPassword) {
        updateData.password = editUserForm.newPassword;
      }

      const response = await fetch(`http://localhost:3001/api/auth/users/${editingUser.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        if (response.status === 401) {
          handleJWTError();
          return;
        }
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to update user');
      }

      toast.showSuccess('✅ Utente aggiornato con successo!');
      setShowEditUserModal(false);
      setEditingUser(null);
      setEditUserForm({
        username: '',
        email: '',
        role: 'user',
        newPassword: '',
        confirmPassword: ''
      });
      
      // Ricarica la lista utenti
      fetchUsers();
    } catch (err) {
      toast.showError(`❌ Errore: ${err.message}`);
    } finally {
      setUpdating(false);
    }
  };

  const truncateText = (text, maxLength = 40) => {
    if (text.length <= maxLength) return text;
    return text.substring(0, maxLength) + '...';
  };

  const openBioModal = (teacher) => {
    setSelectedTeacher(teacher);
    setShowBioModal(true);
  };

  // Funzione per gestire l'ordinamento
  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection(sortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDirection('asc');
    }
  };

  // Funzione per filtrare e ordinare gli utenti
  const getFilteredAndSortedUsers = () => {
    let filteredUsers = users;

    // Applicare la ricerca
    if (searchTerm) {
      filteredUsers = users.filter(user =>
        user.username?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.email?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        user.role?.toLowerCase().includes(searchTerm.toLowerCase())
      );
    }

    // Applicare l'ordinamento
    if (sortField) {
      filteredUsers = [...filteredUsers].sort((a, b) => {
        let aValue = a[sortField];
        let bValue = b[sortField];

        // Gestione valori null/undefined
        if (!aValue) aValue = '';
        if (!bValue) bValue = '';

        // Converti in stringa per confronto
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();

        if (sortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filteredUsers;
  };

  // Funzione per gestire l'ordinamento degli insegnanti
  const handleTeacherSort = (field) => {
    if (teacherSortField === field) {
      setTeacherSortDirection(teacherSortDirection === 'asc' ? 'desc' : 'asc');
    } else {
      setTeacherSortField(field);
      setTeacherSortDirection('asc');
    }
  };

  // Funzione per filtrare e ordinare gli insegnanti
  const getFilteredAndSortedTeachers = () => {
    let filteredTeachers = teachers;

    // Applicare la ricerca
    if (teacherSearchTerm) {
      filteredTeachers = teachers.filter(teacher =>
        teacher.name?.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
        teacher.email?.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
        teacher.instruments?.toLowerCase().includes(teacherSearchTerm.toLowerCase()) ||
        teacher.bio?.toLowerCase().includes(teacherSearchTerm.toLowerCase())
      );
    }

    // Applicare l'ordinamento
    if (teacherSortField) {
      filteredTeachers = [...filteredTeachers].sort((a, b) => {
        let aValue = a[teacherSortField];
        let bValue = b[teacherSortField];

        // Gestione valori null/undefined
        if (!aValue) aValue = '';
        if (!bValue) bValue = '';

        // Converti in stringa per confronto
        aValue = aValue.toString().toLowerCase();
        bValue = bValue.toString().toLowerCase();

        if (teacherSortDirection === 'asc') {
          return aValue.localeCompare(bValue);
        } else {
          return bValue.localeCompare(aValue);
        }
      });
    }

    return filteredTeachers;
  };

  if (loading) {
    return (
      <div className="gestione-utenti">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Caricamento utenti...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="gestione-utenti">
        <div className="error-container">
          <div className="error-icon">⚠️</div>
          <h2>Errore nel caricamento</h2>
          <p className="error-message">{error}</p>
          <div className="error-actions">
            <button 
              className="btn-primary"
              onClick={() => {
                setError(null);
                fetchUsers();
              }}
            >
              🔄 Riprova
            </button>
            <button 
              className="btn-secondary"
              onClick={() => window.location.reload()}
            >
              🔄 Ricarica pagina
            </button>
          </div>
          <div className="error-help">
            <p><strong>Suggerimenti:</strong></p>
            <ul>
              <li>Verifica che il server sia attivo sulla porta 3001</li>
              <li>Controlla la connessione di rete</li>
              <li>Se il problema persiste, prova a ricaricare la pagina</li>
            </ul>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="gestione-utenti">
      {/* Header con tab */}
      <div className="page-header">
        <div className="header-content">
          <div className="header-text">
            <h1>Gestione Utenti e Insegnanti</h1>
            <p>Gestisci tutti gli utenti del sistema e gli insegnanti di musica</p>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="tabs-container">
        <button 
          className={`tab ${activeTab === 'utenti' ? 'active' : ''}`}
          onClick={() => setActiveTab('utenti')}
        >
          <span>👥 Gestione Utenti</span>
        </button>
        <button 
          className={`tab ${activeTab === 'insegnanti' ? 'active' : ''}`}
          onClick={() => setActiveTab('insegnanti')}
        >
          <span>🎸 Gestione Insegnanti</span>
        </button>
      </div>

      {/* Tab Content */}
      {activeTab === 'utenti' && (
        <div className="tab-content">
          {/* Contenuto esistente per Gestione Utenti */}
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-icon">👥</div>
              <div className="stat-content">
                <div className="stat-number">{users.length}</div>
                <div className="stat-label">Utenti Totali</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">✅</div>
              <div className="stat-content">
                <div className="stat-number">{users.filter(u => u.is_active).length}</div>
                <div className="stat-label">Utenti Attivi</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">👑</div>
              <div className="stat-content">
                <div className="stat-number">{users.filter(u => u.role === 'admin').length}</div>
                <div className="stat-label">Amministratori</div>
              </div>
            </div>
          </div>

          <div className="page-header">
            <div className="header-content">
              <div className="header-text">
                <h2>Lista Utenti</h2>
                <p>Gestisci gli account degli utenti del sistema</p>
              </div>
              <button 
                className="btn-add-user"
                onClick={() => setShowAddUserModal(true)}
              >
                <FaPlus /> Aggiungi Utente
              </button>
            </div>
          </div>

          {/* Campo di ricerca */}
          <div className="search-container">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Cerca per username, email o ruolo..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="search-input"
              />
              {searchTerm && (
                <button
                  className="clear-search-btn"
                  onClick={() => setSearchTerm('')}
                  title="Cancella ricerca"
                >
                  ×
                </button>
              )}
            </div>
            {searchTerm && (
              <div className="search-results-info">
                Risultati: {getFilteredAndSortedUsers().length} di {users.length} utenti
              </div>
            )}
          </div>

          <div className="table-container">
            <table className="utenti-table">
              <thead>
                <tr>
                  <th 
                    className={`sortable ${sortField === 'username' ? 'sorted' : ''}`}
                    onClick={() => handleSort('username')}
                  >
                    Username
                    {sortField === 'username' && (
                      <span className="sort-indicator">
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`sortable ${sortField === 'email' ? 'sorted' : ''}`}
                    onClick={() => handleSort('email')}
                  >
                    Email
                    {sortField === 'email' && (
                      <span className="sort-indicator">
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`sortable ${sortField === 'role' ? 'sorted' : ''}`}
                    onClick={() => handleSort('role')}
                  >
                    Ruolo
                    {sortField === 'role' && (
                      <span className="sort-indicator">
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`sortable ${sortField === 'is_active' ? 'sorted' : ''}`}
                    onClick={() => handleSort('is_active')}
                  >
                    Stato
                    {sortField === 'is_active' && (
                      <span className="sort-indicator">
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`sortable ${sortField === 'last_login' ? 'sorted' : ''}`}
                    onClick={() => handleSort('last_login')}
                  >
                    Ultimo Accesso
                    {sortField === 'last_login' && (
                      <span className="sort-indicator">
                        {sortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAndSortedUsers().map(user => (
                  <tr key={user.id}>
                    <td className="username-cell">{user.username}</td>
                    <td className="email-cell">{user.email || '-'}</td>
                    <td>
                      <span className={`role-badge role-badge-${getRoleBadgeClass(user.role)}`}>
                        {getRoleDisplayText(user.role)}
                      </span>
                    </td>
                    <td>
                      <span className={`status-badge ${user.is_active ? 'active' : 'inactive'}`}>
                        {user.is_active ? '✅ Attivo' : '❌ Inattivo'}
                      </span>
                    </td>
                    <td className="last-login-cell">
                      {user.last_login ? new Date(user.last_login).toLocaleDateString('it-IT') : 'Mai'}
                    </td>
                    <td className="actions-cell">
                      <button
                        className="btn-edit"
                        onClick={() => openEditUserModal(user)}
                        title="Modifica Utente"
                      >
                        ✏️
                      </button>
                      <button
                        className="btn-delete"
                        onClick={() => openDeleteUserConfirm(user)}
                        title="Elimina Utente"
                      >
                        🗑️
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {activeTab === 'insegnanti' && (
        <div className="tab-content">
          {/* Contenuto per Gestione Insegnanti */}
          <div className="stats-overview">
            <div className="stat-card">
              <div className="stat-icon">🎸</div>
              <div className="stat-content">
                <div className="stat-number">{teachers.length}</div>
                <div className="stat-label">Insegnanti Totali</div>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🎵</div>
              <div className="stat-content">
                <div className="stat-number">
                  {teachers.reduce((total, t) => total + (t.instruments ? t.instruments.split(',').length : 0), 0)}
                </div>
                <div className="stat-label">Strumenti Totali</div>
              </div>
            </div>
          </div>

          <div className="page-header">
            <div className="header-content">
              <div className="header-text">
                <h2>Lista Insegnanti</h2>
                <p>Gestisci gli insegnanti di musica e i loro profili</p>
              </div>
              <button 
                className="btn-add-user"
                onClick={() => setShowAddTeacherModal(true)}
              >
                <FaPlus /> Aggiungi Insegnante
              </button>
            </div>
          </div>

          {/* Campo di ricerca insegnanti */}
          <div className="search-container">
            <div className="search-input-group">
              <input
                type="text"
                placeholder="Cerca per nome, email, strumenti o biografia..."
                value={teacherSearchTerm}
                onChange={(e) => setTeacherSearchTerm(e.target.value)}
                className="search-input"
              />
              {teacherSearchTerm && (
                <button
                  className="clear-search-btn"
                  onClick={() => setTeacherSearchTerm('')}
                  title="Cancella ricerca"
                >
                  ×
                </button>
              )}
            </div>
            {teacherSearchTerm && (
              <div className="search-results-info">
                Risultati: {getFilteredAndSortedTeachers().length} di {teachers.length} insegnanti
              </div>
            )}
          </div>

          <div className="table-container">
            <table className="utenti-table">
              <thead>
                <tr>
                  <th 
                    className={`sortable ${teacherSortField === 'name' ? 'sorted' : ''}`}
                    onClick={() => handleTeacherSort('name')}
                  >
                    Nome
                    {teacherSortField === 'name' && (
                      <span className="sort-indicator">
                        {teacherSortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`sortable ${teacherSortField === 'email' ? 'sorted' : ''}`}
                    onClick={() => handleTeacherSort('email')}
                  >
                    Email
                    {teacherSortField === 'email' && (
                      <span className="sort-indicator">
                        {teacherSortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th 
                    className={`sortable ${teacherSortField === 'instruments' ? 'sorted' : ''}`}
                    onClick={() => handleTeacherSort('instruments')}
                  >
                    Strumenti
                    {teacherSortField === 'instruments' && (
                      <span className="sort-indicator">
                        {teacherSortDirection === 'asc' ? ' ↑' : ' ↓'}
                      </span>
                    )}
                  </th>
                  <th>Biografia</th>
                  <th>Azioni</th>
                </tr>
              </thead>
              <tbody>
                {getFilteredAndSortedTeachers().length === 0 ? (
                  <tr>
                    <td colSpan="5" className="no-data">
                      <div className="no-data-content">
                        <div className="no-data-icon">🎸</div>
                        <h3>{teacherSearchTerm ? 'Nessun risultato trovato' : 'Nessun insegnante presente'}</h3>
                        <p>{teacherSearchTerm ? 'Prova a modificare i termini di ricerca' : 'Aggiungi il primo insegnante per iniziare!'}</p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  getFilteredAndSortedTeachers().map(teacher => (
                    <tr key={teacher.id}>
                      <td className="username-cell">{teacher.name}</td>
                      <td className="email-cell">{teacher.email}</td>
                      <td>
                        <span className="instruments-badge">
                          {teacher.instruments}
                        </span>
                      </td>
                      <td>
                        <button 
                          className="bio-preview-btn"
                          onClick={() => openBioModal(teacher)}
                          title="Clicca per vedere la bio completa"
                        >
                          {truncateText(teacher.bio, 35)}
                        </button>
                      </td>
                      <td className="actions-cell">
                        <button
                          className="btn-edit"
                          onClick={() => openEditModal(teacher)}
                          title="Modifica Insegnante"
                        >
                          ✏️
                        </button>
                        <button
                          className="btn-delete"
                          onClick={() => openDeleteConfirm(teacher)}
                          title="Elimina Insegnante"
                        >
                          🗑️
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Modal Password */}
      {showPasswordModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Cambia Password</h2>
              <button className="close-btn" onClick={() => setShowPasswordModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label>Nuova Password:</label>
                <div className="password-input-container">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={newPassword}
                    onChange={(e) => setNewPassword(e.target.value)}
                    placeholder="Inserisci nuova password"
                  />
                  <button
                    className="password-toggle-btn"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <FaEyeSlash /> : <FaEye />}
                  </button>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowPasswordModal(false)}>
                Annulla
              </button>
              <button 
                className="btn-primary" 
                onClick={handlePasswordChange}
                disabled={updating || !newPassword || newPassword.length < 6}
              >
                {updating ? 'Aggiornamento...' : 'Aggiorna Password'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Ruolo */}
      {showRoleModal && (
        <div className="modal-overlay">
          <div className="modal-content role-modal">
            <div className="modal-header">
              <div className="header-content">
                <div className="user-info">
                  <div className="user-avatar">
                    <FaUser />
                  </div>
                  <div className="user-details">
                    <h2>Cambio Ruolo</h2>
                    <p className="username">{selectedUser?.username}</p>
                  </div>
                </div>
                <button className="close-btn" onClick={() => setShowRoleModal(false)}>×</button>
              </div>
            </div>
            <div className="modal-body">
              <div className="role-change-section">
                <div className="current-role-display">
                  <div className="section-label">
                    <FaGraduationCap className="label-icon" />
                    Ruolo Attuale
                  </div>
                                          <span className={`role-badge-large role-badge-${getRoleBadgeClass(selectedUser?.role)}`}>
                          {getRoleDisplayText(selectedUser?.role)}
                        </span>
                  <p className="role-description">
                    {selectedUser?.role === 'admin' ? 'Accesso completo a tutte le funzionalità' : 
                     selectedUser?.role === 'docente' ? 'Accesso limitato a dashboard e gestione corsi' : 
                     'Utente standard con accesso limitato'}
                  </p>
                </div>

                <div className="role-change-arrow">➡️</div>

                <div className="new-role-selection">
                  <div className="section-label">
                    <FaEdit className="label-icon" />
                    Nuovo Ruolo
                  </div>
                  <select
                    className="role-select"
                    value={newRole}
                    onChange={(e) => setNewRole(e.target.value)}
                  >
                    <option value="user">👤 User - Utente standard</option>
                    <option value="docente">🎸 Docente - Insegnante di musica</option>
                    <option value="admin">👑 Admin - Amministratore completo</option>
                    <option value="salaprove">🎤 Sala Prove - Gestione prenotazioni sala prove</option>
                    <option value="salacorsi">🎼 Sala Corsi - Gestione richieste corsi</option>
                    <option value="news">📰 News - Gestione articoli e comunicazioni</option>
                  </select>

                  {newRole && newRole !== selectedUser?.role && (
                    <div className="new-role-preview">
                      <span className="preview-label">Anteprima nuovo ruolo:</span>
                                              <span className={`role-badge-preview role-badge-${getRoleBadgeClass(newRole)}`}>
                          {getRoleDisplayText(newRole)}
                        </span>
                    </div>
                  )}
                </div>
              </div>

              <div className="role-change-warning">
                <FaTimes className="warning-icon" />
                <div className="warning-content">
                  <strong>Attenzione:</strong> Il cambio di ruolo può modificare significativamente i permessi dell'utente. 
                  Assicurati che questa modifica sia necessaria e appropriata.
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowRoleModal(false)}>
                Annulla
              </button>
              <button 
                className="btn-primary" 
                onClick={handleRoleChange}
                disabled={updating || !newRole || newRole === selectedUser?.role}
              >
                {updating ? 'Aggiornamento...' : 'Aggiorna Ruolo'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifica Utente */}
      {showEditUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Modifica Utente</h2>
              <button className="close-btn" onClick={() => setShowEditUserModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-group">
                <label htmlFor="edit-username">Username *</label>
                <input
                  id="edit-username"
                  type="text"
                  value={editUserForm.username}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, username: e.target.value }))}
                  placeholder="Username utente"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-email">Email *</label>
                <input
                  id="edit-email"
                  type="email"
                  value={editUserForm.email}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, email: e.target.value }))}
                  placeholder="Email utente"
                  required
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-role">Ruolo *</label>
                <select
                  id="edit-role"
                  value={editUserForm.role}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, role: e.target.value }))}
                  required
                >
                  <option value="user">👤 User - Utente standard</option>
                  <option value="docente">🎸 Docente - Insegnante di musica</option>
                  <option value="admin">👑 Admin - Amministratore completo</option>
                  <option value="salaprove">🎤 Sala Prove - Gestione prenotazioni sala prove</option>
                  <option value="salacorsi">🎼 Sala Corsi - Gestione richieste corsi</option>
                  <option value="news">📰 News - Gestione articoli e comunicazioni</option>
                </select>
              </div>

              <div className="form-group">
                <label htmlFor="edit-password">Nuova Password (opzionale)</label>
                <input
                  id="edit-password"
                  type="password"
                  value={editUserForm.newPassword}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, newPassword: e.target.value }))}
                  placeholder="Lascia vuoto per non cambiare"
                />
              </div>

              <div className="form-group">
                <label htmlFor="edit-confirm-password">Conferma Password</label>
                <input
                  id="edit-confirm-password"
                  type="password"
                  value={editUserForm.confirmPassword}
                  onChange={(e) => setEditUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  placeholder="Conferma la nuova password"
                />
              </div>

              {editUserForm.newPassword && (
                <div className="password-change-info">
                  <p>🔐 La password verrà aggiornata solo se entrambi i campi sono compilati</p>
                </div>
              )}
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditUserModal(false)}>
                Annulla
              </button>
              <button 
                className="btn-primary" 
                onClick={handleEditUser}
                disabled={updating}
              >
                {updating ? 'Aggiornamento...' : 'Aggiorna Utente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aggiungi Utente */}
      {showAddUserModal && (
        <div className="modal-overlay">
          <div className="modal-content">
            <div className="modal-header">
              <h2>Aggiungi Nuovo Utente</h2>
              <button className="close-btn" onClick={() => setShowAddUserModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Username:</label>
                  <input
                    className="form-input"
                    type="text"
                    value={newUser.username}
                    onChange={(e) => setNewUser({...newUser, username: e.target.value})}
                    placeholder="Inserisci username"
                  />
                </div>
                <div className="form-group">
                  <label>Ruolo:</label>
                  <select
                    className="form-input"
                    value={newUser.role}
                    onChange={(e) => setNewUser({...newUser, role: e.target.value})}
                  >
                    <option value="user">👤 User</option>
                    <option value="docente">🎸 Docente</option>
                    <option value="admin">👑 Admin</option>
                    <option value="salaprove">🎤 Sala Prove</option>
                    <option value="salacorsi">🎼 Sala Corsi</option>
                    <option value="news">📰 News</option>
                  </select>
                </div>
              </div>
              <div className="form-grid">
                <div className="form-group">
                  <label>Password:</label>
                  <input
                    className="form-input"
                    type="password"
                    value={newUser.password}
                    onChange={(e) => setNewUser({...newUser, password: e.target.value})}
                    placeholder="Inserisci password"
                  />
                </div>
                <div className="form-group">
                  <label>Conferma Password:</label>
                  <input
                    className="form-input"
                    type="password"
                    value={newUser.confirmPassword}
                    onChange={(e) => setNewUser({...newUser, confirmPassword: e.target.value})}
                    placeholder="Conferma password"
                  />
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddUserModal(false)}>
                Annulla
              </button>
              <button 
                className="btn-primary" 
                onClick={handleAddUser}
                disabled={updating}
              >
                {updating ? 'Creazione...' : 'Crea Utente'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Aggiungi Insegnante */}
      {showAddTeacherModal && (
        <div className="teacher-modal-overlay">
          <div className="teacher-modal-content">
            <div className="modal-header">
              <h2>Aggiungi Nuovo Insegnante</h2>
              <button className="close-btn" onClick={() => setShowAddTeacherModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome e Cognome:</label>
                  <input
                    className="form-input"
                    type="text"
                    value={newTeacher.name}
                    onChange={(e) => setNewTeacher({...newTeacher, name: e.target.value})}
                    placeholder="Inserisci nome e cognome"
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    className="form-input"
                    type="email"
                    value={newTeacher.email}
                    onChange={(e) => setNewTeacher({...newTeacher, email: e.target.value})}
                    placeholder="Inserisci email"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Strumenti che insegna:</label>
                <input
                  className="form-input"
                  type="text"
                  value={newTeacher.instruments}
                  onChange={(e) => setNewTeacher({...newTeacher, instruments: e.target.value})}
                  placeholder="Es: Chitarra, Piano, Basso"
                />
                <small>Separa più strumenti con virgole</small>
              </div>
              <div className="form-group">
                <label>Biografia:</label>
                <textarea
                  className="form-input"
                  value={newTeacher.bio}
                  onChange={(e) => setNewTeacher({...newTeacher, bio: e.target.value})}
                  placeholder="Descrivi l'esperienza e la formazione dell'insegnante"
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowAddTeacherModal(false)}>
                Annulla
              </button>
              <button 
                className="btn-primary" 
                onClick={handleAddTeacher}
                disabled={updating}
              >
                {updating ? 'Creazione...' : 'Crea Insegnante'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Bio Completa */}
      {showBioModal && selectedTeacher && (
        <div className="teacher-modal-overlay">
          <div className="teacher-modal-content">
            <div className="modal-header">
              <h2>Biografia di {selectedTeacher.name}</h2>
              <button className="close-btn" onClick={() => setShowBioModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="teacher-bio-content">
                <div className="bio-section">
                  <h3>📧 Contatto</h3>
                  <p><strong>Email:</strong> {selectedTeacher.email}</p>
                </div>
                <div className="bio-section">
                  <h3>🎵 Strumenti</h3>
                  <p><strong>Insegna:</strong> {selectedTeacher.instruments}</p>
                </div>
                <div className="bio-section">
                  <h3>📖 Biografia</h3>
                  <div className="bio-text">
                    {selectedTeacher.bio}
                  </div>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-primary" onClick={() => setShowBioModal(false)}>
                Chiudi
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Modifica Insegnante */}
      {showEditTeacherModal && editingTeacher && (
        <div className="teacher-modal-overlay">
          <div className="teacher-modal-content">
            <div className="modal-header">
              <h2>Modifica Insegnante</h2>
              <button className="close-btn" onClick={() => setShowEditTeacherModal(false)}>×</button>
            </div>
            <div className="modal-body">
              <div className="form-grid">
                <div className="form-group">
                  <label>Nome e Cognome:</label>
                  <input
                    className="form-input"
                    type="text"
                    value={editingTeacher.name}
                    onChange={(e) => setEditingTeacher({...editingTeacher, name: e.target.value})}
                    placeholder="Inserisci nome e cognome"
                  />
                </div>
                <div className="form-group">
                  <label>Email:</label>
                  <input
                    className="form-input"
                    type="email"
                    value={editingTeacher.email}
                    onChange={(e) => setEditingTeacher({...editingTeacher, email: e.target.value})}
                    placeholder="Inserisci email"
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Strumenti che insegna:</label>
                <input
                  className="form-input"
                  type="text"
                  value={editingTeacher.instruments}
                  onChange={(e) => setEditingTeacher({...editingTeacher, instruments: e.target.value})}
                  placeholder="Es: Chitarra, Piano, Basso"
                />
                <small>Separa più strumenti con virgole</small>
              </div>
              <div className="form-group">
                <label>Biografia:</label>
                <textarea
                  className="form-input"
                  value={editingTeacher.bio}
                  onChange={(e) => setEditingTeacher({...editingTeacher, bio: e.target.value})}
                  placeholder="Descrivi l'esperienza e la formazione dell'insegnante"
                  rows="4"
                />
              </div>
            </div>
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowEditTeacherModal(false)}>
                Annulla
              </button>
              <button 
                className="btn-primary" 
                onClick={handleEditTeacher}
                disabled={updating}
              >
                {updating ? 'Salvataggio...' : 'Salva Modifiche'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione */}
      {showDeleteConfirm && teacherToDelete && (
        <div className="teacher-modal-overlay">
          <div className="teacher-modal-content">
            <div className="delete-teacher-banner">
              <div className="banner-icon">⚠️</div>
              <div className="banner-text">
                <div className="banner-title">Elimina Insegnante</div>
                <div className="banner-description">
                  Questa azione non può essere annullata
                </div>
              </div>
            </div>
            
            <div className="modal-body">
              <p><strong>Nome:</strong> {teacherToDelete.name}</p>
              <p><strong>Email:</strong> {teacherToDelete.email}</p>
              <p><strong>Strumenti:</strong> {teacherToDelete.instruments}</p>
              
              <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca'}}>
                <p style={{color: '#dc2626', margin: 0, fontSize: '0.9rem'}}>
                  <strong>⚠️ Attenzione:</strong> Eliminando questo insegnante verrà rimosso anche il suo account utente e tutti i dati associati.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteConfirm(false)}>
                Annulla
              </button>
              <button 
                className="btn-delete" 
                onClick={() => handleDeleteTeacher(teacherToDelete.id)}
                style={{width: 'auto', padding: '0.75rem 1.5rem'}}
              >
                🗑️ Elimina Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal Conferma Eliminazione Utente */}
      {showDeleteUserConfirm && userToDelete && (
        <div className="teacher-modal-overlay">
          <div className="teacher-modal-content">
            <div className="delete-teacher-banner">
              <div className="banner-icon">⚠️</div>
              <div className="banner-text">
                <div className="banner-title">Elimina Utente</div>
                <div className="banner-description">
                  Questa azione non può essere annullata
                </div>
              </div>
            </div>
            
            <div className="modal-body">
              <p><strong>Username:</strong> {userToDelete.username}</p>
              <p><strong>Email:</strong> {userToDelete.email || 'Non specificata'}</p>
              <p><strong>Ruolo:</strong> {userToDelete.role}</p>
              <p><strong>Stato:</strong> {userToDelete.is_active ? 'Attivo' : 'Inattivo'}</p>
              
              <div style={{marginTop: '1rem', padding: '1rem', backgroundColor: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca'}}>
                <p style={{color: '#dc2626', margin: 0, fontSize: '0.9rem'}}>
                  <strong>⚠️ Attenzione:</strong> Eliminando questo utente verranno rimossi tutti i dati associati, inclusi eventuali profili insegnante, prenotazioni e richieste corsi.
                </p>
              </div>
            </div>
            
            <div className="modal-footer">
              <button className="btn-secondary" onClick={() => setShowDeleteUserConfirm(false)}>
                Annulla
              </button>
              <button 
                className="btn-delete" 
                onClick={() => handleDeleteUser(userToDelete.id)}
                style={{width: 'auto', padding: '0.75rem 1.5rem'}}
              >
                🗑️ Elimina Definitivamente
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GestioneUtenti;
