import { useState, useEffect, useRef } from 'react';
import Modal from '../common/Modal';
import OrderItemEditor from './OrderItemEditor';
import CommunicationFeed from './CommunicationFeed';
import EmailComposer from './EmailComposer';
import ProofManager from './ProofManager';
import UserDropdown from '../UserDropdown';
import InlineUserCreateForm from './InlineUserCreateForm';
import { adminAPI } from '../../services/api';
import { formatDatePT } from '../../utils/dateFormat';
import usePolling from '../../hooks/usePolling';

const statusOptions = ['new', 'waiting_feedback', 'in_progress', 'submitted_to_kimp360', 'waiting_signoff', 'sent_to_print', 'completed', 'on_hold'];

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  waiting_feedback: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  on_hold: 'bg-orange-100 text-orange-800',
  waiting_signoff: 'bg-purple-100 text-purple-800',
  submitted_to_kimp360: 'bg-pink-100 text-pink-800',
  sent_to_print: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-green-100 text-green-800',
};

const statusLabels = {
  new: 'New Request Received',
  waiting_feedback: 'Waiting for Feedback',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  waiting_signoff: 'Waiting for Sign Off',
  submitted_to_kimp360: 'Submitted to Kimp360',
  sent_to_print: 'Sent to Print',
  completed: 'Completed',
};

export default function OrderDetailModal({ order, isOpen, onClose, onUpdate, admins, user }) {
  const [notes, setNotes] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [proofs, setProofs] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingComms, setLoadingComms] = useState(false);
  const [loadingProofs, setLoadingProofs] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAssignment, setUpdatingAssignment] = useState(false);
  const [activeTab, setActiveTab] = useState('communications'); // 'communications' or 'proofs'
  const [ccEmails, setCcEmails] = useState([]);
  const [newCcEmail, setNewCcEmail] = useState('');
  const [savingCc, setSavingCc] = useState(false);
  const [editingCustomerInfo, setEditingCustomerInfo] = useState(false);
  const [customerInfoDraft, setCustomerInfoDraft] = useState({});
  const [savingCustomerInfo, setSavingCustomerInfo] = useState(false);
  const [selectedUserId, setSelectedUserId] = useState(null);
  const [showCreateUserForm, setShowCreateUserForm] = useState(false);

  const orderStatusRef = useRef(order?.status);
  const orderAssignedRef = useRef(order?.assignedTo);

  useEffect(() => {
    orderStatusRef.current = order?.status;
    orderAssignedRef.current = order?.assignedTo;
  }, [order?.status, order?.assignedTo]);

  useEffect(() => {
    if (isOpen && order) {
      loadNotes();
      loadCommunications();
      loadProofs();
      setCcEmails(order.shippingInfo?.additionalEmails || []);
    }
  }, [isOpen, order?.id]);

  // Poll every 15s while modal is open
  usePolling(async () => {
    const [orderRes, notesRes, commsRes, proofsRes] = await Promise.all([
      adminAPI.getOrder(order.id),
      adminAPI.getOrderNotes(order.id),
      adminAPI.getOrderCommunications(order.id),
      adminAPI.getOrderProofs(order.id),
    ]);
    setNotes(notesRes.data.notes || []);
    setCommunications(commsRes.data.communications || []);
    setProofs(proofsRes.data.proofs || []);
    // Only trigger parent refresh if status/assignment actually changed
    const fetched = orderRes.data.order;
    if (fetched.status !== orderStatusRef.current || fetched.assignedTo !== orderAssignedRef.current) {
      onUpdate();
    }
  }, 15000, isOpen && !!order);

  const loadNotes = async () => {
    if (!order) return;
    setLoadingNotes(true);
    try {
      const response = await adminAPI.getOrderNotes(order.id);
      setNotes(response.data.notes || []);
    } catch (error) {
      console.error('Failed to load notes:', error);
    } finally {
      setLoadingNotes(false);
    }
  };

  const loadCommunications = async () => {
    if (!order) return;
    setLoadingComms(true);
    try {
      const response = await adminAPI.getOrderCommunications(order.id);
      setCommunications(response.data.communications || []);
    } catch (error) {
      console.error('Failed to load communications:', error);
    } finally {
      setLoadingComms(false);
    }
  };

  const loadProofs = async () => {
    if (!order) return;
    setLoadingProofs(true);
    try {
      const response = await adminAPI.getOrderProofs(order.id);
      setProofs(response.data.proofs || []);
    } catch (error) {
      console.error('Failed to load proofs:', error);
    } finally {
      setLoadingProofs(false);
    }
  };

  const handleAddNote = async () => {
    if (!newNote.trim()) return;
    setAddingNote(true);
    try {
      await adminAPI.addOrderNote(order.id, newNote);
      setNewNote('');
      loadNotes();
    } catch (error) {
      console.error('Failed to add note:', error);
      alert('Failed to add note');
    } finally {
      setAddingNote(false);
    }
  };

  const handleDeleteNote = async (noteId) => {
    if (!confirm('Delete this note?')) return;
    try {
      await adminAPI.deleteOrderNote(noteId);
      loadNotes();
    } catch (error) {
      console.error('Failed to delete note:', error);
      alert('Failed to delete note');
    }
  };

  const handleUpdateItems = async (items) => {
    setSavingItems(true);
    try {
      await adminAPI.updateOrderItems(order.id, items);
      onUpdate();
    } catch (error) {
      console.error('Failed to update items:', error);
      alert('Failed to update items');
    } finally {
      setSavingItems(false);
    }
  };

  const handleSendEmail = async ({ subject, body, attachments = [], includeOrderDetails = true }) => {
    setSendingEmail(true);
    try {
      await adminAPI.sendOrderEmail(order.id, subject, body, attachments, includeOrderDetails);
      loadCommunications();
      return true;
    } catch (error) {
      console.error('Failed to send email:', error);
      alert('Failed to send email');
      return false;
    } finally {
      setSendingEmail(false);
    }
  };

  const handleAddCcEmail = async () => {
    const email = newCcEmail.trim().toLowerCase();
    if (!email) return;

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      alert('Please enter a valid email address');
      return;
    }

    // Check if already in list
    if (ccEmails.includes(email)) {
      alert('This email is already in the CC list');
      return;
    }

    const updatedEmails = [...ccEmails, email];
    setSavingCc(true);
    try {
      await adminAPI.updateCcEmails(order.id, updatedEmails);
      setCcEmails(updatedEmails);
      setNewCcEmail('');
      onUpdate();
    } catch (error) {
      console.error('Failed to add CC email:', error);
      alert('Failed to add CC email');
    } finally {
      setSavingCc(false);
    }
  };

  const handleRemoveCcEmail = async (emailToRemove) => {
    const updatedEmails = ccEmails.filter(email => email !== emailToRemove);
    setSavingCc(true);
    try {
      await adminAPI.updateCcEmails(order.id, updatedEmails);
      setCcEmails(updatedEmails);
      onUpdate();
    } catch (error) {
      console.error('Failed to remove CC email:', error);
      alert('Failed to remove CC email');
    } finally {
      setSavingCc(false);
    }
  };

  const handleStatusChange = async (newStatus) => {
    setUpdatingStatus(true);
    try {
      await adminAPI.updateOrderStatus(order.id, newStatus);
      onUpdate();
    } catch (error) {
      console.error('Failed to update status:', error);
      alert('Failed to update status');
    } finally {
      setUpdatingStatus(false);
    }
  };

  const handleAssignmentChange = async (adminId) => {
    setUpdatingAssignment(true);
    try {
      await adminAPI.assignOrder(order.id, adminId || null);
      onUpdate();
    } catch (error) {
      console.error('Failed to assign order:', error);
      alert('Failed to assign order');
    } finally {
      setUpdatingAssignment(false);
    }
  };

  const handleEditCustomerInfo = () => {
    const info = order.shippingInfo || {};
    setCustomerInfoDraft({
      schoolName: info.schoolName || '',
      contactName: info.contactName || '',
      positionTitle: info.positionTitle || '',
      principalName: info.principalName || '',
      email: info.email || '',
      phone: info.phone || '',
      department: info.department || '',
    });
    setSelectedUserId(null);
    setShowCreateUserForm(false);
    setEditingCustomerInfo(true);
  };

  const handleUserSelected = (userId, userData) => {
    setSelectedUserId(userId);
    setShowCreateUserForm(false);
    setCustomerInfoDraft(prev => ({
      ...prev,
      contactName: userData.contactName || prev.contactName,
      email: userData.email || prev.email,
      phone: userData.phone || prev.phone,
      schoolName: userData.schoolName || prev.schoolName,
      principalName: userData.principalName || prev.principalName,
      positionTitle: userData.positionTitle || prev.positionTitle,
      department: userData.department || prev.department,
    }));
  };

  const handleUserCreated = (createdUser) => {
    handleUserSelected(createdUser.id, createdUser);
  };

  const handleSaveCustomerInfo = async () => {
    setSavingCustomerInfo(true);
    try {
      await adminAPI.updateShippingInfo(order.id, customerInfoDraft, selectedUserId);
      setEditingCustomerInfo(false);
      setSelectedUserId(null);
      setShowCreateUserForm(false);
      onUpdate();
    } catch (error) {
      console.error('Failed to update customer info:', error);
      alert('Failed to update customer info');
    } finally {
      setSavingCustomerInfo(false);
    }
  };

  const handleCancelCustomerEdit = () => {
    setEditingCustomerInfo(false);
    setCustomerInfoDraft({});
    setSelectedUserId(null);
    setShowCreateUserForm(false);
  };

  if (!order) return null;

  const customerEmail = order.shippingInfo?.email || order.email;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span>Request {order.orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`}</span>
          <span className={`px-2 py-0.5 rounded-full text-sm ${statusColors[order.status]}`}>
            {statusLabels[order.status]}
          </span>
        </div>
      }
      size="full"
    >
      <div className="p-6">
        {/* Status and Assignment Bar */}
        <div className="mb-6 pb-4 border-b border-gray-200 flex flex-wrap items-center gap-4">
          <div>
            <label className="text-xs text-gray-500 block mb-1">Status</label>
            <select
              value={order.status}
              onChange={(e) => handleStatusChange(e.target.value)}
              disabled={updatingStatus}
              className={`input py-2 ${statusColors[order.status]}`}
            >
              {statusOptions.map((status) => (
                <option key={status} value={status}>
                  {statusLabels[status]}
                </option>
              ))}
            </select>
          </div>
          <div>
            <label className="text-xs text-gray-500 block mb-1">Assigned To</label>
            <select
              value={order.assignedTo || ''}
              onChange={(e) => handleAssignmentChange(e.target.value)}
              disabled={updatingAssignment}
              className="input py-2"
            >
              <option value="">Unassigned</option>
              {admins?.map((admin) => (
                <option key={admin.id} value={admin.id}>
                  {admin.contactName || admin.email}
                </option>
              ))}
            </select>
          </div>
          <div className="ml-auto text-sm text-gray-500">
            Submitted {formatDatePT(order.createdAt, { weekday: 'long', month: 'long' })} PT
          </div>
        </div>

        {/* Three Column Layout */}
        <div className="grid lg:grid-cols-3 gap-6">
          {/* Column 1: Customer Info & Admin Notes */}
          <div className="space-y-6">
            {/* Customer Information */}
            <div>
              <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
                {order.shippingInfo?.isInternalOrder ? 'Contact Information' : 'Customer Information'}
                {!editingCustomerInfo && (
                  <button
                    onClick={handleEditCustomerInfo}
                    className="ml-auto p-1.5 text-gray-400 hover:text-academica-blue hover:bg-blue-50 rounded transition-colors"
                    title="Edit customer info"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                )}
              </h3>
              {order.shippingInfo?.isInternalOrder && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 mb-3 text-sm text-purple-800 font-medium">
                  Internal Academica Order
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
                {editingCustomerInfo ? (
                  <>
                    {/* Link to Registered User Section */}
                    <div className="mb-3 pb-3 border-b border-gray-200">
                      <label className="text-xs text-gray-500 uppercase tracking-wide mb-2 block">Link to Registered User</label>
                      {showCreateUserForm ? (
                        <InlineUserCreateForm
                          onCreated={handleUserCreated}
                          onCancel={() => setShowCreateUserForm(false)}
                          defaultEmail={customerInfoDraft.email}
                        />
                      ) : (
                        <UserDropdown
                          value={selectedUserId}
                          onChange={handleUserSelected}
                          onClear={() => setSelectedUserId(null)}
                          onCreateNew={() => setShowCreateUserForm(true)}
                          disabled={savingCustomerInfo}
                        />
                      )}
                      {selectedUserId && !showCreateUserForm && (
                        <div className="mt-2 text-xs text-green-600 flex items-center gap-1">
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                          User selected — fields populated below
                        </div>
                      )}
                    </div>

                    {order.shippingInfo?.isInternalOrder ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Contact</label>
                            <input type="text" value={customerInfoDraft.contactName} onChange={(e) => setCustomerInfoDraft(d => ({ ...d, contactName: e.target.value }))} className="input w-full mt-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Department</label>
                            <input type="text" value={customerInfoDraft.department} onChange={(e) => setCustomerInfoDraft(d => ({ ...d, department: e.target.value }))} className="input w-full mt-1 text-sm" />
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
                            <input type="email" value={customerInfoDraft.email} onChange={(e) => setCustomerInfoDraft(d => ({ ...d, email: e.target.value }))} className="input w-full mt-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Phone</label>
                            <input type="tel" value={customerInfoDraft.phone} onChange={(e) => setCustomerInfoDraft(d => ({ ...d, phone: e.target.value }))} className="input w-full mt-1 text-sm" />
                          </div>
                        </div>
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide">School Name</label>
                          <input type="text" value={customerInfoDraft.schoolName} onChange={(e) => setCustomerInfoDraft(d => ({ ...d, schoolName: e.target.value }))} className="input w-full mt-1 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Contact</label>
                            <input type="text" value={customerInfoDraft.contactName} onChange={(e) => setCustomerInfoDraft(d => ({ ...d, contactName: e.target.value }))} className="input w-full mt-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Position</label>
                            <input type="text" value={customerInfoDraft.positionTitle} onChange={(e) => setCustomerInfoDraft(d => ({ ...d, positionTitle: e.target.value }))} className="input w-full mt-1 text-sm" />
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide">Principal</label>
                          <input type="text" value={customerInfoDraft.principalName} onChange={(e) => setCustomerInfoDraft(d => ({ ...d, principalName: e.target.value }))} className="input w-full mt-1 text-sm" />
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
                            <input type="email" value={customerInfoDraft.email} onChange={(e) => setCustomerInfoDraft(d => ({ ...d, email: e.target.value }))} className="input w-full mt-1 text-sm" />
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Phone</label>
                            <input type="tel" value={customerInfoDraft.phone} onChange={(e) => setCustomerInfoDraft(d => ({ ...d, phone: e.target.value }))} className="input w-full mt-1 text-sm" />
                          </div>
                        </div>
                      </>
                    )}
                    <div className="flex gap-2 pt-2">
                      <button
                        onClick={handleSaveCustomerInfo}
                        disabled={savingCustomerInfo}
                        className="px-3 py-1.5 text-sm bg-academica-blue text-white rounded hover:bg-academica-blue-dark disabled:opacity-50"
                      >
                        {savingCustomerInfo ? 'Saving...' : 'Save'}
                      </button>
                      <button
                        onClick={handleCancelCustomerEdit}
                        disabled={savingCustomerInfo}
                        className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-800"
                      >
                        Cancel
                      </button>
                    </div>
                  </>
                ) : (
                  <>
                    {order.shippingInfo?.isInternalOrder ? (
                      <>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Contact</label>
                            <p className="font-medium text-charcoal">{order.shippingInfo?.contactName || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Department</label>
                            <p className="text-gray-900">{order.shippingInfo?.department || 'N/A'}</p>
                          </div>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
                            <p className="text-gray-900 break-all text-sm">{customerEmail || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Phone</label>
                            <p className="text-gray-900">{order.shippingInfo?.phone || 'N/A'}</p>
                          </div>
                        </div>
                        {order.shippingInfo?.additionalEmails?.length > 0 && (
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">CC Recipients</label>
                            <p className="text-gray-900 break-all text-sm">{order.shippingInfo.additionalEmails.join(', ')}</p>
                          </div>
                        )}
                      </>
                    ) : (
                      <>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide">School Name</label>
                          <p className="font-medium text-charcoal">{order.shippingInfo?.schoolName || order.schoolName || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Contact</label>
                            <p className="text-gray-900">{order.shippingInfo?.contactName || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Position</label>
                            <p className="text-gray-900">{order.shippingInfo?.positionTitle || 'N/A'}</p>
                          </div>
                        </div>
                        <div>
                          <label className="text-xs text-gray-500 uppercase tracking-wide">Principal</label>
                          <p className="text-gray-900">{order.shippingInfo?.principalName || 'N/A'}</p>
                        </div>
                        <div className="grid grid-cols-2 gap-3">
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Email</label>
                            <p className="text-gray-900 break-all text-sm">{customerEmail || 'N/A'}</p>
                          </div>
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">Phone</label>
                            <p className="text-gray-900">{order.shippingInfo?.phone || 'N/A'}</p>
                          </div>
                        </div>
                        {order.shippingInfo?.additionalEmails?.length > 0 && (
                          <div>
                            <label className="text-xs text-gray-500 uppercase tracking-wide">CC Recipients</label>
                            <p className="text-gray-900 break-all text-sm">{order.shippingInfo.additionalEmails.join(', ')}</p>
                          </div>
                        )}
                      </>
                    )}
                  </>
                )}
              </div>
            </div>

            {/* Special Instructions */}
            {order.notes && (
              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                <h4 className="font-medium text-yellow-800 mb-2">Special Instructions</h4>
                <p className="text-sm text-yellow-800">{order.notes}</p>
              </div>
            )}

            {/* Admin Notes */}
            <div>
              <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
                <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
                </svg>
                Admin Notes
              </h3>

              {/* Add new note */}
              <div className="mb-4">
                <textarea
                  value={newNote}
                  onChange={(e) => setNewNote(e.target.value)}
                  placeholder="Add a note..."
                  rows={2}
                  className="input w-full mb-2"
                />
                <button
                  onClick={handleAddNote}
                  disabled={addingNote || !newNote.trim()}
                  className="btn btn-primary py-1.5 px-4 text-sm"
                >
                  {addingNote ? 'Adding...' : 'Add Note'}
                </button>
              </div>

              {/* Notes list */}
              <div className="space-y-3 max-h-64 overflow-y-auto">
                {loadingNotes ? (
                  <div className="text-center py-4">
                    <div className="h-5 w-5 animate-spin rounded-full border-2 border-gray-200 border-t-academica-blue mx-auto"></div>
                  </div>
                ) : notes.length > 0 ? (
                  notes.map((note) => (
                    <div key={note.id} className="bg-gray-50 rounded-lg p-3 border border-gray-200">
                      <div className="flex justify-between items-start mb-1">
                        <span className="font-medium text-charcoal text-sm">{note.adminName}</span>
                        {note.adminId === user?.id && (
                          <button
                            onClick={() => handleDeleteNote(note.id)}
                            className="text-gray-400 hover:text-red-500 text-xs"
                          >
                            Delete
                          </button>
                        )}
                      </div>
                      <p className="text-gray-700 text-sm whitespace-pre-wrap">{note.note}</p>
                      <p className="text-gray-400 text-xs mt-1">
                        {formatDatePT(note.createdAt, { year: undefined })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No notes yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Request Items */}
          <div>
            <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Request Items ({order.items?.length || 0})
            </h3>
            <div className="max-h-[calc(90vh-300px)] overflow-y-auto">
              <OrderItemEditor
                items={order.items}
                onUpdate={handleUpdateItems}
                saving={savingItems}
              />
            </div>
          </div>

          {/* Column 3: Communications & Proofs */}
          <div>
            {/* Tab Headers */}
            <div className="flex border-b border-gray-200 mb-4">
              <button
                onClick={() => setActiveTab('communications')}
                className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'communications'
                    ? 'border-academica-blue text-academica-blue'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
                Communications
              </button>
              <button
                onClick={() => setActiveTab('proofs')}
                className={`flex items-center gap-2 px-4 py-2 font-medium text-sm border-b-2 transition-colors ${
                  activeTab === 'proofs'
                    ? 'border-purple-600 text-purple-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700'
                }`}
              >
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Proofs
                {proofs.length > 0 && (
                  <span className="bg-purple-100 text-purple-700 text-xs px-1.5 py-0.5 rounded-full">
                    {proofs.length}
                  </span>
                )}
              </button>
            </div>

            {/* Communications Tab */}
            {activeTab === 'communications' && (
              <>
                {/* CC Email Management */}
                <div className="mb-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
                      <svg className="w-4 h-4 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                      CC Recipients
                    </label>
                  </div>

                  {/* Current CC Emails */}
                  {ccEmails.length > 0 && (
                    <div className="flex flex-wrap gap-2 mb-2">
                      {ccEmails.map((email) => (
                        <span
                          key={email}
                          className="inline-flex items-center gap-1 px-2 py-1 bg-white border border-gray-300 rounded-md text-sm text-gray-700"
                        >
                          {email}
                          <button
                            onClick={() => handleRemoveCcEmail(email)}
                            disabled={savingCc}
                            className="text-gray-400 hover:text-red-500 disabled:opacity-50"
                            title="Remove"
                          >
                            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                            </svg>
                          </button>
                        </span>
                      ))}
                    </div>
                  )}

                  {/* Add New CC Email */}
                  <div className="flex gap-2">
                    <input
                      type="email"
                      value={newCcEmail}
                      onChange={(e) => setNewCcEmail(e.target.value)}
                      onKeyPress={(e) => e.key === 'Enter' && handleAddCcEmail()}
                      placeholder="Add CC email..."
                      className="flex-1 text-sm px-3 py-1.5 border border-gray-300 rounded-md focus:ring-academica-blue focus:border-academica-blue"
                    />
                    <button
                      onClick={handleAddCcEmail}
                      disabled={savingCc || !newCcEmail.trim()}
                      className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 disabled:opacity-50 flex items-center gap-1"
                    >
                      {savingCc ? (
                        <div className="w-4 h-4 border-2 border-gray-300 border-t-gray-600 rounded-full animate-spin"></div>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                          </svg>
                          Add
                        </>
                      )}
                    </button>
                  </div>
                </div>

                {/* Email Composer */}
                {customerEmail && (
                  <div className="mb-4">
                    <EmailComposer
                      recipientEmail={customerEmail}
                      orderNumber={order.orderNumber}
                      order={{ ...order, shippingInfo: { ...order.shippingInfo, additionalEmails: ccEmails } }}
                      onSend={handleSendEmail}
                      sending={sendingEmail}
                    />
                  </div>
                )}

                {/* Communication Feed */}
                <div className="max-h-[calc(90vh-400px)] overflow-y-auto">
                  <CommunicationFeed
                    communications={communications}
                    loading={loadingComms}
                  />
                </div>
              </>
            )}

            {/* Proofs Tab */}
            {activeTab === 'proofs' && (
              <div className="max-h-[calc(90vh-350px)] overflow-y-auto">
                <ProofManager
                  orderId={order.id}
                  orderNumber={order.orderNumber}
                  proofs={proofs}
                  ccEmails={ccEmails}
                  newCcEmail={newCcEmail}
                  setNewCcEmail={setNewCcEmail}
                  savingCc={savingCc}
                  onAddCcEmail={handleAddCcEmail}
                  onRemoveCcEmail={handleRemoveCcEmail}
                  onUpdate={() => {
                    loadProofs();
                    loadCommunications();
                  }}
                />
              </div>
            )}
          </div>
        </div>
      </div>
    </Modal>
  );
}
