import { useState, useEffect } from 'react';
import Modal from '../common/Modal';
import OrderItemEditor from './OrderItemEditor';
import CommunicationFeed from './CommunicationFeed';
import EmailComposer from './EmailComposer';
import { adminAPI } from '../../services/api';

const statusOptions = ['new', 'waiting_feedback', 'in_progress', 'on_hold', 'waiting_signoff', 'sent_to_print', 'completed'];

const statusColors = {
  new: 'bg-blue-100 text-blue-800',
  waiting_feedback: 'bg-yellow-100 text-yellow-800',
  in_progress: 'bg-indigo-100 text-indigo-800',
  on_hold: 'bg-orange-100 text-orange-800',
  waiting_signoff: 'bg-purple-100 text-purple-800',
  sent_to_print: 'bg-cyan-100 text-cyan-800',
  completed: 'bg-green-100 text-green-800',
};

const statusLabels = {
  new: 'New',
  waiting_feedback: 'Waiting for Feedback',
  in_progress: 'In Progress',
  on_hold: 'On Hold',
  waiting_signoff: 'Waiting for Sign Off',
  sent_to_print: 'Sent to Print',
  completed: 'Completed',
};

export default function OrderDetailModal({ order, isOpen, onClose, onUpdate, admins, user }) {
  const [notes, setNotes] = useState([]);
  const [communications, setCommunications] = useState([]);
  const [newNote, setNewNote] = useState('');
  const [loadingNotes, setLoadingNotes] = useState(false);
  const [loadingComms, setLoadingComms] = useState(false);
  const [addingNote, setAddingNote] = useState(false);
  const [savingItems, setSavingItems] = useState(false);
  const [sendingEmail, setSendingEmail] = useState(false);
  const [updatingStatus, setUpdatingStatus] = useState(false);
  const [updatingAssignment, setUpdatingAssignment] = useState(false);

  useEffect(() => {
    if (isOpen && order) {
      loadNotes();
      loadCommunications();
    }
  }, [isOpen, order?.id]);

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

  const handleSendEmail = async ({ subject, body, attachments = [] }) => {
    setSendingEmail(true);
    try {
      await adminAPI.sendOrderEmail(order.id, subject, body, attachments);
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

  if (!order) return null;

  const customerEmail = order.shippingInfo?.email || order.email;

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-3">
          <span>Order {order.orderNumber || `#${order.id.slice(0, 8).toUpperCase()}`}</span>
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
            Placed {new Date(order.createdAt).toLocaleDateString('en-US', {
              weekday: 'long',
              month: 'long',
              day: 'numeric',
              year: 'numeric',
              hour: '2-digit',
              minute: '2-digit',
            })}
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
              </h3>
              {order.shippingInfo?.isInternalOrder && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg px-3 py-2 mb-3 text-sm text-purple-800 font-medium">
                  Internal Academica Order
                </div>
              )}
              <div className="bg-gray-50 rounded-lg p-4 space-y-3">
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
                        {new Date(note.createdAt).toLocaleDateString('en-US', {
                          month: 'short',
                          day: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </p>
                    </div>
                  ))
                ) : (
                  <p className="text-gray-500 text-sm">No notes yet</p>
                )}
              </div>
            </div>
          </div>

          {/* Column 2: Order Items */}
          <div>
            <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Order Items ({order.items?.length || 0})
            </h3>
            <div className="max-h-[calc(90vh-300px)] overflow-y-auto">
              <OrderItemEditor
                items={order.items}
                onUpdate={handleUpdateItems}
                saving={savingItems}
              />
            </div>
          </div>

          {/* Column 3: Communications */}
          <div>
            <h3 className="font-semibold text-charcoal mb-4 flex items-center gap-2">
              <svg className="w-5 h-5 text-academica-blue" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
              </svg>
              Email Communications
            </h3>

            {/* Email Composer */}
            {customerEmail && (
              <div className="mb-4">
                <EmailComposer
                  recipientEmail={customerEmail}
                  orderNumber={order.orderNumber}
                  order={order}
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
          </div>
        </div>
      </div>
    </Modal>
  );
}
