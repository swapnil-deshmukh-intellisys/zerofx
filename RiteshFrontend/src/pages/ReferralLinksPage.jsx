import React, { useState, useEffect } from 'react';
import Header from '../components/Header';
import { referralAPI } from '../services/api';
import { FaCopy, FaEdit, FaTrash, FaToggleOn, FaToggleOff, FaPlus, FaTimes, FaUsers, FaEye } from 'react-icons/fa';

const ReferralLinksPage = ({ onBack, onSignOut, onProfileClick, onReferralLinksClick }) => {
  const [referralLinks, setReferralLinks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedLink, setSelectedLink] = useState(null);
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [linkToDelete, setLinkToDelete] = useState(null);
  const [customId, setCustomId] = useState('');
  const [error, setError] = useState('');
  const [detailLoading, setDetailLoading] = useState(false);

  // Load all referral links
  const loadReferralLinks = async () => {
    try {
      setLoading(true);
      const response = await referralAPI.getAllReferralLinks();
      if (response.success) {
        setReferralLinks(response.referralLinks || []);
      }
    } catch (error) {
      console.error('Error loading referral links:', error);
      setError('Failed to load referral links');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    loadReferralLinks();
  }, []);

  // Load detailed info for a referral link
  const loadLinkDetails = async (id) => {
    try {
      setDetailLoading(true);
      const response = await referralAPI.getReferralLinkById(id);
      if (response.success) {
        setSelectedLink(response.referralLink);
      }
    } catch (error) {
      console.error('Error loading link details:', error);
      alert('Failed to load link details');
    } finally {
      setDetailLoading(false);
    }
  };

  // Handle link click - show details
  const handleLinkClick = (link) => {
    loadLinkDetails(link._id || link.id);
  };

  // Create new referral link
  const handleCreate = async () => {
    if (!customId.trim()) {
      setError('Custom ID is required');
      return;
    }

    try {
      setError('');
      const response = await referralAPI.createReferralLink(customId.trim());
      if (response.success) {
        setShowCreateModal(false);
        setCustomId('');
        loadReferralLinks();
      }
    } catch (error) {
      setError(error.message || 'Failed to create referral link');
    }
  };

  // Update referral link
  const handleUpdate = async () => {
    if (!customId.trim()) {
      setError('Custom ID is required');
      return;
    }

    try {
      setError('');
      const response = await referralAPI.updateReferralLink(selectedLink._id || selectedLink.id, customId.trim());
      if (response.success) {
        setShowEditModal(false);
        setCustomId('');
        setSelectedLink(null);
        loadReferralLinks();
      }
    } catch (error) {
      setError(error.message || 'Failed to update referral link');
    }
  };

  // Delete referral link
  const handleDelete = async () => {
    try {
      const response = await referralAPI.deleteReferralLink(linkToDelete._id || linkToDelete.id);
      if (response.success) {
        setShowDeleteModal(false);
        setLinkToDelete(null);
        if (selectedLink && (selectedLink._id === linkToDelete._id || selectedLink.id === linkToDelete.id)) {
          setSelectedLink(null);
        }
        loadReferralLinks();
      }
    } catch (error) {
      alert(error.message || 'Failed to delete referral link');
    }
  };

  // Toggle link status
  const handleToggleStatus = async (link) => {
    try {
      const response = await referralAPI.toggleReferralLinkStatus(link._id || link.id);
      if (response.success) {
        loadReferralLinks();
        if (selectedLink && (selectedLink._id === link._id || selectedLink.id === link.id)) {
          loadLinkDetails(link._id || link.id);
        }
      }
    } catch (error) {
      alert(error.message || 'Failed to toggle link status');
    }
  };

  // Copy link to clipboard
  const handleCopyLink = (link) => {
    navigator.clipboard.writeText(link);
    alert('Link copied to clipboard!');
  };

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-bg-primary via-bg-secondary to-bg-primary">
      <Header
        userEmail="admin@forex.com"
        onSignOut={onSignOut}
        onProfileClick={onProfileClick}
        onBack={onBack}
        showBackButton={true}
        isAdmin={true}
        onHomeClick={() => window.location.href = '/'}
        onReferralLinksClick={onReferralLinksClick}
      />

      <main className="py-6">
        <div className="container-custom">
          <div className="flex justify-between items-center mb-8">
            <div>
              <h1 className="text-4xl font-bold mb-4">
                <span className="text-text-primary">Referral</span>{' '}
                <span className="text-accent-color bg-gradient-to-r from-accent-color to-primary-blue bg-clip-text text-transparent">
                  Links
                </span>
              </h1>
              <p className="text-xl text-text-secondary">Manage influencer referral links and track performance</p>
            </div>
            <button
              onClick={() => setShowCreateModal(true)}
              className="bg-accent-color text-text-quaternary font-semibold px-6 py-3 rounded-xl hover:bg-accent-color/90 transition-all duration-300 flex items-center space-x-2"
            >
              <FaPlus />
              <span>Create New Link</span>
            </button>
          </div>

          {loading ? (
            <div className="text-center py-12">
              <div className="text-text-secondary">Loading referral links...</div>
            </div>
          ) : referralLinks.length === 0 ? (
            <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-12 text-center">
              <div className="text-6xl mb-4">🔗</div>
              <h3 className="text-2xl font-bold text-text-primary mb-4">No Referral Links Yet</h3>
              <p className="text-text-secondary mb-6">Create your first referral link to start tracking influencers</p>
              <button
                onClick={() => setShowCreateModal(true)}
                className="bg-accent-color text-text-quaternary font-semibold px-6 py-3 rounded-xl hover:bg-accent-color/90 transition-all duration-300"
              >
                Create First Link
              </button>
            </div>
          ) : (
            <div className="grid lg:grid-cols-3 gap-6">
              {/* Links List */}
              <div className="lg:col-span-1">
                <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-6">
                  <h2 className="text-xl font-bold text-text-primary mb-4">All Links</h2>
                  <div className="space-y-3 max-h-[600px] overflow-y-auto">
                    {referralLinks.map((link) => (
                      <div
                        key={link._id || link.id}
                        onClick={() => handleLinkClick(link)}
                        className={`p-4 rounded-xl border cursor-pointer transition-all duration-300 ${
                          selectedLink && (selectedLink._id === link._id || selectedLink.id === link.id)
                            ? 'border-accent-color bg-accent-color/10'
                            : 'border-border-color hover:border-accent-color/50 hover:bg-hover-bg'
                        }`}
                      >
                        <div className="flex justify-between items-start mb-2">
                          <div className="flex-1">
                            <h3 className="font-semibold text-text-primary">{link.customId}</h3>
                            <p className="text-sm text-text-secondary truncate">{link.link}</p>
                          </div>
                          <span
                            className={`px-2 py-1 rounded text-xs font-semibold ${
                              link.isActive
                                ? 'bg-success-color/20 text-success-color'
                                : 'bg-danger-color/20 text-danger-color'
                            }`}
                          >
                            {link.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm text-text-secondary mt-2">
                          <div className="flex items-center space-x-4">
                            <span className="flex items-center space-x-1">
                              <FaEye />
                              <span>{link.visitorCount || 0}</span>
                            </span>
                            <span className="flex items-center space-x-1">
                              <FaUsers />
                              <span>{link.signupCount || 0}</span>
                            </span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Link Details */}
              <div className="lg:col-span-2">
                {selectedLink ? (
                  <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-6">
                    {detailLoading ? (
                      <div className="text-center py-12">
                        <div className="text-text-secondary">Loading details...</div>
                      </div>
                    ) : (
                      <>
                        <div className="flex justify-between items-start mb-6">
                          <div>
                            <h2 className="text-2xl font-bold text-text-primary mb-2">{selectedLink.customId}</h2>
                            <div className="flex items-center space-x-2 mb-4">
                              <input
                                type="text"
                                value={selectedLink.link}
                                readOnly
                                className="flex-1 bg-bg-secondary border border-border-color rounded-lg px-4 py-2 text-text-primary"
                              />
                              <button
                                onClick={() => handleCopyLink(selectedLink.link)}
                                className="bg-accent-color text-text-quaternary px-4 py-2 rounded-lg hover:bg-accent-color/90 transition-colors"
                                title="Copy link"
                              >
                                <FaCopy />
                              </button>
                            </div>
                          </div>
                          <div className="flex items-center space-x-2">
                            <button
                              onClick={() => {
                                setCustomId(selectedLink.customId);
                                setShowEditModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-hover-bg text-text-primary transition-colors"
                              title="Edit"
                            >
                              <FaEdit />
                            </button>
                            <button
                              onClick={() => handleToggleStatus(selectedLink)}
                              className="p-2 rounded-lg hover:bg-hover-bg text-text-primary transition-colors"
                              title={selectedLink.isActive ? 'Deactivate' : 'Activate'}
                            >
                              {selectedLink.isActive ? <FaToggleOn className="text-success-color" /> : <FaToggleOff className="text-text-secondary" />}
                            </button>
                            <button
                              onClick={() => {
                                setLinkToDelete(selectedLink);
                                setShowDeleteModal(true);
                              }}
                              className="p-2 rounded-lg hover:bg-danger-color/20 text-danger-color transition-colors"
                              title="Delete"
                            >
                              <FaTrash />
                            </button>
                          </div>
                        </div>

                        <div className="grid grid-cols-2 gap-4 mb-6">
                          <div className="bg-bg-secondary rounded-xl p-4">
                            <div className="text-text-secondary text-sm mb-1">Total Visitors</div>
                            <div className="text-2xl font-bold text-text-primary">{selectedLink.visitorCount || 0}</div>
                          </div>
                          <div className="bg-bg-secondary rounded-xl p-4">
                            <div className="text-text-secondary text-sm mb-1">Total Signups</div>
                            <div className="text-2xl font-bold text-text-primary">{selectedLink.signupCount || 0}</div>
                          </div>
                        </div>

                        <div className="mb-4">
                          <h3 className="text-lg font-bold text-text-primary mb-4">Users Who Signed Up</h3>
                          {selectedLink.users && selectedLink.users.length > 0 ? (
                            <div className="space-y-2 max-h-[400px] overflow-y-auto">
                              {selectedLink.users.map((user, index) => (
                                <div
                                  key={index}
                                  className="bg-bg-secondary rounded-lg p-4 flex justify-between items-center"
                                >
                                  <div>
                                    <div className="font-semibold text-text-primary">{user.email}</div>
                                    {user.fullName && (
                                      <div className="text-sm text-text-secondary">{user.fullName}</div>
                                    )}
                                    <div className="text-xs text-text-tertiary mt-1">
                                      Signed up: {formatDate(user.signupDate)}
                                    </div>
                                  </div>
                                </div>
                              ))}
                            </div>
                          ) : (
                            <div className="bg-bg-secondary rounded-lg p-8 text-center">
                              <div className="text-text-secondary">No users have signed up via this link yet</div>
                            </div>
                          )}
                        </div>

                        <div className="text-sm text-text-tertiary">
                          Created: {formatDate(selectedLink.createdAt)} | Last updated: {formatDate(selectedLink.updatedAt)}
                        </div>
                      </>
                    )}
                  </div>
                ) : (
                  <div className="bg-card-bg backdrop-blur-sm border border-border-color rounded-2xl p-12 text-center">
                    <div className="text-6xl mb-4">👆</div>
                    <h3 className="text-xl font-bold text-text-primary mb-2">Select a Link</h3>
                    <p className="text-text-secondary">Click on a referral link from the list to view its details</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </main>

      {/* Create Modal */}
      {showCreateModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-border-color rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary">Create New Referral Link</h3>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCustomId('');
                  setError('');
                }}
                className="text-text-secondary hover:text-text-primary"
              >
                <FaTimes />
              </button>
            </div>
            {error && <div className="bg-danger-color/20 text-danger-color p-3 rounded-lg mb-4">{error}</div>}
            <div className="mb-4">
              <label className="block text-text-primary font-semibold mb-2">Custom ID (Influencer Name)</label>
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="e.g., John_Doe, Influencer_1"
                className="w-full bg-bg-secondary border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-color"
              />
              <p className="text-xs text-text-tertiary mt-1">This will be used in the referral link: ?ref=CustomID</p>
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleCreate}
                className="flex-1 bg-accent-color text-text-quaternary font-semibold px-4 py-2 rounded-lg hover:bg-accent-color/90 transition-colors"
              >
                Create
              </button>
              <button
                onClick={() => {
                  setShowCreateModal(false);
                  setCustomId('');
                  setError('');
                }}
                className="flex-1 bg-bg-secondary text-text-primary font-semibold px-4 py-2 rounded-lg hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {showEditModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-border-color rounded-2xl p-6 max-w-md w-full">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-xl font-bold text-text-primary">Edit Referral Link</h3>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setCustomId('');
                  setError('');
                }}
                className="text-text-secondary hover:text-text-primary"
              >
                <FaTimes />
              </button>
            </div>
            {error && <div className="bg-danger-color/20 text-danger-color p-3 rounded-lg mb-4">{error}</div>}
            <div className="mb-4">
              <label className="block text-text-primary font-semibold mb-2">Custom ID (Influencer Name)</label>
              <input
                type="text"
                value={customId}
                onChange={(e) => setCustomId(e.target.value)}
                placeholder="e.g., John_Doe, Influencer_1"
                className="w-full bg-bg-secondary border border-border-color rounded-lg px-4 py-2 text-text-primary focus:outline-none focus:border-accent-color"
              />
            </div>
            <div className="flex space-x-3">
              <button
                onClick={handleUpdate}
                className="flex-1 bg-accent-color text-text-quaternary font-semibold px-4 py-2 rounded-lg hover:bg-accent-color/90 transition-colors"
              >
                Update
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setCustomId('');
                  setError('');
                }}
                className="flex-1 bg-bg-secondary text-text-primary font-semibold px-4 py-2 rounded-lg hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && linkToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
          <div className="bg-card-bg border border-border-color rounded-2xl p-6 max-w-md w-full">
            <h3 className="text-xl font-bold text-text-primary mb-4">Delete Referral Link</h3>
            <p className="text-text-secondary mb-6">
              Are you sure you want to delete the referral link for <strong>{linkToDelete.customId}</strong>? This action cannot be undone.
            </p>
            <div className="flex space-x-3">
              <button
                onClick={handleDelete}
                className="flex-1 bg-danger-color text-text-quaternary font-semibold px-4 py-2 rounded-lg hover:bg-danger-color/90 transition-colors"
              >
                Delete
              </button>
              <button
                onClick={() => {
                  setShowDeleteModal(false);
                  setLinkToDelete(null);
                }}
                className="flex-1 bg-bg-secondary text-text-primary font-semibold px-4 py-2 rounded-lg hover:bg-hover-bg transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ReferralLinksPage;

