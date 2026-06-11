import React, { useState, useEffect } from 'react';
import axios from 'axios';
import { Users, ShieldAlert, Globe, MapPin, UserCheck, Search, Phone } from 'lucide-react';

const UserManagement = () => {
  const [users, setUsers] = useState([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(true);

  const fetchUsers = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const res = await axios.get(`${process.env.REACT_APP_API_URL}/api/admin/users`,{
        headers: { Authorization: `Bearer ${token}` }
      });
      if (res.data.success) {
        const finalUserList = res.data.users ? res.data.users : (res.data.data || []);
        setUsers(Array.isArray(finalUserList) ? finalUserList : []);
      }
    } catch (err) {
      console.error("Error loading user records:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { fetchUsers(); }, []);

  const toggleUserStatus = async (userId, currentStatus) => {
    try {
      const token = localStorage.getItem('token');
      const newStatus = currentStatus === 'Active' ? 'Blocked' : 'Active';
      
      const res = await axios.put(`${process.env.REACT_APP_API_URL}/api/admin/users/${userId}/status`, 
        { status: newStatus },
        { headers: { Authorization: `Bearer ${token}` } }
      );

      if (res.data.success) {
        setUsers(users.map(u => u.id === userId ? { ...u, status: newStatus } : u));
      }
    } catch (err) {
      console.error("Failed to update status constraint:", err);
    }
  };

  const filteredUsers = users.filter(user => 
    (user.full_name && user.full_name.toLowerCase().includes(searchQuery.toLowerCase())) ||
    (user.phone_number && user.phone_number.includes(searchQuery)) ||
    (user.location && user.location.toLowerCase().includes(searchQuery.toLowerCase()))
  );

  return (
    <div className="p-6 lg:p-10 bg-slate-50/50 min-h-screen">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-4 mb-8 border-b pb-6">
        <div className="flex items-center gap-4">
          <div className="p-3 bg-slate-900 rounded-2xl text-white shadow-md">
            <Users size={26} />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-slate-900">User Management</h1>
            <p className="text-slate-500 text-sm mt-0.5 font-medium">Manage and monitor registered farmer accounts across regions.</p>
          </div>
        </div>

        <div className="relative min-w-[300px]">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" size={18} />
          <input 
            type="text"
            placeholder="Search name, phone, or region..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-11 pr-4 py-2.5 text-sm bg-white border border-slate-200 rounded-xl focus:ring-2 focus:ring-emerald-500/20 focus:border-emerald-500 outline-none transition-all"
          />
        </div>
      </div>

      <div className="max-w-7xl mx-auto bg-white rounded-2xl border border-slate-200/70 shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="bg-slate-50/70 border-b border-slate-100 text-xs font-bold text-slate-500 uppercase tracking-wider">
                <th className="p-4 pl-6">Farmer Profile</th>
                <th className="p-4">Regional Location</th>
                <th className="p-4">App Localization</th>
                <th className="p-4">Status Flag</th>
                <th className="p-4 pr-6 text-right">Access Control Actions</th>
              </tr>
            </thead>
            <tbody className="text-sm divide-y divide-slate-100 text-slate-700 font-medium">
              {loading ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 italic">Querying users data table matrix lines...</td>
                </tr>
              ) : filteredUsers.length === 0 ? (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-slate-400 italic">No matching user accounts matched this search query criteria.</td>
                </tr>
              ) : (
                filteredUsers.map((user) => (
                  <tr key={user.id} className="hover:bg-slate-50/40 transition-colors">
                    <td className="p-4 pl-6">
                      <div className="flex items-center gap-3">
                        {user.profile_image ? (
                          <img 
                            src={`${process.env.REACT_APP_API_URL}${user.profile_image}`} 
                            alt={user.full_name} 
                            className="w-10 h-10 rounded-full object-cover border border-slate-200"
                          />
                        ) : (
                          <div className="w-10 h-10 rounded-full bg-emerald-50 text-emerald-700 flex items-center justify-center font-bold text-sm uppercase border border-emerald-100">
                            {user.full_name ? user.full_name.substring(0, 2) : 'FI'}
                          </div>
                        )}
                        <div>
                          <div className="font-bold text-slate-800">{user.full_name}</div>
                          <div className="flex items-center gap-1 text-xs text-slate-400 mt-0.5 font-normal">
                            <Phone size={12} />
                            {user.phone_number}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <MapPin size={15} className="text-slate-400" />
                        {user.location || "Unspecified"}
                      </div>
                    </td>
                    <td className="p-4">
                      <div className="flex items-center gap-1.5 text-slate-600">
                        <Globe size={15} className="text-slate-400" />
                        {user.language_pref || "English"}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-bold ${
                        user.status === 'Active' ? 'bg-emerald-50 text-emerald-700' : 'bg-rose-50 text-rose-700'
                      }`}>
                        {user.status || 'Active'}
                      </span>
                    </td>
                    <td className="p-4 pr-6 text-right">
                      <button
                        onClick={() => toggleUserStatus(user.id, user.status || 'Active')}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-bold border transition-all ${
                          user.status === 'Blocked'
                            ? 'border-emerald-100 text-emerald-600 bg-emerald-50/30 hover:bg-emerald-50'
                            : 'border-rose-100 text-rose-600 bg-rose-50/30 hover:bg-rose-50'
                        }`}
                      >
                        {user.status === 'Blocked' ? (
                          <> <UserCheck size={14} /> Unblock Account </>
                        ) : (
                          <> <ShieldAlert size={14} /> Revoke / Block </>
                        )}
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default UserManagement;