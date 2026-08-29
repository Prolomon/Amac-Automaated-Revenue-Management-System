"use client";

import { useCallback, useEffect, useState } from "react";
import {
  Plus,
  RefreshCcw,
  AlertCircle,
  Network,
  Pencil,
  Trash2,
  X,
  Check,
  XCircle,
} from "lucide-react";
import { useAuth } from "@/context/AuthContext";
import {
  getDepartments,
  getDepartmentsByCenter,
  createDepartment,
  updateDepartment,
  deleteDepartment,
  Department,
} from "@/lib/services/department";
import { useToast } from "@/context/ToastContext";

export default function DepartmentListPage() {
  const { uid, user, role } = useAuth();
  const { addToast } = useToast();

  const [departments, setDepartments] = useState<Department[] | null>(null);
  const [loading, setLoading] = useState(false);
  const [creating, setCreating] = useState(false);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [newName, setNewName] = useState("");
  const [newRole, setNewRole] = useState("");

  const [selectedDepartment, setSelectedDepartment] = useState<Department | null>(null);
  const [editName, setEditName] = useState("");
  const [editRole, setEditRole] = useState("");
  const [editStatus, setEditStatus] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    try {
      const center = user?.uid || uid || "";
      const data = center
        ? await getDepartmentsByCenter(center, { page: 1, limit: 100 })
        : await getDepartments({ page: 1, limit: 100 });
      const list = Array.isArray(data?.data) ? data.data : [];
      setDepartments(list);
    } catch (err: any) {
      addToast("error", err.message || "Failed to fetch departments");
      setDepartments([]);
    } finally {
      setLoading(false);
    }
  }, [user?.center, user?.uid, uid, addToast]);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  const openDetailsModal = (department: Department) => {
    setSelectedDepartment(department);
    setEditName(department.name || "");
    setEditRole(department.role || "");
    setEditStatus(department.status ?? true);
  };

  const closeDetailsModal = () => {
    setSelectedDepartment(null);
  };

  const handleUpdate = async () => {
    if (!selectedDepartment?.uid) return;
    if (!editName.trim()) {
      addToast("error", "Department name is required");
      return;
    }

    setSaving(true);
    try {
      await updateDepartment(selectedDepartment.uid, {
        name: editName.trim(),
        ...(editRole.trim() ? { role: editRole.trim() } : {}),
        status: editStatus,
      });
      addToast("success", "Department updated successfully");
      closeDetailsModal();
      await loadDepartments();
    } catch (err: any) {
      addToast("error", err.message || "Failed to update department");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    if (!selectedDepartment?.uid) return;
    if (!confirm(`Are you sure you want to delete "${selectedDepartment.name}"?`)) return;

    setDeleting(true);
    try {
      await deleteDepartment(selectedDepartment.uid);
      addToast("success", "Department deleted successfully");
      closeDetailsModal();
      await loadDepartments();
    } catch (err: any) {
      addToast("error", err.message || "Failed to delete department");
    } finally {
      setDeleting(false);
    }
  };

  const handleCreate = async () => {
    const center = user?.uid || uid || "";
    if (!newName.trim()) {
      addToast("error", "Department name is required");
      return;
    }
    if (!center) {
      addToast("error", "Center is required to create a department");
      return;
    }

    setCreating(true);
    try {
      await createDepartment({
        name: newName.trim(),
        center,
        role: newRole.trim() || "STAFF",
      });
      addToast("success", "Department created successfully");
      setShowCreateModal(false);
      setNewName("");
      await loadDepartments();
    } catch (err: any) {
      addToast("error", err.message || "Failed to create department");
    } finally {
      setCreating(false);
    }
  };

  return (
    <div className="mx-auto max-w-7xl p-4 space-y-4">

      {/* Header Banner */}
      <div className="rounded-2xl bg-linear-to-r from-emerald-900 via-emerald-800 to-teal-900 p-5 text-white shadow-lg md:p-6">
        <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
          <div>
            <div className="flex items-center gap-2">
              <Network className="h-7 w-7 text-emerald-400" />
              <h1 className="text-2xl font-bold md:text-3xl">Departments</h1>
            </div>
            <p className="mt-1 text-sm text-emerald-100 md:text-base">
              Manage departments within your center. Click a department to view and edit its details.
            </p>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row">
            <button
              onClick={loadDepartments}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-700 bg-emerald-800/60 px-4 py-2.5 text-sm font-semibold text-emerald-100 transition-colors hover:bg-emerald-700 hover:text-white"
            >
              <RefreshCcw size={18} />
              Refresh
            </button>
            <button
              onClick={() => setShowCreateModal(true)}
              className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-500 px-4 py-2.5 text-sm font-semibold text-white shadow-md transition-colors hover:bg-emerald-400"
            >
              <Plus size={18} />
              Add Department
            </button>
          </div>
        </div>
      </div>

      {/* Departments Grid */}
      <div className="rounded-2xl bg-white p-5 md:p-6 ring-1 ring-slate-100 shadow-sm">
        <div className="mb-5">
          <p className="text-xs uppercase tracking-wide text-slate-500 font-semibold">Departments</p>
          <h2 className="mt-1 text-lg font-semibold text-slate-900">All Departments</h2>
        </div>

        {loading ? (
          <div className="py-16 text-center text-slate-500">Loading departments...</div>
        ) : departments && departments.length > 0 ? (
          <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-3">
            {departments.map((department) => {
              const key = department.id || department.uid || department.name;
              return (
                <button
                  key={key}
                  onClick={() => openDetailsModal(department)}
                  className="group rounded-2xl border border-slate-100 bg-slate-50/50 p-4 text-left ring-1 ring-slate-100 shadow-xs transition-all hover:border-emerald-200 hover:bg-emerald-50/40 hover:shadow-md"
                >
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                        <Network size={20} />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-900 group-hover:text-emerald-700">
                          {department.name}
                        </p>
                        <p className="text-xs text-slate-500">
                          {department.role || "No role"} · {department.uid}
                        </p>
                      </div>
                    </div>
                    <span
                      className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                        department.status
                          ? "bg-emerald-100 text-emerald-700"
                          : "bg-slate-200 text-slate-600"
                      }`}
                    >
                      {department.status ? (
                        <>
                          <Check size={12} /> Active
                        </>
                      ) : (
                        <>
                          <XCircle size={12} /> Inactive
                        </>
                      )}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center justify-between text-xs text-slate-600 border-t border-slate-100 pt-2">
                    <span className="font-semibold text-slate-500">Center</span>
                    <span className="rounded-full bg-slate-100 px-2.5 py-0.5 font-medium text-slate-700">
                      {department.center}
                    </span>
                  </div>

                  <div className="mt-3 flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
                    <Pencil size={13} />
                    Click to view &amp; edit
                  </div>
                </button>
              );
            })}
          </div>
        ) : (
          <div className="py-16 text-center">
            <div className="flex flex-col items-center justify-center">
              <AlertCircle className="mb-4 h-12 w-12 text-slate-300" />
              <h3 className="mb-2 text-lg font-semibold text-slate-700">No Departments Found</h3>
              <p className="mb-6 text-slate-500 max-w-md">
                No departments have been created yet for your center.
              </p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="inline-flex items-center gap-2 rounded-xl bg-emerald-600 px-6 py-3 text-sm font-semibold text-white transition-colors hover:bg-emerald-700 shadow-md"
              >
                <Plus size={18} />
                Add Department
              </button>
            </div>
          </div>
        )}
      </div>


      {/* Details / Edit Modal */}
      {selectedDepartment && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={closeDetailsModal}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="rounded-xl bg-emerald-100 p-2 text-emerald-700">
                  <Network size={20} />
                </div>
                <div>
                  <h3 className="text-lg font-bold text-slate-900">Department Details</h3>
                  <p className="text-xs text-slate-500">{selectedDepartment.uid}</p>
                </div>
              </div>
              <button
                onClick={closeDetailsModal}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Department Name
                </label>
                <input
                  type="text"
                  value={editName}
                  onChange={(e) => setEditName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Department name"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </label>
                <input
                  type="text"
                  value={editRole}
                  onChange={(e) => setEditRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="Department role"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Center
                </label>
                <input
                  type="text"
                  value={selectedDepartment.center || ""}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
                />
              </div>

              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Status
                </label>
                <button
                  type="button"
                  onClick={() => setEditStatus((prev) => !prev)}
                  className={`inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-colors ${
                    editStatus
                      ? "bg-emerald-100 text-emerald-700 hover:bg-emerald-200"
                      : "bg-slate-200 text-slate-600 hover:bg-slate-300"
                  }`}
                >
                  {editStatus ? (
                    <>
                      <Check size={16} /> Active
                    </>
                  ) : (
                    <>
                      <XCircle size={16} /> Inactive
                    </>
                  )}
                </button>
              </div>

              <div className="border-t border-slate-100 pt-4">
                <div className="flex items-center justify-between text-xs text-slate-500">
                  <span>Created: {selectedDepartment.createdAt ? new Date(selectedDepartment.createdAt).toLocaleString() : "N/A"}</span>
                  <span>Updated: {selectedDepartment.updatedAt ? new Date(selectedDepartment.updatedAt).toLocaleString() : "N/A"}</span>
                </div>
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={handleDelete}
                disabled={deleting || saving}
                className="inline-flex items-center justify-center gap-2 rounded-xl border border-red-200 bg-red-50 px-4 py-2.5 text-sm font-bold text-red-600 transition-colors hover:bg-red-100 disabled:opacity-50"
              >
                <Trash2 size={16} />
                {deleting ? "Deleting..." : "Delete"}
              </button>
              <button
                onClick={handleUpdate}
                disabled={saving || deleting}
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Create Modal */}
      {showCreateModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowCreateModal(false)}
        >
          <div
            className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-bold text-slate-900">Add Department</h3>
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-lg p-1.5 text-slate-400 transition-colors hover:bg-slate-100 hover:text-slate-600"
              >
                <X size={20} />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Department Name
                </label>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="e.g. Operations"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Role
                </label>
                <input
                  type="text"
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value)}
                  className="w-full rounded-xl border border-slate-200 px-4 py-2.5 text-sm text-slate-800 outline-none transition-colors focus:border-emerald-500 focus:ring-2 focus:ring-emerald-100"
                  placeholder="e.g. Manager, Finance"
                />
              </div>
              <div>
                <label className="mb-1 block text-xs font-semibold uppercase tracking-wide text-slate-500">
                  Center
                </label>
                <input
                  type="text"
                  value={user?.center || user?.uid || uid || ""}
                  readOnly
                  className="w-full cursor-not-allowed rounded-xl border border-slate-200 bg-slate-50 px-4 py-2.5 text-sm text-slate-500"
                />
              </div>
            </div>

            <div className="mt-6 grid grid-cols-2 gap-3">
              <button
                onClick={() => setShowCreateModal(false)}
                className="rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-sm font-bold text-slate-700 transition-colors hover:bg-slate-50"
              >
                Cancel
              </button>
              <button
                onClick={handleCreate}
                disabled={creating}
                className="rounded-xl bg-emerald-600 px-4 py-2.5 text-sm font-bold text-white transition-colors hover:bg-emerald-700 disabled:opacity-50"
              >
                {creating ? "Creating..." : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
